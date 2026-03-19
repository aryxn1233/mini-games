'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../hooks/useGameStore';
import { LastHonestGameState } from '../shared/types';
import { supabase } from '../lib/supabase';

export function LastHonestBoard() {
    const { gameState, makeMove, player, room } = useGameStore();
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [votedPlayerId, setVotedPlayerId] = useState<string | null>(null);
    const [showRules, setShowRules] = useState(false);

    if (!gameState || !player || !room) return null;

    const RulesModal = () => (
        <AnimatePresence>
            {showRules && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
                    onClick={() => setShowRules(false)}
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        className="bg-[#1a1c2c] border-4 border-purple-500/50 rounded-[40px] p-8 max-w-lg w-full shadow-[0_20px_50px_rgba(147,51,234,0.3)] relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setShowRules(false)}
                            className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors text-2xl"
                        >
                            ✕
                        </button>
                        <h2 className="text-3xl font-black text-white mb-6 uppercase tracking-tighter">How to Play 📖</h2>
                        <div className="space-y-6 text-white/80 font-medium">
                            <div className="flex gap-4">
                                <span className="text-2xl">☝️</span>
                                <p><span className="text-purple-400 font-bold">The Setup:</span> One player is chosen as the Question Setter to create a question for the squad.</p>
                            </div>
                            <div className="flex gap-4">
                                <span className="text-2xl">🎭</span>
                                <p><span className="text-purple-400 font-bold">The Roles:</span> One player is secretly <span className="text-green-400">Honest</span>, while everyone else are <span className="text-red-400">Liars</span>.</p>
                            </div>
                            <div className="flex gap-4">
                                <span className="text-2xl">💬</span>
                                <p><span className="text-purple-400 font-bold">The Answers:</span> Everyone submits an answer. The Honest player must tell the truth, while Liars attempt to deceive.</p>
                            </div>
                            <div className="flex gap-4">
                                <span className="text-2xl">🕵️‍♂️</span>
                                <p><span className="text-purple-400 font-bold">The Vote:</span> After answers are revealed, everyone votes for the player they think is Honest.</p>
                            </div>
                            <div className="flex gap-4">
                                <span className="text-2xl">🏆</span>
                                <p><span className="text-purple-400 font-bold">Winning:</span> Liars win by correctly guessing the Honest player. The Honest player wins if they remain undetected!</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowRules(false)}
                            className="btn-primary w-full mt-8 py-4 text-xl"
                        >
                            GOT IT! 🚀
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    const RulesButton = () => (
        <button
            onClick={() => setShowRules(true)}
            className="fixed top-4 right-4 z-50 bg-white/10 hover:bg-white/20 text-white w-10 h-10 rounded-full border border-white/20 flex items-center justify-center transition-all group"
        >
            <span className="text-xl group-hover:scale-110 transition-transform">ℹ️</span>
        </button>
    );
    const honestState = gameState as LastHonestGameState;
    const isSetter = player.id === honestState.questionSetterId;
    const isHonest = player.id === honestState.honestPlayerId || (honestState as any).isHonest;

    // 1. WAITING FOR QUESTION
    if (honestState.status === 'WAITING') {
        return (
            <div className="flex flex-col items-center gap-6 md:gap-8 w-full max-w-2xl px-2 py-4 md:px-4 md:py-8">
                <RulesButton />
                <RulesModal />
                <div className="text-center space-y-4">
                    <h3 className="text-3xl md:text-5xl font-black candy-text uppercase tracking-tighter">
                        ROUND {honestState.currentRound}
                    </h3>
                    <div className="p-8 md:p-12 bg-white/5 border-4 border-white/10 rounded-[40px] shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 text-6xl opacity-10">❓</div>
                        <h4 className="text-xl md:text-3xl font-black text-white uppercase mb-4">
                            {isSetter ? "YOUR TURN TO ASK!" : "WAITING FOR QUESTION..."}
                        </h4>
                        {isSetter ? (
                            <div className="space-y-6">
                                <p className="text-white/60 font-bold">Ask something personal or tricky!</p>
                                <textarea
                                    value={question}
                                    onChange={(e) => setQuestion(e.target.value)}
                                    placeholder="e.g. What is my biggest fear? or What did I eat today?"
                                    className="w-full bg-black/40 rounded-3xl p-6 text-xl font-bold text-white placeholder:text-white/20 border-4 border-white/10 focus:border-yellow-400 outline-none transition-all min-h-[120px] resize-none"
                                />
                                <button
                                    onClick={() => makeMove({ question })}
                                    disabled={question.trim().length < 3}
                                    className="btn-primary w-full py-6 text-2xl shadow-[0_10px_30px_rgba(250,204,21,0.3)] disabled:opacity-50"
                                >
                                    ASK SQUAD! 🔥
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-6 py-8">
                                <div className="w-20 h-20 border-8 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                                <p className="text-2xl font-black text-white/30 animate-pulse">
                                    {(room.players.find(p => p.id === honestState.questionSetterId))?.username} is thinking...
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // 2. SUBMITTING ANSWERS
    if (honestState.status === 'SUBMITTING') {
        const hasSubmitted = !!honestState.answers[player.id];

        return (
            <div className="flex flex-col items-center gap-6 md:gap-8 w-full max-w-2xl px-2 py-4 md:px-4 md:py-8">
                <RulesButton />
                <RulesModal />
                <div className="text-center space-y-4 w-full">
                    <div className="w-full flex justify-center mb-4">
                        <span className={`px-6 py-2 rounded-full text-sm font-black uppercase tracking-widest border-2 ${isHonest ? 'bg-green-500/20 border-green-500 text-green-500' : 'bg-red-500/20 border-red-500 text-red-500'}`}>
                            {isHonest ? 'ROLE: HONEST PLAYER 😇' : 'ROLE: LIAR 😈'}
                        </span>
                    </div>

                    <div className="p-6 md:p-10 bg-white/5 border-4 border-white/10 rounded-[40px] shadow-2xl relative overflow-hidden backdrop-blur-xl">
                        <p className="text-white/40 text-xs font-black uppercase tracking-widest mb-2">The Question:</p>
                        <p className="text-2xl md:text-4xl font-black text-white leading-tight italic">
                            "{honestState.question}"
                        </p>
                    </div>

                    {!hasSubmitted ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="w-full space-y-4 mt-8"
                        >
                            <p className="text-white/60 font-bold mb-2">
                                {isHonest
                                    ? "Tell the absolute truth. Make them believe you!"
                                    : "BULLSHIT YOUR WAY THROUGH! Be convincing."}
                            </p>
                            <input
                                type="text"
                                value={answer}
                                onChange={(e) => setAnswer(e.target.value)}
                                placeholder="Your answer..."
                                className="w-full bg-white/10 rounded-2xl p-6 text-2xl font-black text-center border-4 border-white/10 focus:border-purple-500 outline-none transition-all"
                            />
                            <button
                                onClick={() => makeMove({ answer })}
                                disabled={answer.trim().length < 1}
                                className="btn-primary w-full py-6 text-2xl shadow-[0_10px_30px_rgba(250,204,21,0.3)] disabled:opacity-50"
                            >
                                SUBMIT ANSWER 🚀
                            </button>
                        </motion.div>
                    ) : (
                        <div className="mt-12 space-y-6">
                            <div className="text-6xl animate-bounce">✅</div>
                            <h4 className="text-3xl font-black text-white">ANSWER LOCKED!</h4>
                            <p className="text-white/20 font-black uppercase animate-pulse">Waiting for the squad to finish lying...</p>
                            <div className="flex justify-center gap-2">
                                {room.players.map(p => (
                                    <div key={p.id} className={`w-4 h-4 rounded-full transition-all duration-500 ${honestState.answers[p.id] ? 'bg-green-400 shadow-[0_0_15px_#4ade80]' : 'bg-white/10'}`} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // 3. VOTING PHASE
    if (honestState.status === 'VOTING') {
        const hasVoted = !!honestState.votes[player.id];

        return (
            <div className="flex flex-col items-center gap-8 w-full max-w-5xl px-2 py-4">
                <RulesButton />
                <RulesModal />
                <div className="text-center space-y-4">
                    <h3 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter italic">
                        "FIND THE HONEST PLAYER" 🕵️‍♂️
                    </h3>
                    <p className="text-purple-400 font-black uppercase tracking-[0.3em] text-xs md:text-sm">
                        One of these people is telling the truth. The others are lying.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full mt-4">
                    {room.players.map((p) => (
                        <motion.div
                            key={p.id}
                            whileHover={!hasVoted && p.id !== player.id ? { scale: 1.02, y: -5 } : {}}
                            onClick={() => !hasVoted && p.id !== player.id && makeMove({ votedPlayerId: p.id })}
                            className={`p-6 rounded-[32px] border-4 transition-all cursor-pointer relative overflow-hidden group ${honestState.votes[player.id] === p.id
                                ? 'bg-purple-600 border-purple-400 shadow-[0_0_30px_rgba(147,51,234,0.5)]'
                                : hasVoted || p.id === player.id
                                    ? 'bg-white/5 border-white/5 opacity-60 grayscale'
                                    : 'bg-white/5 border-white/10 hover:border-purple-500'
                                }`}
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-xl font-black text-white shadow-xl">
                                    {p.username[0].toUpperCase()}
                                </div>
                                <span className="font-black text-xl text-white truncate">{p.username}</span>
                                {p.id === player.id && <span className="text-[10px] bg-white/20 px-2 py-1 rounded-full text-white/50 font-black">YOU</span>}
                            </div>
                            <div className="bg-black/30 p-4 rounded-2xl border border-white/5 h-24 flex items-center justify-center italic font-bold text-white overflow-hidden text-ellipsis">
                                "{honestState.answers[p.id]}"
                            </div>
                            {!hasVoted && p.id !== player.id && (
                                <div className="absolute inset-x-0 bottom-0 py-2 bg-purple-500 text-center text-[10px] font-black transform translate-y-full group-hover:translate-y-0 transition-transform">
                                    VOTE FOR HONESTY 👆
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>

                {hasVoted && (
                    <div className="mt-8 text-center animate-pulse">
                        <p className="text-yellow-400 text-2xl font-black uppercase tracking-widest">Awaiting the Verdict... ⚖️</p>
                    </div>
                )}
            </div>
        );
    }

    // 4. REVEALING RESULTS
    if (honestState.status === 'REVEALING') {
        const isHonestPlayerDetected = Object.values(honestState.votes).filter(v => v === honestState.honestPlayerId).length > (room.players.length - 1) / 2;
        const honestPlayer = room.players.find(p => p.id === honestState.honestPlayerId);

        return (
            <div className="flex flex-col items-center gap-8 w-full max-w-4xl px-2 py-4">
                <RulesButton />
                <RulesModal />
                <div className="text-center mb-8">
                    <h3 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter italic mb-4">
                        THE TRUTH REVEALED! 🎭
                    </h3>
                </div>

                <div className="w-full grid md:grid-cols-2 gap-8">
                    {/* The Honest Player Reveal Card */}
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="bg-green-500/10 border-4 border-green-500 p-8 rounded-[40px] text-center space-y-6 shadow-[0_0_50px_rgba(34,197,94,0.3)]"
                    >
                        <p className="text-green-500 font-black uppercase tracking-[0.3em] text-sm">THE ONLY HONEST PLAYER WAS</p>
                        <div className="w-32 h-32 rounded-full bg-green-500 mx-auto flex items-center justify-center text-6xl shadow-2xl border-4 border-white">
                            {honestPlayer?.username[0].toUpperCase()}
                        </div>
                        <h4 className="text-4xl md:text-5xl font-black text-white">{honestPlayer?.username}</h4>
                        <div className="bg-black/20 p-6 rounded-3xl border border-white/10">
                            <p className="text-white/40 text-xs font-black mb-2 uppercase italic">Their True Words:</p>
                            <p className="text-2xl md:text-3xl font-black text-green-400 italic">"{honestState.answers[honestState.honestPlayerId!]}"</p>
                        </div>
                    </motion.div>

                    {/* Stats & Actions */}
                    <div className="space-y-6">
                        <div className="card bg-white/5 border-white/10 p-8 space-y-6">
                            <h4 className="text-xl font-black text-white/50 uppercase tracking-widest border-b border-white/10 pb-4">Voting Breakdown</h4>
                            <div className="space-y-3">
                                {room.players.map(p => {
                                    const votedForId = honestState.votes[p.id];
                                    const target = room.players.find(x => x.id === votedForId);
                                    const isCorrect = votedForId === honestState.honestPlayerId;
                                    return (
                                        <div key={p.id} className="flex items-center justify-between bg-white/5 p-3 rounded-2xl border border-white/5">
                                            <span className="font-bold text-sm">{p.username}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-white/30 text-xs">voted for</span>
                                                <span className={`font-black text-sm ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>{target?.username}</span>
                                                <span>{isCorrect ? '✅' : '❌'}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {room.players[0].id === player.id && (
                            <button
                                onClick={() => makeMove({ action: 'NEXT_ROUND' })}
                                className="btn-primary w-full py-6 text-2xl shadow-[0_10px_30px_rgba(250,204,21,0.3)] animate-pulse"
                            >
                                NEXT ROUND 🚀
                            </button>
                        )}
                    </div>
                </div>

                <div className="mt-8 text-center bg-white/5 p-6 rounded-3xl border border-white/10 w-full">
                    <h5 className="font-black text-white/30 uppercase tracking-widest mb-4">Current Standings</h5>
                    <div className="flex flex-wrap justify-center gap-4">
                        {Object.entries(honestState.scores).sort((a, b) => b[1] - a[1]).map(([pid, score]) => (
                            <div key={pid} className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-full border border-white/5">
                                <span className="font-bold text-xs">{room.players.find(p => p.id === pid)?.username}:</span>
                                <span className="font-black text-yellow-400">{score}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return null;
}

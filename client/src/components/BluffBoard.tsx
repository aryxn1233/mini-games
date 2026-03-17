'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../hooks/useGameStore';
import { BluffGameState } from '../shared/types';
import { supabase } from '../lib/supabase';


export function BluffBoard() {
    const { gameState, makeMove, player, room } = useGameStore();
    const [response, setResponse] = useState('');
    const [votedPlayerId, setVotedPlayerId] = useState<string | null>(null);

    useEffect(() => {
        if (gameState?.status === 'FINISHED' && room) {
            const saveGame = async () => {
                await supabase.from('bluff_games').insert({
                    room_id: room.id,
                    rounds: (gameState as any).totalRounds,
                    winner: (room.players.find(p => p.id === gameState.winnerId))?.username || 'Draw',
                    players: room.players.map(p => ({ id: p.id, username: p.username, score: (gameState as any).scores[p.id] })),
                    mode: (gameState as any).mode || 'CLASSIC'
                });
            };
            saveGame();
        }
    }, [gameState?.status, room, gameState?.winnerId]);

    if (!gameState || !player || !room) return null;
    const bluffState = gameState as BluffGameState;
    const isLiar = bluffState.liarIds?.includes(player.id) || (bluffState as any).isLiar;

    // 1. SUBMITTING PHASE
    if (bluffState.status === 'SUBMITTING') {
        const hasSubmitted = !!bluffState.responses[player.id];

        return (
            <div className="flex flex-col items-center gap-6 md:gap-8 w-full max-w-2xl px-2 py-4 md:px-4 md:py-8">
                <div className="text-center space-y-3 md:space-y-4">
                    <div className="w-full flex justify-center">
                        <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border-2 ${isLiar ? 'bg-red-500/20 border-red-500 text-red-500' : 'bg-green-500/20 border-green-500 text-green-500'}`}>
                            {isLiar ? 'ROLE: LIAR 😈' : 'ROLE: TRUTH PLAYER 😇'}
                        </span>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-black candy-text uppercase tracking-tighter">
                        ROUND {bluffState.currentRound} Prompter
                    </h3>
                    <div className="p-6 md:p-8 bg-white/5 border-2 md:border-4 border-white/10 rounded-3xl md:rounded-[40px] shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 text-4xl opacity-10">💬</div>
                        <p className="text-xl md:text-4xl font-black text-white leading-tight italic text-balance">
                            "{bluffState.prompt.text}"
                        </p>
                    </div>
                    <p className="text-white/40 text-sm md:text-lg font-bold">
                        {isLiar
                            ? "Fake it convincingly! Someone else might have a real answer."
                            : "Be honest. The liars are watching..."}
                    </p>
                </div>

                {!hasSubmitted ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full card bg-white/5 space-y-4 md:space-y-6 p-5 md:p-8 border-2 md:border-4 border-white/10"
                    >
                        <textarea
                            value={response}
                            onChange={(e) => setResponse(e.target.value)}
                            placeholder="Type your answer here..."
                            className="w-full bg-black/40 rounded-2xl md:rounded-3xl p-4 md:p-6 text-lg md:text-xl font-bold text-white placeholder:text-white/20 border-2 md:border-4 border-white/10 focus:border-purple-500 outline-none transition-all min-h-[120px] md:min-h-[150px] resize-none"
                        />

                        <button
                            onClick={() => makeMove({ response })}
                            disabled={response.trim().length < 2}
                            className="btn-primary w-full py-4 md:py-6 text-xl md:text-2xl shadow-[0_10px_30px_rgba(250,204,21,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            SUBMIT ANSWER 🚀
                        </button>
                    </motion.div>
                ) : (
                    <div className="card bg-white/5 text-center p-8 md:p-12 border-2 md:border-4 border-white/10 w-full">
                        <span className="text-4xl md:text-6xl mb-3 md:mb-4 block">✅</span>
                        <h4 className="text-xl md:text-3xl font-black text-white uppercase tracking-tighter">ANSWER LOCKED!</h4>
                        <div className="flex justify-center gap-1.5 md:gap-2 mt-4 md:mt-6">
                            {room.players.map(p => (
                                <div key={p.id} className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full ${bluffState.responses[p.id] ? 'bg-green-400 shadow-[0_0_10px_#4ade80]' : 'bg-white/10'}`} />
                            ))}
                        </div>
                        <p className="text-white/20 text-xs font-bold uppercase mt-4 animate-pulse">Waiting for others to finish writing...</p>
                    </div>
                )}
            </div>
        );
    }

    // 2. VOTING PHASE
    if (bluffState.status === 'VOTING') {
        const hasVoted = !!bluffState.votes[player.id];

        return (
            <div className="flex flex-col items-center gap-6 md:gap-8 w-full max-w-4xl px-2 py-4 md:px-4 md:py-8">
                <div className="text-center space-y-2 md:space-y-4">
                    <h3 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tighter italic">
                        "Who is Bluffing?"
                    </h3>
                    <p className="text-purple-400 font-bold uppercase tracking-[0.2em] text-xs md:text-sm">
                        Find the Liar based on these answers:
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full">
                    {bluffState.shuffledResponses?.map((resp, idx) => (
                        <motion.div
                            key={idx}
                            whileHover={!hasVoted ? { scale: 1.02 } : {}}
                            className="bg-white/5 p-4 md:p-6 rounded-2xl md:rounded-3xl border-2 border-white/10 relative overflow-hidden group"
                        >
                            <div className="absolute -top-2 -right-2 text-6xl opacity-5 group-hover:opacity-10 transition-opacity">
                                {idx % 2 === 0 ? '📝' : '💭'}
                            </div>
                            <p className="text-lg md:text-2xl font-bold text-white mb-4">
                                "{resp.text}"
                            </p>
                        </motion.div>
                    ))}
                </div>

                <div className="w-full mt-8 space-y-6">
                    <div className="text-center">
                        <h4 className="text-xl md:text-2xl font-black text-white uppercase">CAST YOUR VOTE</h4>
                        <p className="text-white/40 text-xs md:text-sm font-bold uppercase">You cannot vote for yourself</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                        {room.players.filter(p => p.id !== player.id).map(p => (
                            <motion.button
                                key={p.id}
                                whileHover={!hasVoted ? { scale: 1.05 } : {}}
                                whileTap={!hasVoted ? { scale: 0.95 } : {}}
                                onClick={() => !hasVoted && makeMove({ votedPlayerId: p.id })}
                                className={`p-4 md:p-6 rounded-2xl md:rounded-3xl border-2 transition-all flex flex-col items-center gap-2 ${bluffState.votes[player.id] === p.id
                                    ? 'bg-purple-600 border-purple-400 shadow-[0_0_20px_rgba(147,51,234,0.5)]'
                                    : hasVoted
                                        ? 'bg-white/2 border-white/5 opacity-50'
                                        : 'bg-white/5 border-white/10 hover:border-purple-500'
                                    }`}
                            >
                                <div className="w-10 h-10 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-xl md:text-3xl font-black text-white shadow-xl">
                                    {p.username[0].toUpperCase()}
                                </div>
                                <span className="font-black text-sm md:text-base text-white truncate w-full text-center">
                                    {p.username}
                                </span>
                                {bluffState.votes[player.id] === p.id && (
                                    <span className="text-[10px] md:text-xs font-black text-purple-200 uppercase tracking-tighter">Your Suspect 🕵️</span>
                                )}
                            </motion.button>
                        ))}
                    </div>

                    {hasVoted && (
                        <div className="text-center animate-pulse">
                            <p className="text-yellow-400 font-black uppercase tracking-[0.2em]">Waiting for all votes... ⏳</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // 3. REVEALING PHASE
    if (bluffState.status === 'REVEALING') {
        return (
            <div className="flex flex-col items-center gap-6 md:gap-8 w-full max-w-4xl px-2 py-4 md:px-4 md:py-8">
                <div className="text-center">
                    <h3 className="text-2xl md:text-5xl font-black text-white uppercase tracking-tighter italic mb-8">
                        The Reveal! 🎭
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 w-full">
                    <div className="card bg-white/5 p-6 md:p-8 space-y-6">
                        <h4 className="text-lg md:text-xl font-black text-white/50 uppercase tracking-widest border-b border-white/10 pb-4">Answers & Roles</h4>
                        <div className="space-y-4">
                            {room.players.map(p => {
                                const isPlayerLiar = bluffState.liarIds?.includes(p.id);
                                const response = bluffState.responses[p.id];
                                return (
                                    <div key={p.id} className={`p-4 rounded-3xl border-2 transition-all ${isPlayerLiar ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${isPlayerLiar ? 'bg-red-500' : 'bg-green-500'}`}>
                                                    {p.username[0]}
                                                </div>
                                                <span className="font-black text-white">{p.username}</span>
                                            </div>
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isPlayerLiar ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                                                {isPlayerLiar ? 'LIAR 😈' : 'TRUTH 😇'}
                                            </span>
                                        </div>
                                        <p className="text-white text-lg font-bold italic pl-10">"{response}"</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="card bg-white/5 p-6 md:p-8 space-y-4">
                            <h4 className="text-lg md:text-xl font-black text-white/50 uppercase tracking-widest border-b border-white/10 pb-4">Scoreboard</h4>
                            <div className="space-y-2">
                                {Object.entries(bluffState.scores).sort((a, b) => (b[1] as number) - (a[1] as number)).map(([pid, score]) => {
                                    const p = room.players.find(x => x.id === pid);
                                    const votedFor = bluffState.votes[pid];
                                    const suspect = room.players.find(x => x.id === votedFor);
                                    const wasCorrect = bluffState.liarIds?.includes(votedFor);

                                    return (
                                        <div key={pid} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                                            <div className="flex items-center gap-3">
                                                <div className="text-left">
                                                    <p className="font-black text-white text-sm">{p?.username}</p>
                                                    <p className="text-[10px] font-bold text-white/30 uppercase">
                                                        Suspected: {suspect?.username || 'None'} {suspect ? (wasCorrect ? '🎯' : '🤡') : ''}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-2xl font-black text-yellow-400">{score as any}</span>
                                                <span className="text-[10px] font-black text-white/20">PTS</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            <div className="p-4 bg-purple-600/20 border-2 border-purple-600/40 rounded-3xl text-center">
                                <p className="text-white font-bold">
                                    {bluffState.liarIds?.includes(player.id)
                                        ? "Did you fool them? 🎭"
                                        : (bluffState.liarIds?.includes(bluffState.votes[player.id])
                                            ? "Nice catch! You found the liar! 🎯"
                                            : "Oops! You suspected the wrong person. 🤡")}
                                </p>
                            </div>

                            {room.players[0].id === player.id && (
                                <button
                                    onClick={() => makeMove({ action: 'NEXT_ROUND' })}
                                    className="btn-primary py-4 md:py-6 text-xl md:text-2xl shadow-[0_10px_30px_rgba(250,204,21,0.3)]"
                                >
                                    {bluffState.currentRound >= bluffState.totalRounds ? 'FINISH GAME' : 'NEXT ROUND 🚀'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}

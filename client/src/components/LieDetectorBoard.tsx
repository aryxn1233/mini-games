'use client';

import { useState } from 'react';
import { useGameStore } from '../hooks/useGameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useEffect } from 'react';

export function LieDetectorBoard() {
    const { gameState, makeMove, player, room } = useGameStore();
    const [statement, setStatement] = useState('');
    const [isTruth, setIsTruth] = useState(true);

    useEffect(() => {
        if (gameState?.status === 'FINISHED' && room) {
            const saveGame = async () => {
                await supabase.from('lie_detector_games').insert({
                    room_id: room.id,
                    rounds: (gameState as any).totalRounds,
                    winner: (room.players.find(p => p.id === gameState.winnerId))?.username || 'Draw',
                    players: room.players.map(p => ({ id: p.id, username: p.username, score: (gameState as any).scores[p.id] }))
                });
            };
            saveGame();
        }
    }, [gameState?.status, room, gameState?.winnerId]);

    if (!gameState || !player) return null;
    const lieState = gameState as any;

    const isStatementPlayer = player.id === lieState.statementPlayerId;

    // 1. WAITING: Statement Player submits a statement
    if (lieState.status === 'WAITING') {
        return (
            <div className="flex flex-col items-center gap-8 w-full max-w-2xl px-4 py-8">
                <div className="text-center space-y-4">
                    <h3 className="text-4xl font-black candy-text uppercase tracking-tighter">
                        {isStatementPlayer ? "YOUR TURN TO BLUFF! 😈" : "WAITING FOR STATEMENT... 😴"}
                    </h3>
                    <p className="text-white/60 text-xl font-bold">
                        {isStatementPlayer
                            ? "Tell a truth or a lie about yourself. Make it believable!"
                            : `${room?.players.find(p => p.id === lieState.statementPlayerId)?.username} is cooking up a juicy statement...`}
                    </p>
                </div>

                {isStatementPlayer && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full card bg-white/5 space-y-6 p-8 border-4 border-white/10"
                    >
                        <textarea
                            value={statement}
                            onChange={(e) => setStatement(e.target.value)}
                            placeholder="I once met a famous astronaut..."
                            className="w-full bg-black/40 rounded-3xl p-6 text-xl font-bold text-white placeholder:text-white/20 border-4 border-white/10 focus:border-purple-500 outline-none transition-all min-h-[150px] resize-none"
                        />

                        <div className="flex gap-4">
                            <button
                                onClick={() => setIsTruth(true)}
                                className={`flex-1 py-4 rounded-2xl font-black text-xl transition-all border-4 ${isTruth ? 'bg-green-500 border-green-400 text-white' : 'bg-white/5 border-white/10 text-white/40'}`}
                            >
                                TRUTH ✅
                            </button>
                            <button
                                onClick={() => setIsTruth(false)}
                                className={`flex-1 py-4 rounded-2xl font-black text-xl transition-all border-4 ${!isTruth ? 'bg-red-500 border-red-400 text-white' : 'bg-white/5 border-white/10 text-white/40'}`}
                            >
                                LIE ❌
                            </button>
                        </div>

                        <button
                            onClick={() => makeMove({ statement, isTruth })}
                            disabled={statement.trim().length < 5}
                            className="btn-primary w-full py-6 text-2xl shadow-[0_10px_30px_rgba(250,204,21,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            SEND IT! 🔥
                        </button>
                    </motion.div>
                )}

                <div className="flex flex-wrap justify-center gap-4 mt-8">
                    {room?.players.map(p => (
                        <div key={p.id} className={`px-4 py-2 rounded-full border-2 transition-all ${p.id === lieState.statementPlayerId ? 'bg-yellow-400 border-white text-purple-900 font-black' : 'bg-white/5 border-white/10 text-white/50'}`}>
                            {p.username} {p.id === lieState.statementPlayerId ? ' (STORYTELLER)' : ''}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // 2. VOTING: Other players guess
    if (lieState.status === 'VOTING') {
        const hasVoted = lieState.votes[player.id];
        return (
            <div className="flex flex-col items-center gap-8 w-full max-w-3xl px-4 py-8">
                <div className="text-center mb-8">
                    <span className="bg-purple-600/50 text-white px-6 py-2 rounded-full font-black text-sm uppercase tracking-widest border border-white/20">
                        {room?.players.find(p => p.id === lieState.statementPlayerId)?.username}'s Secret
                    </span>
                    <h3 className="text-3xl md:text-5xl font-black text-white mt-6 leading-tight italic">
                        "{lieState.statement}"
                    </h3>
                </div>

                {!isStatementPlayer ? (
                    <div className="w-full space-y-6">
                        {hasVoted ? (
                            <div className="card bg-white/5 text-center p-12 border-4 border-white/10">
                                <span className="text-6xl mb-4 block">📮</span>
                                <h4 className="text-3xl font-black text-white">VOTE SUBMITTED!</h4>
                                <p className="text-white/50 mt-2 font-bold uppercase tracking-widest">Waiting for the others... ⏳</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <motion.button
                                    whileHover={{ scale: 1.05, rotate: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => makeMove({ vote: 'TRUTH' })}
                                    className="bg-green-500 hover:bg-green-400 p-12 rounded-[40px] border-8 border-white/20 shadow-2xl transition-all"
                                >
                                    <span className="text-7xl block mb-4">😇</span>
                                    <span className="text-4xl font-black text-white uppercase tracking-tighter">TRUTH</span>
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05, rotate: 2 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => makeMove({ vote: 'LIE' })}
                                    className="bg-red-500 hover:bg-red-400 p-12 rounded-[40px] border-8 border-white/20 shadow-2xl transition-all"
                                >
                                    <span className="text-7xl block mb-4">😈</span>
                                    <span className="text-4xl font-black text-white uppercase tracking-tighter">LIE</span>
                                </motion.button>
                            </div>
                        )
                        }
                    </div>
                ) : (
                    <div className="card bg-white/5 text-center p-12 border-4 border-white/10 w-full">
                        <span className="text-6xl mb-4 block animate-bounce">🍿</span>
                        <h4 className="text-3xl font-black text-white">THEY ARE DECIDING...</h4>
                        <div className="flex justify-center gap-2 mt-6">
                            {room?.players.filter(p => p.id !== player.id).map(p => (
                                <div key={p.id} className={`w-3 h-3 rounded-full ${lieState.votes[p.id] ? 'bg-green-400 shadow-[0_0_10px_#4ade80]' : 'bg-white/10'}`} />
                            ))}
                        </div>
                    </div>
                )}

                <div className="w-full flex flex-col gap-4 mt-8">
                    <p className="text-white/30 font-black uppercase text-center tracking-[0.2em]">Who's Voted?</p>
                    <div className="flex flex-wrap justify-center gap-3">
                        {room?.players.filter(p => p.id !== lieState.statementPlayerId).map(p => (
                            <div key={p.id} className={`px-4 py-2 rounded-2xl flex items-center gap-3 border-2 transition-all ${lieState.votes[p.id] ? 'bg-green-500/20 border-green-500 text-green-300' : 'bg-white/5 border-white/10 text-white/20'}`}>
                                <span className="font-bold">{p.username}</span>
                                {lieState.votes[p.id] && <span>✅</span>}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // 3. REVEALING: Show who was right
    if (lieState.status === 'REVEALING') {
        const isCorrect = lieState.correctAnswer === 'TRUTH';
        return (
            <div className="flex flex-col items-center gap-8 w-full max-w-4xl px-4 py-8">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`p-12 rounded-[60px] border-[12px] border-white/20 shadow-2xl text-center w-full ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}
                >
                    <h4 className="text-2xl md:text-3xl font-black text-white/80 uppercase mb-2 tracking-widest">IT WAS A...</h4>
                    <h2 className="text-7xl md:text-9xl font-black text-white uppercase tracking-tighter drop-shadow-2xl">
                        {lieState.correctAnswer === 'TRUTH' ? 'TRUTH! ✅' : 'LIE! ❌'}
                    </h2>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                    <div className="card bg-white/5 p-8 space-y-4">
                        <h4 className="text-xl font-black text-white/50 uppercase tracking-widest">The Scoreboard</h4>
                        <div className="space-y-3">
                            {Object.entries(lieState.scores).map(([pid, score]) => {
                                const p = room?.players.find(x => x.id === pid);
                                const vote = lieState.votes[pid];
                                const wasRight = vote === lieState.correctAnswer;
                                return (
                                    <div key={pid} className={`flex items-center justify-between p-4 rounded-2xl border-2 ${wasRight ? 'bg-green-500/10 border-green-500/30' : 'bg-white/5 border-white/5'}`}>
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{wasRight ? '⭐' : '💀'}</span>
                                            <div>
                                                <p className="font-black text-white">{p?.username}</p>
                                                <p className="text-xs font-bold text-white/30">{vote || 'NO VOTE'}</p>
                                            </div>
                                        </div>
                                        <span className="text-3xl font-black text-yellow-400">{score as any}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex flex-col justify-center gap-6">
                        <div className="card bg-white/5 p-8 text-center border-4 border-white/10">
                            <h4 className="text-lg font-black text-white/50 uppercase tracking-widest mb-4">Round Result</h4>
                            <p className="text-2xl font-bold text-white">
                                {isStatementPlayer
                                    ? (Object.values(lieState.votes).filter(v => v === lieState.correctAnswer).length < Object.keys(lieState.votes).length / 2
                                        ? "YOU FOOLED THE MAJORITY! +20pts 🎭"
                                        : "THEY CAUGHT YOU! 🕵️")
                                    : (lieState.votes[player.id] === lieState.correctAnswer
                                        ? "YOU GUESSED CORRECTLY! +10pts 🎯"
                                        : "YOU GOT FOOLED! 🤡")}
                            </p>
                        </div>

                        {isStatementPlayer && (
                            <button
                                onClick={() => makeMove({ action: 'NEXT_ROUND' })}
                                className="btn-primary py-8 text-3xl shadow-[0_15px_40px_rgba(250,204,21,0.4)]"
                            >
                                NEXT ROUND! 🚀
                            </button>
                        )}
                        {!isStatementPlayer && (
                            <div className="text-center font-black text-white/20 uppercase tracking-[0.5em] animate-pulse">
                                Waiting for storyteller...
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return null;
}

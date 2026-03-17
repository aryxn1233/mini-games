'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../hooks/useGameStore';
import { BluffCardGameState, Card as CardType } from '../shared/types';
import { Card } from './Card';
import { supabase } from '../lib/supabase';

const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export function BluffCardBoard() {
    const { gameState, makeMove, player, room } = useGameStore();
    const [selectedCards, setSelectedCards] = useState<CardType[]>([]);
    const [declaredRank, setDeclaredRank] = useState<string>('');
    const [showRankPicker, setShowRankPicker] = useState(false);

    useEffect(() => {
        if (gameState?.status === 'FINISHED' && room) {
            const saveGame = async () => {
                const bcState = gameState as BluffCardGameState;
                await supabase.from('bluff_card_games').insert({
                    room_id: room.id,
                    winner: room.players.find(p => p.id === bcState.winnerId)?.username || 'Unknown',
                    ranking: bcState.finishedPlayers.map((pid, index) => ({
                        username: room.players.find(p => p.id === pid)?.username,
                        rank: index + 1
                    })),
                    total_rounds: 0,
                });
            };
            saveGame();
        }
    }, [gameState?.status, room, gameState?.winnerId]);

    if (!gameState || !player || !room) return null;
    const bcState = gameState as BluffCardGameState;
    const isMyTurn = bcState.currentTurn === player.id;
    const myHand = bcState.hands[player.id] || [];

    useEffect(() => {
        setSelectedCards([]);
        if (bcState.currentRank) {
            setDeclaredRank(bcState.currentRank);
        }
    }, [bcState.currentTurn, bcState.currentRank]);

    const toggleCardSelection = (card: CardType) => {
        if (!isMyTurn) return;
        const index = selectedCards.findIndex(c => c.suit === card.suit && c.rank === card.rank);
        if (index === -1) {
            if (selectedCards.length < 4) {
                setSelectedCards([...selectedCards, card]);
            }
        } else {
            setSelectedCards(selectedCards.filter((_, i) => i !== index));
        }
    };

    const handlePlay = () => {
        if (selectedCards.length === 0) return;

        const rankToUse = bcState.currentRank || declaredRank;
        if (!rankToUse) {
            setShowRankPicker(true);
            return;
        }

        makeMove({
            action: 'PLAY',
            cards: selectedCards,
            declaredRank: rankToUse
        });
        setSelectedCards([]);
        setDeclaredRank('');
        setShowRankPicker(false);
    };

    const handlePass = () => {
        makeMove({ action: 'PASS' });
    };

    const handleShow = () => {
        makeMove({ action: 'SHOW' });
    };

    const isCardSelected = (card: CardType) => {
        return selectedCards.some(c => c.suit === card.suit && c.rank === card.rank);
    };

    return (
        <div className="flex flex-col items-center w-full max-w-6xl min-h-[600px] relative py-8 px-4 gap-8">
            <div className="w-full flex justify-between items-center bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-2xl">
                <div className="flex flex-col">
                    <span className="text-white/40 text-xs font-black uppercase tracking-widest">Current Rank</span>
                    <span className="text-2xl font-black text-yellow-400">{bcState.currentRank || 'NOT SET'}</span>
                </div>

                <div className="text-center">
                    <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter">
                        {isMyTurn ? "IT'S YOUR TURN! 🔥" : `${room.players.find(p => p.id === bcState.currentTurn)?.username}'s turn...`}
                    </h3>
                </div>

                <div className="flex flex-col items-end">
                    <span className="text-white/40 text-xs font-black uppercase tracking-widest">Pile Count</span>
                    <span className="text-2xl font-black text-purple-400">{bcState.pile.length} CARDS</span>
                </div>
            </div>

            <div className="flex-1 w-full flex flex-col items-center justify-center relative min-h-[300px]">
                <div className="relative w-full flex justify-center items-center">
                    <div className="relative">
                        {bcState.pile.length > 0 ? (
                            bcState.pile.map((_, i) => (
                                <Card
                                    key={i}
                                    suit="BACK"
                                    rank="?"
                                    className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 shadow-2xl`}
                                    style={{
                                        transform: `translate(-50%, -50%) rotate(${i * 5 - (bcState.pile.length * 2.5)}deg) translate(${i * 2}px, ${i * -2}px)`,
                                        zIndex: i
                                    }}
                                />
                            ))
                        ) : (
                            <div className="w-32 h-48 border-4 border-dashed border-white/5 rounded-2xl flex items-center justify-center text-white/5 text-4xl font-black">
                                EMPTY
                            </div>
                        )}

                        <AnimatePresence>
                            {bcState.status === 'REVEALING' && bcState.lastMove && (
                                <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    className="absolute inset-0 z-[100] flex flex-col items-center justify-center pointer-events-none"
                                >
                                    <div className="bg-purple-600 px-6 py-2 rounded-full text-white font-black mb-4 shadow-xl border-2 border-white/20">
                                        REVEALING {bcState.lastMove.playerId === player.id ? 'YOUR' : 'THEIR'} MOVE!
                                    </div>
                                    <div className="flex gap-4">
                                        {bcState.lastMove.cardsPlayed.map((c, i) => (
                                            <Card key={i} {...c} className="shadow-[0_0_30px_rgba(255,255,255,0.5)]" />
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {bcState.lastMove && bcState.status !== 'REVEALING' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-12 bg-black/40 px-6 py-3 rounded-2xl border border-white/10 text-center"
                    >
                        <p className="text-white font-bold">
                            <span className="text-purple-400">{room.players.find(p => p.id === bcState.lastMove!.playerId)?.username}</span> played
                            <span className="text-yellow-400 mx-1">{bcState.lastMove.cardsPlayed.length} {bcState.lastMove.declaredRank}s</span>
                        </p>
                    </motion.div>
                )}
            </div>

            <div className="w-full space-y-6">
                <div className="flex justify-center gap-4">
                    {isMyTurn && (
                        <>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handlePlay}
                                disabled={selectedCards.length === 0}
                                className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-amber-600 text-white font-black rounded-xl shadow-xl disabled:opacity-50 uppercase tracking-wider"
                            >
                                PLAY {selectedCards.length > 0 ? `${selectedCards.length} Cards` : ''} 🚀
                            </motion.button>

                            {bcState.currentRank && (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handlePass}
                                    className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-black rounded-xl border border-white/20 uppercase tracking-wider"
                                >
                                    PASS ⏭️
                                </motion.button>
                            )}
                        </>
                    )}

                    {(!isMyTurn || (isMyTurn && !bcState.lastMove)) && bcState.lastMove && bcState.lastMove.playerId !== player.id && (
                        <motion.button
                            whileHover={{ scale: 1.1, backgroundColor: '#ef4444' }}
                            whileTap={{ scale: 0.9 }}
                            onClick={handleShow}
                            className="px-8 py-3 bg-red-600 text-white font-black rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.4)] uppercase tracking-wider border-2 border-red-400/50"
                        >
                            SHOW! (CHALLENGE) 🕵️‍♂️
                        </motion.button>
                    )}
                </div>

                <div className="flex flex-wrap justify-center gap-2 md:gap-4 p-4 min-h-[220px]">
                    {myHand.map((card, i) => (
                        <Card
                            key={`${card.suit}-${card.rank}-${i}`}
                            {...card}
                            isSelected={isCardSelected(card)}
                            onClick={() => toggleCardSelection(card)}
                        />
                    ))}
                    {myHand.length === 0 && !bcState.finishedPlayers.includes(player.id) && (
                        <div className="text-white/20 text-xl font-black uppercase">Wait... where are your cards?</div>
                    )}
                    {bcState.finishedPlayers.includes(player.id) && (
                        <div className="text-green-400 text-2xl font-black uppercase bg-green-500/10 px-8 py-4 rounded-3xl border-2 border-green-500/20">
                            FINISHED! Round Rank: {bcState.finishedPlayers.indexOf(player.id) + 1}
                        </div>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {showRankPicker && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-zinc-900 border-2 border-white/10 p-8 rounded-[40px] max-w-lg w-full shadow-[0_0_50px_rgba(0,0,0,0.5)]"
                        >
                            <h2 className="text-3xl font-black text-white text-center mb-8 uppercase tracking-tighter italic">Declare a Rank</h2>
                            <div className="grid grid-cols-4 gap-3">
                                {RANKS.map(rank => (
                                    <button
                                        key={rank}
                                        onClick={() => {
                                            setDeclaredRank(rank);
                                            makeMove({
                                                action: 'PLAY',
                                                cards: selectedCards,
                                                declaredRank: rank
                                            });
                                            setShowRankPicker(false);
                                            setSelectedCards([]);
                                        }}
                                        className="py-4 bg-white/5 hover:bg-yellow-500 hover:text-black text-white font-black rounded-2xl transition-all border border-white/5 active:scale-95"
                                    >
                                        {rank}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setShowRankPicker(false)}
                                className="w-full mt-8 py-3 text-white/40 font-bold hover:text-white transition-colors"
                            >
                                CANCEL
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

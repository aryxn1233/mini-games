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
    const [isHoveringHand, setIsHoveringHand] = useState(false);

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

    // Calculate rotation and position for fanned cards
    const getCardStyle = (index: number, total: number) => {
        if (total === 1) return {};
        const midPoint = (total - 1) / 2;
        const relativePos = index - midPoint;
        const rotate = relativePos * (isHoveringHand ? 15 : 6);
        const translateX = relativePos * (isHoveringHand ? 45 : 30);
        const translateY = Math.abs(relativePos) * (isHoveringHand ? 10 : 4);

        return {
            transform: `translateX(${translateX}px) translateY(${translateY}px) rotate(${rotate}deg)`,
            zIndex: index,
        };
    };

    return (
        <div className="flex flex-col items-center w-full max-w-6xl min-h-[600px] relative py-4 md:py-8 px-2 md:px-4 gap-4 md:gap-8 overflow-hidden">
            {/* Header / Info Bar */}
            <div className="w-full flex justify-between items-center bg-white/5 backdrop-blur-md p-3 md:p-6 rounded-2xl md:rounded-[32px] border border-white/10 shadow-2xl">
                <div className="flex flex-col">
                    <span className="text-white/40 text-[10px] md:text-xs font-black uppercase tracking-widest leading-none mb-1">Current Rank</span>
                    <span className="text-lg md:text-3xl font-black text-yellow-400 leading-none">{bcState.currentRank || 'NOT SET'}</span>
                </div>

                <div className="text-center px-2">
                    <h3 className="text-sm md:text-2xl font-black text-white uppercase tracking-tighter leading-tight">
                        {isMyTurn ? "YOUR TURN! 🔥" : `${room.players.find(p => p.id === bcState.currentTurn)?.username}'s turn...`}
                    </h3>
                </div>

                <div className="flex flex-col items-end">
                    <span className="text-white/40 text-[10px] md:text-xs font-black uppercase tracking-widest leading-none mb-1">Pile</span>
                    <span className="text-lg md:text-3xl font-black text-purple-400 leading-none">{bcState.pile.length}</span>
                </div>
            </div>

            {/* Game Table Area */}
            <div className="flex-1 w-full flex flex-col items-center justify-center relative min-h-[250px] md:min-h-[350px]">
                <div className="relative w-full flex justify-center items-center scale-75 md:scale-100">
                    <div className="relative">
                        {bcState.pile.length > 0 ? (
                            bcState.pile.map((_, i) => (
                                <Card
                                    key={i}
                                    suit="BACK"
                                    rank="?"
                                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 shadow-xl"
                                    style={{
                                        transform: `translate(-50%, -50%) rotate(${i % 2 === 0 ? 1 : -1}deg) translate(${i * 0.5}px, ${i * -0.5}px)`,
                                        zIndex: i
                                    }}
                                    compact
                                />
                            ))
                        ) : (
                            <div className="w-24 h-36 md:w-32 md:h-48 border-4 border-dashed border-white/5 rounded-2xl flex items-center justify-center text-white/5 text-3xl font-black">
                                EMPTY
                            </div>
                        )}

                        <AnimatePresence>
                            {bcState.status === 'REVEALING' && bcState.lastMove && (
                                <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    className="absolute inset-0 z-[100] flex flex-col items-center justify-center pointer-events-none w-[300%] -left-full"
                                >
                                    <div className="bg-purple-600 px-4 md:px-8 py-2 md:py-3 rounded-full text-white font-black text-sm md:text-lg mb-6 shadow-2xl border-2 border-white/20 whitespace-nowrap">
                                        REVEALING {bcState.lastMove.playerId === player.id ? 'YOUR' : 'THEIR'} MOVE!
                                    </div>
                                    <div className="relative h-48 w-32 flex items-center justify-center">
                                        {bcState.lastMove.cardsPlayed.map((c, i) => (
                                            <Card
                                                key={i}
                                                {...c}
                                                className="absolute shadow-[0_0_40px_rgba(255,255,255,0.4)]"
                                                style={{
                                                    transform: `translateX(${(i - (bcState.lastMove!.cardsPlayed.length - 1) / 2) * 20}px) rotate(${(i - (bcState.lastMove!.cardsPlayed.length - 1) / 2) * 5}deg)`,
                                                    zIndex: i
                                                }}
                                            />
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
                        className="mt-16 md:mt-24 bg-black/40 backdrop-blur-sm px-4 md:px-8 py-2 md:py-4 rounded-full border border-white/10 text-center shadow-xl"
                    >
                        <p className="text-white text-xs md:text-lg font-bold">
                            <span className="text-purple-400 uppercase">{room.players.find(p => p.id === bcState.lastMove!.playerId)?.username}</span> played
                            <span className="text-yellow-400 mx-1.5">{bcState.lastMove.cardsPlayed.length} {bcState.lastMove.declaredRank}s</span>
                        </p>
                    </motion.div>
                )}
            </div>

            {/* Actions & Hand Area */}
            <div className="w-full space-y-4 md:space-y-8 flex flex-col items-center">
                {/* Actions Bar */}
                <div className="flex flex-wrap justify-center gap-2 md:gap-4 px-2">
                    {isMyTurn && (
                        <>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handlePlay}
                                disabled={selectedCards.length === 0}
                                className="px-5 md:px-10 py-2.5 md:py-5 bg-gradient-to-r from-yellow-500 to-amber-600 text-white text-sm md:text-xl font-black rounded-xl md:rounded-2xl shadow-[0_10px_30px_rgba(245,158,11,0.3)] disabled:opacity-50 uppercase tracking-wider flex items-center gap-2"
                            >
                                PLAY 🚀 {selectedCards.length > 0 && <span className="bg-black/20 px-2 rounded-lg">{selectedCards.length}</span>}
                            </motion.button>

                            {bcState.currentRank && (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handlePass}
                                    className="px-5 md:px-10 py-2.5 md:py-5 bg-white/10 hover:bg-white/20 text-white text-sm md:text-xl font-black rounded-xl md:rounded-2xl border border-white/20 uppercase tracking-wider"
                                >
                                    PASS ⏭️
                                </motion.button>
                            )}
                        </>
                    )}

                    {bcState.lastMove && bcState.lastMove.playerId !== player.id && (
                        <motion.button
                            whileHover={{ scale: 1.1, backgroundColor: '#ef4444' }}
                            whileTap={{ scale: 0.9 }}
                            onClick={handleShow}
                            className="px-5 md:px-10 py-2.5 md:py-5 bg-red-600 text-white text-sm md:text-xl font-black rounded-xl md:rounded-2xl shadow-[0_10px_30px_rgba(239,68,68,0.4)] uppercase tracking-wider border-2 border-red-400/50"
                        >
                            SHOW! 🕵️‍♂️
                        </motion.button>
                    )}
                </div>

                {/* Fanned Player Hand Area - Scrollable on mobile */}
                <div
                    className="w-full h-48 md:h-80 mt-2 md:mt-4 overflow-x-auto overflow-y-hidden px-4 py-8 touch-pan-x custom-scrollbar"
                    onMouseEnter={() => setIsHoveringHand(true)}
                    onMouseLeave={() => setIsHoveringHand(false)}
                    onTouchStart={() => setIsHoveringHand(true)}
                >
                    <div
                        className="relative h-full flex items-center justify-center mx-auto"
                        style={{
                            minWidth: `${Math.max(100, myHand.length * (isHoveringHand ? 50 : 35) + 100)}px`,
                        }}
                    >
                        {myHand.map((card, i) => (
                            <div
                                key={`${card.suit}-${card.rank}-${i}`}
                                className="absolute transition-all duration-500 transform-gpu"
                                style={getCardStyle(i, myHand.length)}
                            >
                                <Card
                                    {...card}
                                    isSelected={isCardSelected(card)}
                                    onClick={() => toggleCardSelection(card)}
                                    className="hover:z-[100]"
                                    compact={myHand.length > 8}
                                />
                            </div>
                        ))}
                    </div>
                    {myHand.length === 0 && !bcState.finishedPlayers.includes(player.id) && (
                        <div className="flex justify-center items-center h-full">
                            <div className="text-white/10 text-xl md:text-3xl font-black uppercase tracking-[0.2em] animate-pulse">dealing cards...</div>
                        </div>
                    )}
                    {bcState.finishedPlayers.includes(player.id) && (
                        <div className="flex justify-center items-center h-full">
                            <div className="text-green-400 text-xl md:text-4xl font-black uppercase bg-green-500/10 px-6 md:px-12 py-3 md:py-6 rounded-full border-2 border-green-500/20 shadow-[0_0_40px_rgba(34,197,94,0.1)]">
                                FINISHED! #{bcState.finishedPlayers.indexOf(player.id) + 1} 🏅
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Rank Selection Modal */}
            <AnimatePresence>
                {showRankPicker && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-y-auto">
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0, y: 50 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            className="bg-zinc-900/90 border-2 border-white/10 p-6 md:p-10 rounded-[32px] md:rounded-[48px] max-w-lg w-full shadow-[0_0_100px_rgba(0,0,0,0.8)]"
                        >
                            <h2 className="text-2xl md:text-4xl font-black text-white text-center mb-6 md:mb-10 uppercase tracking-tighter italic">Declare a Rank</h2>
                            <div className="grid grid-cols-4 gap-2 md:gap-4">
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
                                        className="py-3 md:py-5 bg-white/5 hover:bg-yellow-500 hover:text-black text-white font-black text-lg md:text-2xl rounded-xl md:rounded-2xl transition-all border border-white/5 active:scale-95 shadow-lg"
                                    >
                                        {rank}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setShowRankPicker(false)}
                                className="w-full mt-6 md:mt-10 py-3 text-white/30 font-bold hover:text-white transition-colors uppercase tracking-widest text-sm"
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

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../hooks/useGameStore';
import { BluffCardGameState, Card as CardType } from '../shared/types';
import { Card } from './Card';
import { supabase } from '../lib/supabase';

const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const SUIT_ORDER = ['CLUBS', 'DIAMONDS', 'HEARTS', 'SPADES'];

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

    // Sort hand by primary rank and secondary suit order
    const myHand = [...(bcState.hands[player.id] || [])].sort((a, b) => {
        const rankDiff = RANKS.indexOf(a.rank) - RANKS.indexOf(b.rank);
        if (rankDiff !== 0) return rankDiff;
        return SUIT_ORDER.indexOf(a.suit) - SUIT_ORDER.indexOf(b.suit);
    });

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

    // Sub-component for Player Info
    const PlayerInfo = ({ pId, className = "" }: { pId: string; className?: string }) => {
        const p = room.players.find(pl => pl.id === pId);
        if (!p) return null;
        const pHand = bcState.hands[pId] || [];
        const isTurn = bcState.currentTurn === pId;
        const isFinished = bcState.finishedPlayers.includes(pId);

        return (
            <div className={`flex flex-col items-center gap-1 md:gap-2 transition-all duration-500 ${className} ${isTurn ? 'scale-110' : 'opacity-80'}`}>
                <div className={`relative w-12 h-12 md:w-16 md:h-16 rounded-full border-2 md:border-4 ${isTurn ? 'border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.5)]' : 'border-white/10'} overflow-hidden transition-all bg-zinc-800`}>
                    <img src={p.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.username}`} alt={p.username} className="w-full h-full object-cover" />
                    {isTurn && (
                        <motion.div
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="absolute inset-0 bg-yellow-400/20"
                        />
                    )}
                </div>
                <div className="flex flex-col items-center">
                    <span className="text-[10px] md:text-sm font-black text-white truncate max-w-[80px] drop-shadow-md uppercase tracking-tighter">
                        {p.username} {pId === player.id && "(YOU)"}
                    </span>
                    <div className="flex items-center gap-1 bg-black/40 px-2 rounded-full border border-white/10">
                        <span className="text-[8px] md:text-xs text-yellow-500">🎴</span>
                        <span className="text-[10px] md:text-xs font-bold text-white">
                            {isFinished ? 'DONE' : pHand.length}
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    // Calculate card layout for hand
    const getHandCardStyle = (index: number, total: number) => {
        const offset = Math.min(45, (800 / total));
        return {
            zIndex: index,
            marginLeft: index === 0 ? 0 : `-${offset}px`,
        };
    };

    // Calculate positions for opponents
    const getOpponentLayout = (index: number, total: number) => {
        // We use a fixed classes approach for common player counts + a fallback
        const layouts: Record<number, string[]> = {
            1: ["top-10 left-1/2 -translate-x-1/2"],
            2: ["top-20 left-10 md:left-20", "top-20 right-10 md:right-20"],
            3: ["top-20 left-10 md:left-20", "top-10 left-1/2 -translate-x-1/2", "top-20 right-10 md:right-20"],
            4: ["top-40 left-5 md:left-10", "top-15 left-1/4", "top-15 right-1/4", "top-40 right-5 md:right-10"],
            5: ["top-1/2 -translate-y-1/2 left-5", "top-20 left-1/4", "top-10 left-1/2 -translate-x-1/2", "top-20 right-1/4", "top-1/2 -translate-y-1/2 right-5"],
        };

        const currentLayout = layouts[total] || layouts[5];
        return `absolute ${currentLayout[index % currentLayout.length] || "top-10 left-1/2"}`;
    };

    const otherPlayers = room.players.filter(p => p.id !== player.id);

    return (
        <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col overflow-hidden safe-area-inset">
            {/* Top Bar - Header Info */}
            <div className="h-16 md:h-20 w-full flex justify-between items-center px-4 md:px-8 bg-black/40 backdrop-blur-md border-b border-white/5 z-50">
                <div className="flex items-center gap-3">
                    <div className="bg-yellow-500/10 border border-yellow-500/20 px-3 md:px-5 py-1 md:py-2 rounded-xl">
                        <span className="text-[10px] md:text-xs font-black text-yellow-500/60 uppercase tracking-widest block leading-none mb-1">Rank to Play</span>
                        <span className="text-lg md:text-2xl font-black text-yellow-400 leading-none">{bcState.currentRank || 'NOT SET'}</span>
                    </div>
                </div>

                <div className="flex flex-col items-center">
                    <h1 className="text-sm md:text-xl font-black text-white italic tracking-tighter uppercase whitespace-nowrap">Bluff Card King</h1>
                    <div className="hidden md:flex gap-2">
                        {bcState.finishedPlayers.length > 0 && (
                            <div className="text-[10px] text-green-400 font-bold uppercase tracking-widest mt-1">
                                {bcState.finishedPlayers.length} Players Finished
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-purple-500/10 border border-purple-500/20 px-3 md:px-5 py-1 md:py-2 rounded-xl text-right">
                        <span className="text-[10px] md:text-xs font-black text-purple-500/60 uppercase tracking-widest block leading-none mb-1">Pile size</span>
                        <span className="text-lg md:text-2xl font-black text-purple-400 leading-none">{bcState.pile.length}</span>
                    </div>
                </div>
            </div>

            {/* Main Game Area */}
            <div className="flex-1 relative w-full flex items-center justify-center p-4">
                {/* Board / TableBackground */}
                <div className="absolute inset-4 md:inset-10 rounded-[100px] md:rounded-[200px] bg-[#073d1c] border-[8px] md:border-[16px] border-[#3d2b1f] shadow-[inset_0_0_100px_rgba(0,0,0,0.8),0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
                    {/* Felt Texture / Radial Gradient */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#0f5c2c_0%,_#073d1c_70%)]" />
                    <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/felt.png")' }} />
                    <div className="absolute inset-0 border-2 border-white/10 rounded-[90px] md:rounded-[190px] m-2" />
                </div>

                {/* Opponents - Top Area (Row on Mobile, Circular on Desktop) */}
                <div className="hidden md:block absolute inset-0 z-20 pointer-events-none">
                    {otherPlayers.map((p, i) => (
                        <div key={p.id} className={`${getOpponentLayout(i, otherPlayers.length)} pointer-events-auto`}>
                            <PlayerInfo pId={p.id} />
                        </div>
                    ))}
                </div>

                {/* Mobile Opponents Row */}
                <div className="md:hidden absolute top-8 left-0 w-full px-4 flex justify-around items-start z-20">
                    {otherPlayers.map((p) => (
                        <PlayerInfo key={p.id} pId={p.id} />
                    ))}
                </div>

                {/* Central Pile Area */}
                <div className="relative z-10 flex flex-col items-center justify-center scale-90 md:scale-110">
                    {/* Ranking List Button (Top Left of board) */}
                    {bcState.finishedPlayers.length > 0 && (
                        <div className="absolute bottom-full mb-10 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-md p-3 rounded-2xl border border-white/10 min-w-[200px] z-[60]">
                            <div className="text-[10px] font-black text-yellow-500 uppercase mb-2 tracking-widest border-b border-white/10 pb-1 italic">Leaderboard</div>
                            {bcState.finishedPlayers.slice(0, 3).map((pid, idx) => (
                                <div key={pid} className="flex justify-between items-center text-xs font-bold text-white mb-1 last:mb-0">
                                    <span className="opacity-50">#{idx + 1}</span>
                                    <span>{room.players.find(p => p.id === pid)?.username}</span>
                                    <span className="text-yellow-400">👑</span>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="relative w-32 h-48 md:w-40 md:h-56 transform-gpu">
                        <AnimatePresence>
                            {bcState.pile.length > 0 ? (
                                bcState.pile.slice(-8).map((card, i) => (
                                    <motion.div
                                        key={`pile-${card.suit}-${card.rank}-${i}`}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.3 } }}
                                        className="absolute inset-0"
                                        style={{ zIndex: i }}
                                    >
                                        <Card
                                            suit="BACK"
                                            rank="?"
                                            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 shadow-2xl"
                                            style={{
                                                // Precise offsets for a stacked deck look
                                                transform: `translate(-50%, -50%) translate(${i * 4}px, ${i * -3}px) rotate(${(i % 3 - 1) * 2}deg)`,
                                            }}
                                            compact
                                        />
                                    </motion.div>
                                ))
                            ) : (
                                <motion.div
                                    key="empty-pile"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="w-full h-full border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-white/5 text-xl font-black bg-black/10"
                                >
                                    <span className="rotate-12">PLACE</span>
                                    <span className="-rotate-12 mt-2">CARDS</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Current Call Animation */}
                        {bcState.lastMove && bcState.status !== 'REVEALING' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                className="absolute top-full mt-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 whitespace-nowrap shadow-2xl"
                            >
                                <div className="text-[10px] text-purple-400 font-black uppercase tracking-widest text-center mb-0.5">Last Call</div>
                                <div className="text-sm font-black text-white">
                                    <span className="text-yellow-400">{bcState.lastMove.cardsPlayed.length}x</span> {bcState.lastMove.declaredRank}
                                </div>
                            </motion.div>
                        )}

                        {/* Reveal Modal Overlay - Inside centered table */}
                        <AnimatePresence>
                            {(bcState.status === 'REVEALING' || (bcState.status === 'IN_PROGRESS' && bcState.challengerId)) && bcState.lastMove && (
                                <motion.div
                                    initial={{ scale: 0, opacity: 0, y: 20 }}
                                    animate={{ scale: 1, opacity: 1, y: 0 }}
                                    exit={{ scale: 0, opacity: 0, y: 20 }}
                                    className="absolute inset-0 z-[100] flex flex-col items-center justify-center p-4"
                                >
                                    <div className="bg-zinc-900 border-2 border-white/20 p-4 md:p-8 rounded-[32px] shadow-[0_0_150px_rgba(0,0,0,0.9)] flex flex-col items-center min-w-[320px] backdrop-blur-xl ring-2 ring-white/5">
                                        <div className="mb-6 text-center">
                                            <div className="bg-purple-600 px-4 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-widest mb-2 inline-block shadow-lg">Challenge!</div>
                                            <h2 className="text-xl md:text-2xl font-black text-white uppercase italic tracking-tighter">
                                                {room.players.find(p => p.id === bcState.challengerId)?.username} caught {room.players.find(p => p.id === bcState.lastMove!.playerId)?.username}
                                            </h2>
                                        </div>

                                        <div className="relative h-40 md:h-56 w-28 md:w-40 flex items-center justify-center mb-10 mt-4">
                                            {bcState.lastMove.cardsPlayed.map((c, i) => (
                                                <Card
                                                    key={i}
                                                    {...c}
                                                    className="absolute shadow-[0_0_60px_rgba(255,255,255,0.2)]"
                                                    style={{
                                                        transform: `translateX(${(i - (bcState.lastMove!.cardsPlayed.length - 1) / 2) * 35}px) rotate(${(i - (bcState.lastMove!.cardsPlayed.length - 1) / 2) * 10}deg)`,
                                                        zIndex: i
                                                    }}
                                                />
                                            ))}
                                        </div>

                                        <div className={`px-8 py-4 rounded-2xl border-2 font-black text-xl uppercase tracking-tighter mb-8 ${bcState.lastMove.cardsPlayed.some(c => c.rank !== bcState.lastMove!.declaredRank)
                                            ? "bg-red-500/30 border-red-500 text-red-500 shadow-[0_0_50px_rgba(239,68,68,0.4)]"
                                            : "bg-green-500/30 border-green-500 text-green-500 shadow-[0_0_50px_rgba(34,197,94,0.4)]"
                                            }`}>
                                            {bcState.lastMove.cardsPlayed.some(c => c.rank !== bcState.lastMove!.declaredRank) ? "🔥 BLUFF DETECTED! 🔥" : "✅ IT WAS THE TRUTH! ✅"}
                                        </div>

                                        {bcState.status === 'REVEALING' && (
                                            <motion.button
                                                whileHover={{ scale: 1.05, y: -2 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => makeMove({ action: 'NEXT_ROUND' })}
                                                className="w-full py-5 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-black rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.4)] uppercase tracking-wider text-lg border-b-4 border-yellow-800"
                                            >
                                                CONTINUE 🚀
                                            </motion.button>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Self - Bottom Area */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
                    <PlayerInfo pId={player.id} />
                </div>
            </div>

            {/* Bottom Section - Hand & Actions */}
            <div className="h-[220px] md:h-[320px] bg-gradient-to-t from-black to-transparent flex flex-col justify-end pb-4 md:pb-8 relative z-50">
                {/* Scrollable Hand Area */}
                <div className="w-full flex-1 overflow-x-auto overflow-y-hidden px-6 py-4 custom-scrollbar flex items-center justify-start md:justify-center">
                    <div className="flex px-12 py-10 transition-all duration-300 min-w-max">
                        {myHand.map((card, i) => (
                            <Card
                                key={`${card.suit}-${card.rank}-${i}`}
                                {...card}
                                isSelected={isCardSelected(card)}
                                onClick={() => toggleCardSelection(card)}
                                style={getHandCardStyle(i, myHand.length)}
                                className="transition-all hover:z-[100] active:scale-90"
                            />
                        ))}
                    </div>
                    {myHand.length === 0 && (
                        <div className="text-white/10 text-xl font-black uppercase tracking-[0.2em] animate-pulse">Waiting...</div>
                    )}
                </div>

                {/* Sticky Action Buttons */}
                <div className="flex justify-center items-center gap-2 md:gap-4 px-4 pb-0 md:pb-4 w-full max-w-lg mx-auto">
                    <button
                        onClick={handlePass}
                        disabled={!isMyTurn || !bcState.currentRank}
                        className="flex-1 py-4 md:py-6 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-30 text-white font-black text-xs md:text-sm rounded-2xl transition-all uppercase tracking-widest border-b-4 border-yellow-800 active:border-b-0 active:translate-y-1 shadow-xl"
                    >
                        PASS ⏭️
                    </button>
                    <button
                        onClick={handlePlay}
                        disabled={!isMyTurn || selectedCards.length === 0}
                        className="flex-[2] py-4 md:py-6 bg-green-600 hover:bg-green-500 disabled:opacity-30 text-white font-black text-sm md:text-lg rounded-2xl transition-all uppercase tracking-widest border-b-4 border-green-800 active:border-b-0 active:translate-y-1 shadow-2xl"
                    >
                        PLAY {selectedCards.length > 0 ? `(${selectedCards.length})` : '🚀'}
                    </button>
                    <button
                        onClick={handleShow}
                        disabled={!bcState.lastMove || bcState.lastMove.playerId === player.id || bcState.status === 'REVEALING'}
                        className="flex-1 py-4 md:py-6 bg-red-600 hover:bg-red-500 disabled:opacity-30 text-white font-black text-xs md:text-sm rounded-2xl transition-all uppercase tracking-widest border-b-4 border-red-800 active:border-b-0 active:translate-y-1 shadow-xl"
                    >
                        SHOW! 🕵️
                    </button>
                </div>
            </div>

            {/* Rank Selection Modal */}
            <AnimatePresence>
                {showRankPicker && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-zinc-900 border border-white/10 p-6 md:p-10 rounded-[40px] max-w-md w-full shadow-2xl"
                        >
                            <h2 className="text-2xl font-black text-white text-center mb-8 uppercase italic tracking-tighter">Declare a Rank</h2>
                            <div className="grid grid-cols-4 md:grid-cols-4 gap-2 md:gap-4">
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
                                        className="py-4 bg-white/5 hover:bg-yellow-500 hover:text-black text-white font-black text-lg rounded-2xl transition-all border border-white/5 shadow-lg flex items-center justify-center"
                                    >
                                        {rank}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setShowRankPicker(false)}
                                className="w-full mt-8 py-3 text-white/40 font-bold hover:text-white uppercase text-xs tracking-widest"
                            >
                                BACK TO SELECTION
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

'use client';

import { motion } from 'framer-motion';

export type Suit = 'HEARTS' | 'DIAMONDS' | 'CLUBS' | 'SPADES' | 'BACK';

interface CardProps {
    suit: Suit;
    rank: string;
    isRevealed?: boolean;
    isSelected?: boolean;
    onClick?: () => void;
    className?: string;
    style?: React.CSSProperties;
}

const SUIT_SYMBOLS = {
    HEARTS: '❤️',
    DIAMONDS: '💎',
    CLUBS: '♣️',
    SPADES: '♠️',
    BACK: '?'
};

const SUIT_COLORS = {
    HEARTS: 'text-red-500',
    DIAMONDS: 'text-blue-400',
    CLUBS: 'text-gray-800',
    SPADES: 'text-gray-900',
    BACK: 'text-white/20'
};

export function Card({ suit, rank, isRevealed = true, isSelected, onClick, className = '', style }: CardProps) {
    const isBack = suit === 'BACK' || !isRevealed;

    return (
        <motion.div
            whileHover={{ y: isBack ? 0 : -10, scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            style={style}
            className={`
                relative w-24 h-36 md:w-32 md:h-48 rounded-xl md:rounded-2xl shadow-xl cursor-pointer
                transition-all duration-300 transform-gpu preserve-3d
                ${isSelected ? 'ring-4 ring-yellow-400 -translate-y-4 shadow-[0_0_30px_rgba(250,204,21,0.5)]' : ''}
                ${isBack ? 'bg-gradient-to-br from-purple-900 to-indigo-950 border-4 border-white/10' : 'bg-white border-2 border-gray-200'}
                ${className}
            `}
        >
            {isBack ? (
                <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-xl md:rounded-2xl">
                    <div className="absolute inset-2 border-2 border-dashed border-white/10 rounded-lg md:rounded-xl" />
                    <div className="text-4xl md:text-6xl opacity-20 rotate-12">🎮</div>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)] from-white/10" />
                </div>
            ) : (
                <div className={`flex flex-col h-full p-2 md:p-4 ${SUIT_COLORS[suit as keyof typeof SUIT_COLORS]}`}>
                    <div className="flex justify-between items-start">
                        <span className="text-lg md:text-2xl font-black leading-none">{rank}</span>
                        <span className="text-xl md:text-3xl leading-none">{SUIT_SYMBOLS[suit as keyof typeof SUIT_SYMBOLS]}</span>
                    </div>

                    <div className="flex-1 flex items-center justify-center">
                        <span className="text-4xl md:text-7xl opacity-90">{SUIT_SYMBOLS[suit as keyof typeof SUIT_SYMBOLS]}</span>
                    </div>

                    <div className="flex justify-between items-end rotate-180">
                        <span className="text-lg md:text-2xl font-black leading-none">{rank}</span>
                        <span className="text-xl md:text-3xl leading-none">{SUIT_SYMBOLS[suit as keyof typeof SUIT_SYMBOLS]}</span>
                    </div>
                </div>
            )}
        </motion.div>
    );
}

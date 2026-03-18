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
    compact?: boolean; // Prop for smaller sizing in the fan
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

export function Card({ suit, rank, isRevealed = true, isSelected, onClick, className = '', style, compact }: CardProps) {
    const isBack = suit === 'BACK' || !isRevealed;

    return (
        <motion.div
            whileHover={{ y: isBack ? 0 : -10, scale: 1.05, zIndex: 100 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            style={style}
            className={`
                relative rounded-xl md:rounded-2xl shadow-xl cursor-pointer
                transition-all duration-300 transform-gpu preserve-3d
                ${compact ? 'w-16 h-24 md:w-20 md:h-28' : 'w-24 h-36 md:w-32 md:h-48'}
                ${isSelected ? 'ring-4 ring-yellow-400 -translate-y-4 shadow-[0_0_40px_rgba(250,204,21,0.6)] z-50 scale-105' : ''}
                ${isBack
                    ? 'bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 border-2 md:border-4 border-white/20'
                    : 'bg-white border-[1px] md:border-2 border-gray-100'
                }
                ${className}
            `}
        >
            {isBack ? (
                <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-xl md:rounded-2xl">
                    <div className="absolute inset-1.5 md:inset-3 border-[1px] md:border-2 border-dashed border-white/10 rounded-lg md:rounded-xl opacity-40" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)] from-white/10" />
                    <div className="flex flex-col items-center gap-1 md:gap-2">
                        <div className={`${compact ? 'text-2xl' : 'text-4xl md:text-6xl'} opacity-30 rotate-12 drop-shadow-lg`}>🃏</div>
                        <div className="text-[8px] md:text-xs font-black text-white/10 uppercase tracking-[0.3em]">Bluff</div>
                    </div>
                    {/* Pattern Overlay */}
                    <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 0)', backgroundSize: '10px 10px' }} />
                </div>
            ) : (
                <div className={`flex flex-col h-full rounded-xl md:rounded-2xl ${SUIT_COLORS[suit as keyof typeof SUIT_COLORS]} bg-gradient-to-br from-white to-gray-50 shadow-inner`}>
                    <div className="flex justify-between items-start p-1.5 md:p-3">
                        <div className="flex flex-col items-center">
                            <span className={`${compact ? 'text-sm' : 'text-lg md:text-2xl'} font-black leading-none uppercase`}>{rank}</span>
                            <span className={`${compact ? 'text-[8px]' : 'text-xs'} leading-none`}>{SUIT_SYMBOLS[suit as keyof typeof SUIT_SYMBOLS]}</span>
                        </div>
                        <span className={`${compact ? 'text-xs' : 'text-xl md:text-2xl'} leading-none opacity-40`}>{SUIT_SYMBOLS[suit as keyof typeof SUIT_SYMBOLS]}</span>
                    </div>

                    <div className="flex-1 flex items-center justify-center">
                        <div className="relative">
                            <span className={`${compact ? 'text-3xl' : 'text-5xl md:text-8xl'} opacity-90 drop-shadow-sm`}>{SUIT_SYMBOLS[suit as keyof typeof SUIT_SYMBOLS]}</span>
                            <div className="absolute inset-0 blur-2xl opacity-20 scale-150">{SUIT_SYMBOLS[suit as keyof typeof SUIT_SYMBOLS]}</div>
                        </div>
                    </div>

                    <div className="flex justify-between items-end p-1.5 md:p-3 rotate-180">
                        <div className="flex flex-col items-center">
                            <span className={`${compact ? 'text-sm' : 'text-lg md:text-2xl'} font-black leading-none uppercase`}>{rank}</span>
                            <span className={`${compact ? 'text-[8px]' : 'text-xs'} leading-none`}>{SUIT_SYMBOLS[suit as keyof typeof SUIT_SYMBOLS]}</span>
                        </div>
                        <span className={`${compact ? 'text-xs' : 'text-xl md:text-2xl'} leading-none opacity-40`}>{SUIT_SYMBOLS[suit as keyof typeof SUIT_SYMBOLS]}</span>
                    </div>
                </div>
            )}
        </motion.div>
    );
}

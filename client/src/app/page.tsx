'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '../hooks/useGameStore';
import { useUser, SignInButton, SignOutButton } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import { SocialPanel } from '../components/SocialPanel';
import { LieDetectorBoard } from '../components/LieDetectorBoard';

export default function Home() {
  const { player, room, connect, createRoom, joinRoom, startGame, gameState } = useGameStore();
  const { user, isLoaded, isSignedIn } = useUser();
  const [username, setUsername] = useState('');
  const [roomCode, setRoomCode] = useState('');

  useEffect(() => {
    if (isLoaded && isSignedIn && user && !player) {
      connect(user.username || user.firstName || user.emailAddresses[0].emailAddress.split('@')[0] || 'Player');
    }
  }, [isLoaded, isSignedIn, user, player, connect]);

  if (!isLoaded) return (
    <div className="min-h-screen flex items-center justify-center">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="text-6xl">🍭</motion.div>
    </div>
  );

  if (!isSignedIn) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="absolute top-10 left-10 animate-float text-4xl">🎮</div>
        <div className="absolute bottom-10 right-10 animate-float text-4xl" style={{ animationDelay: '2s' }}>🎲</div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card max-w-md w-full text-center"
        >
          <h2 className="text-4xl font-black mb-6 candy-text">Ready to Party?</h2>
          <p className="text-white/70 mb-8 font-bold text-lg">Sign in to start playing with your squad! 🚀</p>
          <SignInButton mode="modal">
            <button className="btn-primary w-full text-2xl py-6">
              LET'S GO! 🎮
            </button>
          </SignInButton>
        </motion.div>
      </main>
    );
  }

  if (!room) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <div className="grid md:grid-cols-2 gap-12 max-w-5xl w-full">
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            whileHover={{ scale: 1.05, rotate: -2 }}
            className="card cursor-pointer group"
            onClick={createRoom}
          >
            <div className="h-56 flex items-center justify-center bg-yellow-400/20 rounded-3xl mb-8 group-hover:bg-yellow-400/30 transition-all">
              <span className="text-9xl animate-float">🏠</span>
            </div>
            <h2 className="text-4xl font-black mb-4 candy-text">Host Party</h2>
            <p className="text-white/80 text-lg">Be the boss! Start a new room and boss your friends around. 😎</p>
          </motion.div>

          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            whileHover={{ scale: 1.05, rotate: 2 }}
            className="card"
          >
            <div className="h-56 flex items-center justify-center bg-cyan-400/20 rounded-3xl mb-8">
              <span className="text-9xl animate-float" style={{ animationDelay: '1s' }}>🔑</span>
            </div>
            <h2 className="text-4xl font-black mb-4 candy-text">Join Party</h2>
            <div className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="MAGIC CODE..."
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="w-full bg-white/20 border-4 border-white/30 rounded-2xl py-4 px-6 text-white placeholder:text-white/50 text-xl font-bold focus:border-cyan-400 outline-none transition-all uppercase"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => joinRoom(roomCode)}
                className="btn-secondary text-2xl"
              >
                LET ME IN! 🎊
              </motion.button>
            </div>
          </motion.div>
        </div>
      </main>
    );
  }

  if (room.status === 'WAITING') {
    return (
      <main className="min-h-screen p-8 max-w-7xl mx-auto">
        <SocialPanel />
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex flex-col md:flex-row justify-between items-center gap-8 mb-16"
        >
          <div className="text-center md:text-left">
            <h1 className="text-3xl md:text-5xl font-black mb-2 candy-text">ROOM: {room.code}</h1>
            <p className="text-lg md:text-2xl font-bold text-white/70">Wait for squad... {room.players.length}/4! 🕺</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              onClick={() => useGameStore.getState().leaveRoom()}
              className="bg-white/10 hover:bg-white/20 text-white font-black px-6 py-2 rounded-full border border-white/20 uppercase text-sm"
            >
              Go to Lobby 🏠
            </motion.button>
            <SignOutButton>
              <motion.button whileHover={{ scale: 1.1 }} className="bg-red-500 text-white font-black px-6 py-2 rounded-full uppercase text-sm">
                Sign Out 👋
              </motion.button>
            </SignOutButton>
            <motion.button whileHover={{ scale: 1.1 }} onClick={() => startGame('TIC_TAC_TOE')} className="btn-primary text-xl">
              ❌ Tic Tac Toe ⭕
            </motion.button>
            <motion.button whileHover={{ scale: 1.1 }} onClick={() => startGame('SNAKE_LADDERS')} className="btn-secondary text-xl">
              🐍 Snakes & Ladders 🪜
            </motion.button>
            <motion.button whileHover={{ scale: 1.1 }} onClick={() => startGame('HANGMAN')} className="px-6 py-2 rounded-full border-2 border-yellow-500/50 bg-yellow-400 text-purple-900 font-black text-xl hover:bg-yellow-300 transition-all shadow-[0_0_20px_rgba(250,204,21,0.3)]">
              🧛‍♂️ Hangman Party 🕵️‍♂️
            </motion.button>
            <motion.button whileHover={{ scale: 1.1 }} onClick={() => startGame('LIE_DETECTOR')} className="px-6 py-2 rounded-full border-2 border-red-500/50 bg-red-500 text-white font-black text-xl hover:bg-red-400 transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)]">
              🤫 Lie Detector 😈
            </motion.button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <AnimatePresence>
            {room.players.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, scale: 0.5, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ delay: i * 0.1, type: 'spring', stiffness: 200 }}
                className="card flex flex-col items-center bg-white/5 relative"
              >
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center text-2xl shadow-lg border-2 border-white">
                  {['🔥', '⭐', '🌈', '💎'][i % 4]}
                </div>
                <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-white/20 to-white/5 mb-6 flex items-center justify-center text-6xl shadow-inner">
                  {p.username[0].toUpperCase()}
                </div>
                <span className="text-3xl font-black">{p.username}</span>
                {p.id === room.players[0].id && (
                  <span className="bg-yellow-400 text-purple-900 px-4 py-1 rounded-full font-black text-sm mt-4 shadow-lg uppercase tracking-wider">
                    PARTY BOSS
                  </span>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-12 flex items-center justify-center">
      <SocialPanel />
      <AnimatePresence>
        {gameState?.status === 'FINISHED' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.5, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              className="card max-w-2xl w-full text-center py-12 relative border-8 border-white/20"
            >
              {gameState.winnerId === player?.id && [...Array(30)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ x: 0, y: 0 }}
                  animate={{
                    x: (Math.random() - 0.5) * 800,
                    y: (Math.random() - 0.5) * 800,
                    scale: [0, 1, 0],
                    rotate: 360
                  }}
                  transition={{ repeat: Infinity, duration: 2, delay: i * 0.1 }}
                  className="absolute left-1/2 top-1/2 text-5xl"
                >
                  {['🎉', '✨', '🔥', '💎', '⭐', '🎈'][i % 6]}
                </motion.div>
              ))}

              <div className="relative z-10 px-6">
                <span className="text-6xl md:text-9xl mb-4 block animate-bounce">
                  {gameState.winnerId === player?.id ? '🏆' : !gameState.winnerId ? '🤝' : '💀'}
                </span>

                <h2 className="text-4xl md:text-7xl font-black mb-6 md:mb-10 candy-text uppercase tracking-tighter">
                  {gameState.winnerId === player?.id
                    ? 'YOU WON!!!'
                    : !gameState.winnerId
                      ? "IT'S A DRAW!"
                      : 'YOU LOST...'}
                </h2>

                {room.gameType === 'HANGMAN' && (gameState as any).word && (
                  <div className="mb-10 bg-white/5 p-6 rounded-3xl border border-white/10">
                    <p className="text-white/30 font-black uppercase tracking-widest text-xs mb-2">The Secret Word Was</p>
                    <p className="text-4xl md:text-6xl font-black text-yellow-300 tracking-[0.5em] uppercase">{(gameState as any).word}</p>
                  </div>
                )}

                {/* Leaderboard Section */}
                <div className="bg-white/10 rounded-3xl p-6 mb-10 border border-white/10 shadow-2xl">
                  <h3 className="text-2xl font-black text-white/50 uppercase tracking-widest mb-6 border-b border-white/10 pb-4">
                    Hall of Fame (and Shame)
                  </h3>
                  <div className="space-y-4">
                    {room.players.map((p) => (
                      <div
                        key={p.id}
                        className={`flex items-center justify-between p-4 rounded-2xl border-4 transition-all ${p.id === gameState.winnerId
                          ? 'bg-yellow-400/20 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.3)]'
                          : 'bg-white/5 border-white/10'
                          }`}
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-3xl">{p.id === gameState.winnerId ? '👑' : '👾'}</span>
                          <span className={`text-2xl font-black ${p.id === gameState.winnerId ? 'text-yellow-300' : 'text-white'}`}>
                            {p.username} {p.id === player?.id ? '(YOU)' : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          {(room as any).rematchRequests?.includes(p.id) && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="bg-green-500 text-white text-xs font-black px-3 py-1 rounded-full animate-bounce shadow-lg"
                            >
                              INVITE SENT! 💌
                            </motion.span>
                          )}
                          <span className="font-black text-xl text-white/50 uppercase tracking-widest">
                            {p.id === gameState.winnerId ? 'WINNER!' : 'PLAYED'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => useGameStore.getState().requestRematch()}
                    disabled={(room as any).rematchRequests?.includes(player?.id || '')}
                    className={`btn-primary text-xl md:text-3xl py-4 md:py-6 flex flex-col items-center gap-1 ${(room as any).rematchRequests?.includes(player?.id || '') ? 'opacity-50 cursor-not-allowed grayscale' : ''
                      }`}
                  >
                    <span className="text-[10px] md:text-sm font-black text-purple-900/50 uppercase tracking-widest">Ready for Round 2?</span>
                    <span>{(room as any).rematchRequests?.includes(player?.id || '') ? 'SENT! ⏳' : 'REMATCH! 🔄'}</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => useGameStore.getState().resetRoom()}
                    className="btn-secondary text-xl md:text-3xl py-4 md:py-6 flex flex-col items-center gap-1 bg-white/20 hover:bg-white/30 border-white/40"
                  >
                    <span className="text-[10px] md:text-sm font-black text-purple-900/50 uppercase tracking-widest">Enough social for today</span>
                    <span>LOBBY 🏠</span>
                  </motion.button>
                </div>

                <div className="mt-8">
                  <p className="text-white/40 font-black uppercase text-sm tracking-widest">
                    {(room as any).rematchRequests?.length || 0} / {room.players.length} Players ready for Rematch
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="card w-full max-w-5xl text-center relative border-8 border-white/20"
      >
        <div className="absolute -top-6 md:-top-10 left-1/2 -translate-x-1/2 bg-white px-6 md:px-10 py-2 md:py-4 rounded-2xl md:rounded-3xl shadow-2xl skew-x-[-10deg] whitespace-nowrap">
          <h2 className="text-2xl md:text-4xl font-black text-purple-900 leading-none">
            {room.gameType?.replace('_', ' ')}
          </h2>
        </div>

        <div className="bg-black/20 rounded-3xl p-6 md:p-12 flex flex-col items-center justify-center min-h-[500px] mt-8 overflow-hidden relative">
          {gameState && (
            <div className="mb-8 bg-white/10 px-6 py-2 rounded-full border border-white/20 shadow-xl flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full animate-pulse ${gameState.currentTurn === player?.id ? 'bg-green-400' : 'bg-red-400'}`} />
              <span className="text-xl font-black uppercase tracking-widest text-white/90">
                {gameState.currentTurn === player?.id
                  ? "IT'S YOUR TURN! ⚡"
                  : `Waiting for ${room.players.find(p => p.id === gameState.currentTurn)?.username || 'Opponent'}... 😴`}
              </span>
            </div>
          )}
          {room.gameType === 'TIC_TAC_TOE' && <TicTacToeBoard />}
          {room.gameType === 'SNAKE_LADDERS' && <SnakeLaddersBoard />}
          {room.gameType === 'HANGMAN' && <HangmanBoard />}
          {room.gameType === 'LIE_DETECTOR' && <LieDetectorBoard />}
          {room.gameType === 'LUDO' && <p className="text-4xl font-black">LUDO PARTY COMING SOON! 🎲✨</p>}
        </div>
      </motion.div>
    </main>
  );
}

function HangmanBoard() {
  const { gameState, makeMove, player } = useGameStore();
  const [wordInput, setWordInput] = useState('');

  if (!gameState) return null;
  const hangmanState = gameState as any;

  // 1. Handling Word Selection (Setter)
  if (hangmanState.status === 'WAITING') {
    return (
      <div className="flex flex-col items-center gap-8 w-full max-w-md">
        <h3 className="text-3xl font-black text-white/50 uppercase">Pick the Secret Word! 🧛‍♂️</h3>
        {player?.id === hangmanState.setterId ? (
          <div className="w-full space-y-4">
            <input
              type="text"
              value={wordInput}
              onChange={(e) => setWordInput(e.target.value.toUpperCase())}
              placeholder="e.g. ANTIGRAVITY"
              className="w-full bg-white/10 rounded-2xl px-6 py-4 text-2xl font-black text-center focus:ring-4 focus:ring-purple-500 outline-none border-2 border-white/10"
            />
            <button
              onClick={() => makeMove({ word: wordInput })}
              className="btn-primary w-full py-4 text-2xl"
            >
              SET WORD! 🔥
            </button>
            <p className="text-white/30 text-center font-bold">3-12 letters, A-Z only</p>
          </div>
        ) : (
          <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xl font-black text-white/50">Setter is picking the word...</p>
          </div>
        )}
      </div>
    );
  }

  // 2. Main Game View
  return (
    <div className="flex flex-col lg:flex-row items-center gap-12 w-full justify-around h-full py-4">
      <div className="flex flex-col items-center gap-10 w-full max-w-xl">
        <HangmanDrawing wrongCount={hangmanState.wrongLetters?.length || 0} />

        <div className="flex flex-wrap justify-center gap-2 md:gap-4">
          {(hangmanState.maskedWord || []).map((letter: string, i: number) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-8 h-10 md:w-12 md:h-16 bg-white/10 rounded-xl md:rounded-2xl border-b-4 md:border-b-8 border-purple-500 flex items-center justify-center text-2xl md:text-5xl font-black"
            >
              {letter !== '_' ? letter : ''}
            </motion.div>
          ))}
        </div>

        <HangmanKeyboard
          disabled={player?.id === hangmanState.setterId || hangmanState.status === 'FINISHED'}
          guessedLetters={[...(hangmanState.guessedLetters || []), ...(hangmanState.wrongLetters || [])]}
          onGuess={(letter) => makeMove({ letter })}
        />
      </div>

      <div className="flex flex-col items-center gap-6 card bg-white/10 p-6 md:p-10 min-w-full md:min-w-[300px]">
        <h3 className="text-xl md:text-3xl font-black text-center">
          {player?.id === hangmanState.setterId ? (
            <span className="text-cyan-300">WATCH THEM FAIL! 😈</span>
          ) : (
            <span className="text-yellow-300 animate-pulse">YOUR TURN TO GUESS! 🕵️‍♂️</span>
          )}
        </h3>

        <div className="bg-black/20 rounded-2xl p-6 w-full space-y-4">
          <div className="flex justify-between items-center text-sm md:text-lg">
            <span className="text-white/50 font-black uppercase">Lives Left</span>
            <span className="text-red-400 font-black text-2xl">{hangmanState.attemptsLeft || 0} / 6</span>
          </div>
          <div className="space-y-2">
            <span className="text-white/30 font-black uppercase text-xs">Wrong Guesses</span>
            <div className="flex flex-wrap gap-2">
              {(hangmanState.wrongLetters || []).map((l: string) => (
                <span key={l} className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center font-black line-through">{l}</span>
              ))}
              {(!hangmanState.wrongLetters || hangmanState.wrongLetters.length === 0) && <span className="text-white/10 italic">None yet...</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HangmanDrawing({ wrongCount }: { wrongCount: number }) {
  const parts = [
    <circle key="head" cx="150" cy="70" r="25" stroke="white" strokeWidth="8" fill="none" />, // Head
    <line key="body" x1="150" y1="95" x2="150" y2="170" stroke="white" strokeWidth="8" />, // Body
    <line key="la" x1="150" y1="120" x2="110" y2="150" stroke="white" strokeWidth="8" />, // L Arm
    <line key="ra" x1="150" y1="120" x2="190" y2="150" stroke="white" strokeWidth="8" />, // R Arm
    <line key="ll" x1="150" y1="170" x2="120" y2="220" stroke="white" strokeWidth="8" />, // L Leg
    <line key="rl" x1="150" y1="170" x2="180" y2="220" stroke="white" strokeWidth="8" />, // R Leg
  ];

  return (
    <svg width="200" height="250" viewBox="0 0 200 250" className="drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
      {/* Gallows */}
      <line x1="20" y1="230" x2="180" y2="230" stroke="white" strokeWidth="8" />
      <line x1="50" y1="230" x2="50" y2="20" stroke="white" strokeWidth="8" />
      <line x1="50" y1="20" x2="150" y2="20" stroke="white" strokeWidth="8" />
      <line x1="150" y1="20" x2="150" y2="45" stroke="white" strokeWidth="8" />

      {/* Body Parts */}
      {parts.slice(0, wrongCount)}
    </svg>
  );
}

function HangmanKeyboard({ disabled, guessedLetters, onGuess }: { disabled: boolean, guessedLetters: string[], onGuess: (l: string) => void }) {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  return (
    <div className="grid grid-cols-7 md:grid-cols-9 gap-2 w-full">
      {letters.map(l => (
        <motion.button
          key={l}
          whileHover={!disabled && !guessedLetters.includes(l) ? { scale: 1.1 } : {}}
          whileTap={!disabled && !guessedLetters.includes(l) ? { scale: 0.9 } : {}}
          onClick={() => onGuess(l)}
          disabled={disabled || guessedLetters.includes(l)}
          className={`aspect-square rounded-lg md:rounded-xl font-black text-sm md:text-xl transition-all border-2 ${guessedLetters.includes(l)
            ? 'bg-white/5 border-white/5 text-white/10'
            : disabled
              ? 'bg-white/5 border-white/10 text-white/20'
              : 'bg-white/10 border-white/20 text-white hover:bg-purple-600 hover:border-purple-400'
            }`}
        >
          {l}
        </motion.button>
      ))}
    </div>
  );
}

function TicTacToeBoard() {
  const { gameState, makeMove } = useGameStore();
  if (!gameState) return null;

  return (
    <div className="grid grid-cols-3 gap-3 md:gap-6 w-full max-w-[320px] md:max-w-[400px]">
      {gameState.board.map((cell: string | null, i: number) => (
        <motion.button
          key={i}
          disabled={!!cell || gameState.currentTurn !== useGameStore.getState().player?.id}
          whileHover={!cell && gameState.currentTurn === useGameStore.getState().player?.id ? { scale: 1.1, rotate: [0, 5, -5, 0] } : {}}
          whileTap={!cell && gameState.currentTurn === useGameStore.getState().player?.id ? { scale: 0.9 } : {}}
          onClick={() => makeMove({ index: i })}
          className={`aspect-square bg-white/10 rounded-[24px] md:rounded-[40px] text-4xl md:text-6xl font-black flex items-center justify-center transition-all border-2 md:border-4 border-white/10 shadow-2xl ${!cell && gameState.currentTurn === useGameStore.getState().player?.id ? 'hover:bg-white/20 cursor-pointer' : 'opacity-80 cursor-not-allowed'
            }`}
        >
          {cell === 'X' && (
            <motion.span
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              className="text-yellow-300 drop-shadow-[0_4px_0_rgba(0,0,0,0.5)]"
            >
              ❌
            </motion.span>
          )}
          {cell === 'O' && (
            <motion.span
              initial={{ scale: 0, rotate: 180 }}
              animate={{ scale: 1, rotate: 0 }}
              className="text-cyan-300 drop-shadow-[0_4px_0_rgba(0,0,0,0.5)]"
            >
              ⭕
            </motion.span>
          )}
        </motion.button>
      ))}
    </div>
  );
}

function SnakeLaddersBoard() {
  const { gameState, makeMove, player } = useGameStore();
  if (!gameState) return null;

  const rollDice = () => {
    const dice = Math.floor(Math.random() * 6) + 1;
    makeMove({ dice });
  };

  return (
    <div className="flex flex-col lg:flex-row items-center gap-8 md:gap-12 w-full justify-around h-full overflow-y-auto lg:overflow-visible py-4">
      <div className="grid grid-cols-10 gap-1 md:gap-1.5 bg-black/40 p-2 md:p-3 rounded-[24px] md:rounded-[40px] border-4 md:border-8 border-white/20 shadow-inner w-full max-w-[360px] md:max-w-none">
        {Array.from({ length: 100 }, (_, i) => {
          const num = 100 - i;
          const cellNum = num;
          const playersHere = Object.entries(gameState.board).filter(([_, pos]) => pos === cellNum);
          const isSpecial = [2, 7, 8, 15, 21, 28, 36, 51, 71, 78, 87, 16, 46, 49, 62, 64, 74, 89, 92, 95, 99].includes(cellNum);

          return (
            <div key={cellNum} className={`w-full aspect-square rounded-lg md:rounded-xl border-[1px] md:border-2 border-white/5 flex items-center justify-center font-bold text-white/30 relative text-[8px] md:text-base ${isSpecial ? 'bg-white/5' : ''}`}>
              {cellNum}
              <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-0.5 z-10 p-0.5 md:p-1">
                {playersHere.map(([pid], idx) => (
                  <motion.div
                    key={pid}
                    layoutId={pid}
                    className={`w-3 h-3 sm:w-4 sm:h-4 md:w-8 md:h-8 rounded-full border-[1.5px] md:border-2 border-white shadow-lg ${pid === player?.id ? 'bg-yellow-400 z-20 shadow-yellow-400/50' : 'bg-cyan-400 shadow-cyan-400/50'}`}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2, delay: idx * 0.2 }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col items-center gap-4 md:gap-8 card bg-white/10 p-6 md:p-10 min-w-full md:min-w-[300px]">
        <h3 className="text-3xl font-black">
          {gameState.currentTurn === player?.id ? (
            <span className="text-yellow-300 animate-pulse">YOUR TURN! 🔥</span>
          ) : (
            <span className="text-white/50">WAITING... 😴</span>
          )}
        </h3>

        <div className="relative group">
          <motion.div
            animate={gameState.currentTurn === player?.id ? { rotate: [0, 5, -5, 0] } : {}}
            transition={{ repeat: Infinity, duration: 0.5 }}
            className="text-9xl mb-4 cursor-pointer"
            onClick={gameState.currentTurn === player?.id ? rollDice : undefined}
          >
            🎲
          </motion.div>
          {gameState.currentTurn === player?.id && (
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute inset-0 bg-yellow-400/20 rounded-full blur-2xl -z-10"
            />
          )}
        </div>

        <button
          onClick={rollDice}
          disabled={gameState.currentTurn !== player?.id}
          className="btn-primary text-3xl px-12 py-5 w-full shadow-[0_0_30px_rgba(250,204,21,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ROLL IT! 🎲
        </button>

        <div className="flex flex-col gap-2 w-full mt-4">
          <p className="font-bold text-white/50 uppercase tracking-widest text-center">Scoreboard</p>
          {Object.entries(gameState.board).map(([pid, pos]) => (
            <div key={pid} className="flex justify-between items-center bg-white/5 p-3 rounded-2xl">
              <span className="font-bold">{pid === player?.id ? 'YOU' : 'OPPONENT'}</span>
              <span className="bg-white/20 px-4 py-1 rounded-full font-black text-yellow-300">{(pos as any)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

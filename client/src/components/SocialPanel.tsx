'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Mic, MicOff, Send, Volume2, VolumeX, Users, ChevronRight, ChevronLeft } from 'lucide-react';
import { useGameStore } from '../hooks/useGameStore';
import { useVoiceChat } from '../hooks/useVoiceChat';

export function SocialPanel() {
  const [isOpen, setIsOpen] = useState(true);
  const [chatText, setChatText] = useState('');
  const [hasUnread, setHasUnread] = useState(false);
  const { messages, sendMessage, room, player } = useGameStore();
  const { streams, isMuted, toggleMute, remoteMutes, toggleRemoteMute } = useVoiceChat();
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Track unread messages when closed
  useEffect(() => {
    if (!isOpen && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.playerId !== player?.id) {
        setHasUnread(true);
      }
    }
  }, [messages, isOpen, player?.id]);

  // Clear unread when opening
  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
    }
  }, [isOpen]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatText.trim()) {
      sendMessage(chatText.trim());
      setChatText('');
    }
  };

  return (
    <div className={`fixed right-0 top-1/2 -translate-y-1/2 z-40 flex transition-all duration-500 ${isOpen ? 'translate-x-0' : 'translate-x-[calc(100%-40px)] md:translate-x-[calc(100%-40px)]'}`}>
      {/* Toggle Handle - Visible on all screens */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="h-16 md:h-20 w-8 md:w-10 bg-purple-600 rounded-l-2xl flex items-center justify-center text-white shadow-2xl hover:bg-purple-500 transition-colors relative"
      >
        {isOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        
        {/* Notification Dot */}
        <AnimatePresence>
          {!isOpen && hasUnread && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -left-1 w-4 h-4 bg-green-400 rounded-full border-2 border-purple-600 shadow-[0_0_10px_#4ade80]"
            >
              <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* Main Panel */}
      <div className={`w-[85vw] md:w-80 h-[80dvh] md:h-[600px] bg-black/80 backdrop-blur-3xl rounded-l-3xl p-4 md:p-6 border-l-4 border-y-4 md:border-y-0 border-white/10 flex flex-col gap-4 md:gap-6 shadow-[-20px_0_50px_rgba(0,0,0,0.5)] relative`}>
        {/* Header - Players & Mic Status */}
        <div className="flex flex-col gap-3 md:gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm md:text-xl font-black text-white/50 uppercase tracking-widest flex items-center gap-2">
              <Users className="w-4 h-4 md:w-5 md:h-5" /> SQUAD
            </h3>
            <button 
              onClick={toggleMute}
              className={`p-2 md:p-3 rounded-xl md:rounded-2xl transition-all ${isMuted ? 'bg-red-500/20 text-red-500 border-2 border-red-500/50' : 'bg-green-500/20 text-green-500 border-2 border-green-500/50'}`}
            >
              {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 md:gap-2">
            {room?.players.map(p => (
              <div key={p.id} className="relative group">
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center text-xl md:text-2xl font-black border-2 transition-all ${p.id === player?.id ? 'bg-purple-500 border-purple-400' : 'bg-white/10 border-white/20'}`}>
                  {p.username[0].toUpperCase()}
                  {/* Remote Stream Element */}
                  {p.id !== player?.id && streams[p.id] && (
                    <AudioStream stream={streams[p.id]} muted={remoteMutes[p.id]} />
                  )}
                </div>
                {p.id !== player?.id && (
                  <button 
                    onClick={() => toggleRemoteMute(p.id)}
                    className={`absolute -top-1 -right-1 p-1 rounded-lg z-10 transition-all ${remoteMutes[p.id] ? 'bg-red-500 text-white' : 'bg-white/20 text-white opacity-0 group-hover:opacity-100'}`}
                  >
                    {remoteMutes[p.id] ? <VolumeX size={12} /> : <Volume2 size={12} />}
                  </button>
                )}
                <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]" />
              </div>
            ))}
          </div>
        </div>

        {/* Chat Section */}
        <div className="flex-1 flex flex-col min-h-0 bg-white/5 rounded-2xl md:rounded-3xl border border-white/10">
          <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4 scrollbar-hide">
            {messages.map((msg, i) => (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                key={i} 
                className={`flex flex-col ${msg.playerId === player?.id ? 'items-end' : 'items-start'}`}
              >
                <span className="text-[8px] md:text-[10px] font-black uppercase text-white/30 mb-0.5 md:mb-1">{msg.username}</span>
                <div className={`max-w-[85%] px-3 md:px-4 py-1.5 md:py-2 rounded-xl md:rounded-2xl text-[12px] md:text-sm font-bold ${msg.playerId === player?.id ? 'bg-purple-600 text-white rounded-tr-none' : 'bg-white/10 text-white rounded-tl-none'}`}>
                  {msg.text}
                </div>
              </motion.div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSend} className="p-2 md:p-4 flex gap-1.5 md:gap-2">
            <input 
              type="text"
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              placeholder="Chat..."
              className="flex-1 bg-white/10 rounded-lg md:rounded-xl px-3 md:px-4 py-1.5 md:py-2 text-white text-[12px] md:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-purple-500 border border-white/10"
            />
            <button type="submit" className="p-1.5 md:p-2 bg-purple-600 text-white rounded-lg md:rounded-xl hover:bg-purple-500 transition-colors">
              <Send size={16} />
            </button>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="pt-1 md:pt-2 border-t border-white/10">
          <button 
            onClick={() => useGameStore.getState().leaveRoom()}
            className="w-full py-2 md:py-3 rounded-xl md:rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-500 font-black uppercase text-[10px] md:text-xs tracking-widest transition-all border border-red-500/20 flex items-center justify-center gap-2"
          >
            Leave Room 🚪
          </button>
        </div>
      </div>
    </div>
  );
}

function AudioStream({ stream, muted }: { stream: MediaStream, muted: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.srcObject = stream;
    }
  }, [stream]);

  return <audio ref={audioRef} autoPlay muted={muted} className="hidden" />;
}

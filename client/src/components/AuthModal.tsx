'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';

export function AuthModal() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message);
    } else {
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: { username }
        }
      });
      if (error) alert('Check your email for confirmation!');
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="card max-w-md w-full"
    >
      <h2 className="text-4xl font-black mb-6 candy-text text-center">
        {isLogin ? 'Welcome Back!' : 'Join the Party!'}
      </h2>
      
      <form onSubmit={handleAuth} className="flex flex-col gap-4">
        {!isLogin && (
          <input
            type="text"
            placeholder="Choose a cool nickname..."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="bg-white/20 border-4 border-white/30 rounded-2xl py-3 px-6 text-white placeholder:text-white/50 font-bold outline-none focus:border-yellow-400 transition-all"
            required={!isLogin}
          />
        )}
        <input
          type="email"
          placeholder="Email address..."
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-white/20 border-4 border-white/30 rounded-2xl py-3 px-6 text-white placeholder:text-white/50 font-bold outline-none focus:border-yellow-400 transition-all"
          required
        />
        <input
          type="password"
          placeholder="Password..."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="bg-white/20 border-4 border-white/30 rounded-2xl py-3 px-6 text-white placeholder:text-white/50 font-bold outline-none focus:border-yellow-400 transition-all"
          required
        />
        
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="submit"
          className="btn-primary text-xl mt-4"
          disabled={loading}
        >
          {loading ? 'Processing...' : isLogin ? 'LOG ME IN! 🚀' : 'SIGN ME UP! ✨'}
        </motion.button>
      </form>
      
      <div className="flex items-center gap-4 my-6">
        <div className="flex-1 h-1 bg-white/20 rounded-full" />
        <span className="text-white/50 font-black">OR</span>
        <div className="flex-1 h-1 bg-white/20 rounded-full" />
      </div>
      
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleGoogleLogin}
        className="btn-secondary w-full text-xl flex items-center justify-center gap-3"
      >
        <span>Google Login 🌈</span>
      </motion.button>
      
      <button 
        onClick={() => setIsLogin(!isLogin)}
        className="text-white/70 font-bold mt-8 hover:text-white transition-colors w-full text-center underline"
      >
        {isLogin ? "Don't have an account? Create one!" : "Already part of the squad? Log in!"}
      </button>
    </motion.div>
  );
}

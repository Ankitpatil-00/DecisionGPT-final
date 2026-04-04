import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, Lock, User, ArrowRight } from 'lucide-react';

interface LoginProps {
  onLogin: (token: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Import api call
      const { login } = await import('../api');
      const data = await login(username, password);
      if (data.access_token) {
        onLogin(data.access_token);
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] dark:bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] bg-slate-50 dark:bg-zinc-900 relative">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/30 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative z-10 p-8 glass-card rounded-3xl border border-white/20 dark:border-white/10 shadow-2xl backdrop-blur-xl bg-white/70 dark:bg-black/40"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
            <BrainCircuit className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
            DecisionGPT
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium">
            AI-Powered Data Analytics Platform
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1 block">Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                <User size={18} />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                className="w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-gray-900 dark:text-white placeholder-gray-400 shadow-inner"
                placeholder="Enter admin"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1 block">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                <Lock size={18} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-gray-900 dark:text-white placeholder-gray-400 shadow-inner"
                placeholder="Enter admin"
                required
              />
            </div>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-sm md:text-sm font-medium bg-red-50 dark:bg-red-500/10 p-3 rounded-lg border border-red-200 dark:border-red-500/20 text-center">
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="group w-full relative flex justify-center py-3.5 px-4 border border-transparent font-bold rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 overflow-hidden shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98]"
          >
            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
              {isLoading ? (
                <Lock className="w-5 h-5 animate-pulse text-white/50" />
              ) : (
                <Lock className="w-5 h-5 text-blue-300 group-hover:text-blue-200 transition-colors" />
              )}
            </span>
            {isLoading ? 'Authenticating...' : 'Sign In Securely'}
            <ArrowRight className="w-5 h-5 absolute right-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </button>
        </form>

        <div className="mt-8 text-center">
           <p className="text-xs text-gray-400 border-t border-gray-200 dark:border-gray-800 pt-6">
             Hint: use <code className="font-mono bg-gray-100 dark:bg-zinc-800 px-1 py-0.5 rounded">admin</code> / <code className="font-mono bg-gray-100 dark:bg-zinc-800 px-1 py-0.5 rounded">admin</code>
           </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;

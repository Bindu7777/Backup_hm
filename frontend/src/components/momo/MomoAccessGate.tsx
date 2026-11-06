import React, { useState, useEffect } from 'react';
import { Shield, Eye, EyeOff, Lock, AlertCircle, Sparkles, KeyRound, Heart } from 'lucide-react';
import { momoApiService } from '../../services/momoApiService';

interface MomoAccessGateProps {
  onUnlocked: () => void;
  adminUser?: string;
}

export const MomoAccessGate: React.FC<MomoAccessGateProps> = ({ onUnlocked, adminUser = 'Bindu' }) => {
  const [secret, setSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (lockoutSeconds > 0) {
      timer = setInterval(() => {
        setLockoutSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secret.trim() || isLoading || lockoutSeconds > 0) return;

    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await momoApiService.verifySecret(secret.trim(), adminUser);
      if (response.success) {
        onUnlocked();
      } else {
        if (response.locked && response.remainingSeconds) {
          setLockoutSeconds(response.remainingSeconds);
        }
        setErrorMessage(response.error || 'Invalid secret password. Access denied.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification service error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border-2 border-blue-100 overflow-hidden relative">
        
        {/* Glow ambient background banner */}
        <div className="pt-8 pb-14 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 relative flex flex-col items-center justify-center text-white overflow-hidden">
          {/* Subtle floating background stars/dots */}
          <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#fff_1.5px,transparent_1.5px)] [background-size:18px_18px]" />
          <div className="absolute -top-10 -right-10 w-36 h-36 bg-sky-300/40 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-blue-400/40 rounded-full blur-2xl" />

          {/* Cute Momo Mascot Floating with levitation glow */}
          <div className="relative group">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-sky-300 to-blue-400 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-300 animate-pulse" />
            <div className="w-28 h-28 bg-white rounded-full p-1.5 shadow-2xl relative border-4 border-white transition-transform hover:scale-105 duration-300 flex items-center justify-center overflow-hidden">
              <img
                src="/momo-mascot.png"
                alt="Momo Bot Cute Mascot"
                className="w-full h-full object-contain transform scale-110"
              />
            </div>
            {/* Cute floating mini badge */}
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white border-2 border-white shadow-md animate-bounce">
              <Sparkles className="w-4 h-4 fill-current" />
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="pt-5 pb-8 px-8 text-center">
          {/* Cute Badge */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2 border border-blue-200/60 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>AI Business Assistant</span>
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          </div>

          <h2 className="text-2xl font-black bg-gradient-to-r from-blue-700 via-indigo-600 to-sky-600 bg-clip-text text-transparent">
            Momo Bot
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Your friendly AI event advisor & engagement buddy ✨
          </p>

          {/* Cute Speech Bubble from Momo */}
          <div className="mt-4 p-3 bg-gradient-to-r from-blue-50/90 to-sky-50/70 rounded-2xl border border-blue-200/70 text-xs text-slate-700 text-left relative flex items-start gap-2.5 shadow-sm">
            <div className="text-blue-500 text-lg leading-none shrink-0 mt-0.5">💬</div>
            <div>
              <span className="font-bold text-blue-700">Hi {adminUser}!</span> Enter your secret key to unlock Instagram analytics, smart reply drafts, and business insights!
            </div>
          </div>

          <form onSubmit={handleVerify} className="mt-6 space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center justify-between">
                <span>Secret Key</span>
                <span className="text-[11px] text-blue-600 font-semibold normal-case">Hint: Raviteja</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-500">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showSecret ? 'text' : 'password'}
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  disabled={isLoading || lockoutSeconds > 0}
                  placeholder="Enter secret password..."
                  className="w-full pl-10 pr-11 py-3 text-sm bg-blue-50/30 border border-blue-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-inner"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  tabIndex={-1}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-blue-600 cursor-pointer"
                >
                  {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700 animate-shake">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Lockout Warning */}
            {lockoutSeconds > 0 && (
              <div className="p-3 bg-rose-100 border border-rose-300 rounded-xl text-xs text-rose-800 font-medium text-center">
                Access temporarily locked due to repeated failures. Try again in {lockoutSeconds}s.
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !secret.trim() || lockoutSeconds > 0}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-500/25 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Unlocking Momo Magic...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Unlock Momo Bot</span>
                </>
              )}
            </button>
          </form>

          {/* Privacy & Compliance footnote */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <Shield className="w-3.5 h-3.5 text-blue-500" />
            <span>Server-side PBKDF2 verification • Inactivity timeout enabled</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MomoAccessGate;

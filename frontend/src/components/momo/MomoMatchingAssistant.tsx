import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, MessageCircle, X, ChevronRight, Mic, Search } from 'lucide-react';
import MomoMascot from './MomoMascot';
import { momoSound } from '@/utils/momoSoundEffects';

interface MomoMatchingAssistantProps {
  /** Optional custom position class or override */
  className?: string;
  /** Triggered when the user clicks to find vendors */
  onFindVendorsClick?: () => void;
  /** Force inline layout vs floating dock */
  variant?: 'floating' | 'inline' | 'banner';
}

export const MomoMatchingAssistant: React.FC<MomoMatchingAssistantProps> = ({
  className = '',
  onFindVendorsClick,
  variant = 'floating'
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isMinimized, setIsMinimized] = useState<boolean>(() => {
    // Start collapsed on small mobile screens to keep view 100% clear of buttons
    if (typeof window !== 'undefined') {
      return window.innerWidth < 640;
    }
    return false;
  });

  const [hasInteracted, setHasInteracted] = useState<boolean>(false);

  // Auto-hide on routes that don't need a public assistant (e.g. login/admin)
  const isExcludedRoute =
    location.pathname.startsWith('/admin') ||
    location.pathname === '/login' ||
    location.pathname === '/customer-login' ||
    location.pathname === '/vendor-login' ||
    location.pathname === '/signup';

  if (isExcludedRoute) {
    return null;
  }

  const handleAction = () => {
    setHasInteracted(true);
    momoSound.playCelebrationChime();
    if (onFindVendorsClick) {
      onFindVendorsClick();
      return;
    }

    // If on homepage, smoothly scroll to the smart request/matching hero section
    if (location.pathname === '/') {
      const el = document.getElementById('smart-matching-section') || document.getElementById('categories');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }

    navigate('/smart-request');
  };

  // Inline Banner Variant (e.g., at the top of vendor matching sections)
  if (variant === 'banner' || variant === 'inline') {
    return (
      <aside
        className={`w-full bg-gradient-to-r from-orange-50/90 via-amber-50/80 to-peach-50/90 border border-orange-200/80 rounded-2xl md:rounded-3xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-center gap-4 ${className}`}
        aria-label="Event Assistant Momo"
      >
        <div className="flex-shrink-0 flex items-center justify-center">
          <MomoMascot size={80} isWaving={true} />
        </div>

        <div className="flex-1 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white text-orange-800 text-[11px] font-bold shadow-sm mb-1 border border-orange-200">
            <Sparkles className="w-3 h-3 text-orange-500" />
            AI Matchmaker
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
            “Hi! I’m Momo 😊 I’ll help you find the right vendors for your event.”
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Tell me what you envision—photographer, venue, decor, or catering—and get matched instantly.
          </p>
        </div>

        <div className="flex-shrink-0 flex items-center gap-2">
          <button
            onClick={handleAction}
            className="inline-flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
            aria-label="Ask Momo for vendor matches"
          >
            <Sparkles className="w-4 h-4" />
            <span>Match My Vendors</span>
          </button>
        </div>
      </aside>
    );
  }

  // Floating Variant:
  // Placed SAFELY on the bottom-left (`bottom-6 left-6`).
  // This guarantees Momo NEVER overlaps the "Get Matches" button (which sits in the center-right column)
  // or the WhatsApp button (which sits on the bottom-right).
  return (
    <aside
      className={`fixed bottom-4 sm:bottom-6 left-4 sm:left-6 z-40 select-none ${className}`}
      aria-label="Happy Moments Assistant Momo"
    >
      {/* Expanded State: Momo + Speech Bubble */}
      {!isMinimized ? (
        <div className="flex items-end gap-2.5 sm:gap-3.5 max-w-[340px] sm:max-w-[400px]">
          {/* Momo Mascot Graphic */}
          <div
            onClick={() => setIsMinimized(true)}
            className="flex-shrink-0 cursor-pointer transform hover:scale-105 transition-transform duration-200 group"
            title="Click to minimize Momo"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setIsMinimized(true);
            }}
            aria-label="Minimize Momo assistant"
          >
            <div className="relative">
              <MomoMascot size={78} isWaving={true} />
              {/* Little close hint badge on hover */}
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-slate-900/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] shadow-sm">
                ✕
              </span>
            </div>
          </div>

          {/* Speech Bubble Card */}
          <div className="relative bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl border-2 border-orange-200 shadow-xl p-3.5 sm:p-4 text-left animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Speech bubble tail pointing to Momo on the left */}
            <div
              className="absolute -left-2 bottom-5 w-3 h-3 bg-white border-l-2 border-b-2 border-orange-200 transform rotate-45"
              aria-hidden="true"
            />

            {/* Header row with badge and dismiss */}
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-orange-700 bg-orange-100/80 px-2 py-0.5 rounded-full">
                <Sparkles className="w-2.5 h-2.5 text-orange-600" />
                Event Companion
              </span>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  momoSound.playBubblePop();
                  setIsMinimized(true);
                }}
                className="w-5 h-5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center text-xs transition-colors"
                aria-label="Dismiss speech bubble"
                title="Minimize assistant"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            {/* User Requested Exact Speech Bubble Copy */}
            <p className="text-xs sm:text-sm font-semibold text-slate-900 leading-snug">
              “Hi! I’m Momo 😊 I’ll help you find the right vendors for your event.”
            </p>

            {/* Quick Action Button */}
            <div className="mt-2.5 pt-2 border-t border-orange-100 flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                Tap to discover matches
              </span>

              <button
                onClick={handleAction}
                className="inline-flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm hover:shadow transition-all hover:scale-105 active:scale-95 ml-auto cursor-pointer"
              >
                <span>Find Vendors</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Minimized State: Sleek compact floating avatar button on bottom-left */
        <button
          onClick={() => {
            momoSound.playBubblePop();
            momoSound.playHamsterSqueak();
            setIsMinimized(false);
          }}
          className="group relative flex items-center gap-2 bg-white/95 backdrop-blur-md border-2 border-orange-300 shadow-xl rounded-full p-1.5 pr-3.5 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer animate-in fade-in zoom-in-95"
          aria-label="Open Momo event assistant"
          title="Chat with Momo event companion"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-gradient-to-b from-orange-50 to-amber-100 flex items-center justify-center shadow-inner">
            <MomoMascot size={38} isWaving={false} />
          </div>

          <div className="text-left">
            <div className="flex items-center gap-1 text-[10px] font-bold text-orange-600 uppercase tracking-wider">
              <span>Momo</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-xs font-extrabold text-slate-800">Need help?</p>
          </div>
        </button>
      )}
    </aside>
  );
};

export default MomoMatchingAssistant;


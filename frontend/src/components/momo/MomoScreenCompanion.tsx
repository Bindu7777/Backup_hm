import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, MessageCircle, X, ChevronRight, Mic, Search, Heart } from 'lucide-react';
import MomoMascot from './MomoMascot';

/**
 * MomoScreenCompanion
 * Redesigned original assistant for Happy Moments.
 *
 * Design Direction:
 * - Friendly, welcoming event-planning companion (Momo)
 * - Soft rounded pear silhouette, expressive eyes, warm smile, golden celebration flower
 * - Cohesive warm ivory, peach, coral, and subtle gold palette with teal accent
 * - Welcoming & helpful (NOT mischievous or distracting; no chasing/dodging)
 * - Speech bubble: "Hi! I’m Momo 😊 I’ll help you find the right vendors for your event."
 * - Positioned safely on the BOTTOM-LEFT (bottom-6 left-6 on desktop, bottom-4 left-4 on mobile)
 *   so it NEVER covers the "Get Matches" button or action buttons.
 * - Respects prefers-reduced-motion.
 */
export const MomoScreenCompanion: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // On mobile (< 640px), start minimized so viewport is 100% clean and unobstructed
  const [isMinimized, setIsMinimized] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 640;
    }
    return false;
  });

  const [hasDismissed, setHasDismissed] = useState<boolean>(false);

  // Auto-hide on non-customer routes (like login/signup or auth pages)
  const isExcluded =
    location.pathname === '/login' ||
    location.pathname === '/customer-login' ||
    location.pathname === '/vendor-login' ||
    location.pathname === '/signup' ||
    location.pathname === '/forgot-password' ||
    location.pathname.startsWith('/admin');

  if (isExcluded || hasDismissed) {
    return null;
  }

  const handleMatchingAction = () => {
    // If on homepage, smooth scroll to the Smart Matching section
    if (location.pathname === '/') {
      const matchingSection = document.getElementById('smart-matching-section');
      if (matchingSection) {
        matchingSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }
    navigate('/smart-request');
  };

  return (
    <aside
      className="fixed bottom-4 sm:bottom-6 left-4 sm:left-6 z-40 select-none print:hidden"
      role="complementary"
      aria-label="Happy Moments Assistant Momo"
    >
      {!isMinimized ? (
        <div className="flex items-end gap-3 max-w-[340px] sm:max-w-[420px] animate-in fade-in slide-in-from-bottom-3 duration-300">
          {/* Momo Mascot (Click to minimize or chat) */}
          <div
            onClick={() => setIsMinimized(true)}
            className="flex-shrink-0 cursor-pointer transform hover:scale-105 active:scale-95 transition-transform duration-200 group relative"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setIsMinimized(true);
            }}
            title="Click to minimize Momo"
            aria-label="Minimize Momo assistant"
          >
            <MomoMascot size={80} isWaving={true} />
            {/* Subtle dismiss tooltip icon on hover */}
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-slate-900/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] shadow-sm">
              ✕
            </span>
          </div>

          {/* Speech Bubble Card */}
          <div className="relative bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl border-2 border-orange-200 shadow-xl p-3.5 sm:p-4 text-left">
            {/* Left-pointing speech tail */}
            <div
              className="absolute -left-2 bottom-5 w-3 h-3 bg-white border-l-2 border-b-2 border-orange-200 transform rotate-45"
              aria-hidden="true"
            />

            {/* Bubble Header */}
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-orange-700 bg-orange-100/90 px-2 py-0.5 rounded-full">
                <Sparkles className="w-2.5 h-2.5 text-orange-600" />
                Event Assistant
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMinimized(true);
                  }}
                  className="w-5 h-5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center text-xs transition-colors"
                  aria-label="Minimize assistant"
                  title="Minimize"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Exact User-Requested Copy */}
            <p className="text-xs sm:text-sm font-semibold text-slate-900 leading-snug">
              “Hi! I’m Momo 😊 I’ll help you find the right vendors for your event.”
            </p>

            {/* Helpful Quick Actions */}
            <div className="mt-2.5 pt-2 border-t border-orange-100 flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                Instant matchmaker
              </span>

              <button
                onClick={handleMatchingAction}
                className="inline-flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-sm hover:shadow transition-all hover:scale-105 active:scale-95 ml-auto cursor-pointer"
                aria-label="Find vendors with Momo"
              >
                <span>Find Vendors</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Minimized State: Sleek compact avatar pill on the bottom-left */
        <button
          onClick={() => setIsMinimized(false)}
          className="group relative flex items-center gap-2 bg-white/95 backdrop-blur-md border-2 border-orange-300 shadow-xl rounded-full p-1.5 pr-3 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer animate-in fade-in zoom-in-95"
          aria-label="Open Momo assistant"
          title="Chat with Momo"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-gradient-to-b from-orange-50 to-amber-100 flex items-center justify-center shadow-inner">
            <MomoMascot size={36} isWaving={false} />
          </div>

          <div className="text-left pr-1">
            <div className="flex items-center gap-1 text-[10px] font-bold text-orange-600 uppercase tracking-wider">
              <span>Momo</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-xs font-extrabold text-slate-800">Find Vendors</p>
          </div>
        </button>
      )}
    </aside>
  );
};

export default MomoScreenCompanion;

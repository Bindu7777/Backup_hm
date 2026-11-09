import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, X, ChevronRight, Volume2, VolumeX } from 'lucide-react';
import MomoMascot from './MomoMascot';
import { momoSound } from '@/utils/momoSoundEffects';

/**
 * MomoScreenCompanion
 * Redesigned original assistant for Happy Moments.
 *
 * Design Direction:
 * - Friendly, welcoming event-planning companion (Momo the cute Hamster)
 * - Makes adorable cute sounds (peeps, giggles, nom-noms, chimes)
 * - Soft rounded pear silhouette, expressive eyes, warm smile, golden celebration flower
 * - Welcoming & helpful (NOT mischievous or distracting; no chasing/dodging)
 * - Speech bubble: "Hi! I’m Momo 😊 I’ll help you find the right vendors for your event."
 * - Positioned safely on the BOTTOM-LEFT (bottom-6 left-6 on desktop, bottom-4 left-4 on mobile)
 * - User-controllable sound toggle (with localStorage persistence)
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

  const [hasDismissed] = useState<boolean>(false);
  const [isSoundOn, setIsSoundOn] = useState<boolean>(() => momoSound.isEnabled());

  useEffect(() => {
    return momoSound.subscribe((enabled) => {
      setIsSoundOn(enabled);
    });
  }, []);

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
    momoSound.playCelebrationChime();
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

  const handleMinimize = (e: React.MouseEvent) => {
    e.stopPropagation();
    momoSound.playBubblePop();
    setIsMinimized(true);
  };

  const handleExpand = () => {
    momoSound.playBubblePop(true);
    momoSound.playHamsterSqueak(true);
    setIsMinimized(false);
  };

  const handleToggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    momoSound.toggleSound();
  };

  return (
    <aside
      className="fixed bottom-4 sm:bottom-6 left-4 sm:left-6 z-40 select-none print:hidden"
      role="complementary"
      aria-label="Happy Moments Assistant Momo"
    >
      {!isMinimized ? (
        <div className="flex items-end gap-3 max-w-[340px] sm:max-w-[420px] animate-in fade-in slide-in-from-bottom-3 duration-300">
          {/* Momo Mascot (Click to hear cute hamster sound & see sparkles) */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              momoSound.playRandomCuteSound(true);
            }}
            className="flex-shrink-0 relative group cursor-pointer"
            title="Click Momo to hear cute sounds!"
          >
            <MomoMascot size={80} isWaving={true} playSoundOnClick={true} interactive={true} />
          </div>

          {/* Speech Bubble Card */}
          <div
            onClick={() => momoSound.playCutePurr()}
            className="relative bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl border-2 border-orange-200 shadow-xl p-3.5 sm:p-4 text-left cursor-default transition-all duration-200"
          >
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
                {/* Cute Sound Toggle */}
                <button
                  onClick={handleToggleSound}
                  className="w-5 h-5 rounded-full text-slate-400 hover:text-orange-600 hover:bg-orange-50 flex items-center justify-center text-xs transition-colors cursor-pointer"
                  aria-label={isSoundOn ? 'Mute Momo cute sounds' : 'Enable Momo cute sounds'}
                  title={isSoundOn ? 'Sound is ON (Click to mute)' : 'Sound is MUTED (Click to hear cute sounds)'}
                >
                  {isSoundOn ? (
                    <Volume2 className="w-3.5 h-3.5 text-orange-500" />
                  ) : (
                    <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>

                {/* Minimize Button */}
                <button
                  onClick={handleMinimize}
                  className="w-5 h-5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center text-xs transition-colors cursor-pointer"
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
          onClick={handleExpand}
          className="group relative flex items-center gap-2 bg-white/95 backdrop-blur-md border-2 border-orange-300 shadow-xl rounded-full p-1.5 pr-3 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer animate-in fade-in zoom-in-95"
          aria-label="Open Momo assistant"
          title="Click to talk with Momo"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-gradient-to-b from-orange-50 to-amber-100 flex items-center justify-center shadow-inner">
            <MomoMascot size={36} isWaving={false} playSoundOnClick={false} />
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

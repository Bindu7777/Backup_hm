import React, { useState } from 'react';
import { momoSound } from '@/utils/momoSoundEffects';

export interface MomoMascotProps {
  size?: number | string;
  className?: string;
  isWaving?: boolean;
  isHappy?: boolean;
  showSparkle?: boolean;
  title?: string;
  interactive?: boolean;
  playSoundOnClick?: boolean;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseEnter?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

/**
 * Momo Customer Mascot - An ultra cute, friendly Hamster companion for Happy Moments.
 * Design attributes:
 * - Round, plump, adorable hamster silhouette with soft chubby cheeks and peach-rose blush
 * - Cute rounded hamster ears with warm pink inner shading
 * - Sparkly twinkling eyes with warm happy expression
 * - Tiny heart nose and gentle curved smile
 * - Tiny front paws holding a celebratory golden blossom with a teal jewel drop
 * - Soft warm ivory and golden-apricot coat matching the Happy Moments brand palette
 * - Pure scalable vector SVG for infinite crispness
 * - Respects prefers-reduced-motion
 * - Cute sound effects on tap / click (Web Audio API synthesizers)
 */
export const MomoMascot: React.FC<MomoMascotProps> = ({
  size = 140,
  className = '',
  isWaving = true,
  isHappy = true,
  showSparkle = true,
  title = 'Momo the Hamster, your Happy Moments event companion',
  interactive = true,
  playSoundOnClick = true,
  onClick,
  onMouseEnter
}) => {
  const [popParticles, setPopParticles] = useState<{ id: number; emoji: string }[]>([]);

  const handleMascotClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (playSoundOnClick) {
      momoSound.playRandomCuteSound(true);
      const cuteEmojis = ['🎵', '✨', '💖', '🐹', '⭐'];
      const picked = cuteEmojis[Math.floor(Math.random() * cuteEmojis.length)];
      const newId = Date.now();
      setPopParticles((prev) => [...prev.slice(-2), { id: newId, emoji: picked }]);
      setTimeout(() => {
        setPopParticles((prev) => prev.filter((p) => p.id !== newId));
      }, 850);
    }
    if (onClick) {
      onClick(e);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (interactive && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      momoSound.playRandomCuteSound(true);
    }
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (interactive) {
      momoSound.playCutePurr();
    }
    if (onMouseEnter) {
      onMouseEnter(e);
    }
  };

  return (
    <div
      onClick={handleMascotClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={handleMouseEnter}
      role={interactive ? 'button' : 'img'}
      tabIndex={interactive ? 0 : undefined}
      aria-label={title}
      className={`relative inline-flex items-center justify-center select-none ${
        interactive ? 'cursor-pointer transform hover:scale-105 active:scale-95 transition-transform duration-200' : ''
      } ${className}`}
      style={{
        width: typeof size === 'number' ? `${size}px` : size,
        height: typeof size === 'number' ? `${(size * 1.08).toFixed(0)}px` : 'auto'
      }}
    >
      {/* Floating cute reactions when tapped */}
      {popParticles.map((p) => (
        <span
          key={p.id}
          className="absolute -top-3 pointer-events-none text-base sm:text-xl z-30 animate-bounce select-none"
          style={{ animationDuration: '0.85s' }}
        >
          {p.emoji}
        </span>
      ))}
      <svg
        viewBox="0 0 200 216"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full overflow-visible transition-transform duration-300 pointer-events-none"
      >
        <defs>
          {/* Hamster Coat: Warm Golden Apricot to Soft Peach */}
          <linearGradient id="hamsterFur" x1="40" y1="20" x2="160" y2="200" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFF3E0" />
            <stop offset="25%" stopColor="#FFE0B2" />
            <stop offset="65%" stopColor="#FFCC80" />
            <stop offset="100%" stopColor="#FFA726" />
          </linearGradient>

          {/* Chubby Cheeks & Tummy Cream */}
          <linearGradient id="hamsterCream" x1="100" y1="70" x2="100" y2="195" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#FFF8F0" />
          </linearGradient>

          {/* Ear Outer Fur */}
          <linearGradient id="hamsterEarOuter" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFA726" />
            <stop offset="100%" stopColor="#FB8C00" />
          </linearGradient>

          {/* Ear Inner Pink */}
          <linearGradient id="hamsterEarInner" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFB4C4" />
            <stop offset="100%" stopColor="#FF8BA7" />
          </linearGradient>

          {/* Rosy Cheek Blush */}
          <radialGradient id="hamsterBlush" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FF5252" stopOpacity="0.55" />
            <stop offset="60%" stopColor="#FF8A80" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#FF8A80" stopOpacity="0" />
          </radialGradient>

          {/* Celebration Flower Gold */}
          <linearGradient id="hamsterFlower" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFF176" />
            <stop offset="50%" stopColor="#FBC02D" />
            <stop offset="100%" stopColor="#F57C00" />
          </linearGradient>

          {/* Teal Accent Gem */}
          <linearGradient id="hamsterTealGem" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#5EEAD4" />
            <stop offset="50%" stopColor="#14B8A6" />
            <stop offset="100%" stopColor="#0F766E" />
          </linearGradient>

          {/* Eye Gradient */}
          <linearGradient id="hamsterEyeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2E1C14" />
            <stop offset="100%" stopColor="#1A0D08" />
          </linearGradient>

          {/* Soft Ground Shadow */}
          <radialGradient id="hamsterShadow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1E293B" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#1E293B" stopOpacity="0" />
          </radialGradient>

          <filter id="momoSoftGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <style>{`
          @media (prefers-reduced-motion: no-preference) {
            .momo-bounce {
              animation: hamsterBreathe 3.4s ease-in-out infinite;
              transform-origin: 100px 190px;
            }
            .momo-wave-paw {
              animation: hamsterWave 2.2s ease-in-out infinite;
              transform-origin: 140px 135px;
            }
            .momo-ear-left {
              animation: hamsterEarWiggle 4.6s ease-in-out infinite;
              transform-origin: 52px 42px;
            }
            .momo-ear-right {
              animation: hamsterEarWiggleR 4.6s ease-in-out infinite 0.3s;
              transform-origin: 148px 42px;
            }
            .momo-sparkle {
              animation: hamsterSparkle 2s ease-in-out infinite alternate;
              transform-origin: center;
            }
            .momo-flower {
              animation: hamsterFlowerFloat 3s ease-in-out infinite alternate;
              transform-origin: 152px 34px;
            }
          }
          @keyframes hamsterBreathe {
            0%, 100% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-3px) scale(1.015, 0.985); }
          }
          @keyframes hamsterWave {
            0%, 100% { transform: rotate(0deg); }
            20% { transform: rotate(-14deg); }
            40% { transform: rotate(6deg); }
            60% { transform: rotate(-10deg); }
            80% { transform: rotate(2deg); }
          }
          @keyframes hamsterEarWiggle {
            0%, 90%, 100% { transform: rotate(0deg); }
            93% { transform: rotate(-6deg); }
            96% { transform: rotate(4deg); }
          }
          @keyframes hamsterEarWiggleR {
            0%, 90%, 100% { transform: rotate(0deg); }
            93% { transform: rotate(6deg); }
            96% { transform: rotate(-4deg); }
          }
          @keyframes hamsterSparkle {
            0% { transform: scale(0.8) rotate(0deg); opacity: 0.65; }
            100% { transform: scale(1.15) rotate(18deg); opacity: 1; }
          }
          @keyframes hamsterFlowerFloat {
            0% { transform: translateY(0) rotate(0deg); }
            100% { transform: translateY(-2px) rotate(4deg); }
          }
        `}</style>

        {/* Ambient Ground Contact Shadow */}
        <ellipse cx="100" cy="204" rx="66" ry="11" fill="url(#hamsterShadow)" />

        {/* Main Body Group with Idle Animation */}
        <g className="momo-bounce">
          {/* Round Stubby Hamster Feet */}
          <ellipse cx="72" cy="196" rx="16" ry="10" fill="#FFB74D" />
          <ellipse cx="72" cy="195" rx="13" ry="8" fill="#FFE0B2" />
          <ellipse cx="128" cy="196" rx="16" ry="10" fill="#FFB74D" />
          <ellipse cx="128" cy="195" rx="13" ry="8" fill="#FFE0B2" />

          {/* Tiny Hamster Toes */}
          <circle cx="64" cy="198" r="2.5" fill="#FFA726" />
          <circle cx="71" cy="200" r="2.5" fill="#FFA726" />
          <circle cx="78" cy="198" r="2.5" fill="#FFA726" />
          <circle cx="121" cy="198" r="2.5" fill="#FFA726" />
          <circle cx="128" cy="200" r="2.5" fill="#FFA726" />
          <circle cx="135" cy="198" r="2.5" fill="#FFA726" />

          {/* Cute Round Hamster Ears */}
          {/* Left Ear */}
          <g className="momo-ear-left">
            <circle cx="52" cy="46" r="22" fill="url(#hamsterEarOuter)" stroke="#F57C00" strokeWidth="2.5" />
            <circle cx="53" cy="47" r="14" fill="url(#hamsterEarInner)" />
            <path d="M47 43 Q54 48 58 55" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
          </g>

          {/* Right Ear */}
          <g className="momo-ear-right">
            <circle cx="148" cy="46" r="22" fill="url(#hamsterEarOuter)" stroke="#F57C00" strokeWidth="2.5" />
            <circle cx="147" cy="47" r="14" fill="url(#hamsterEarInner)" />
            <path d="M141 43 Q148 48 152 55" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
          </g>

          {/* Main Chubby Hamster Silhouette */}
          {/* Body base (plump pear shape with chubby cheek expansions) */}
          <path
            d="M 100 38
               C 134 38, 160 58, 164 88
               C 167 106, 174 126, 170 148
               C 164 178, 138 200, 100 200
               C 62 200, 36 178, 30 148
               C 26 126, 33 106, 36 88
               C 40 58, 66 38, 100 38 Z"
            fill="url(#hamsterFur)"
            stroke="#F57C00"
            strokeWidth="3"
          />

          {/* Golden Hamster Head Stripe (Classic Hamster Marking) */}
          <path
            d="M 96 40 C 97 58, 97 72, 100 78 C 103 72, 103 58, 104 40 Z"
            fill="#FB8C00"
            opacity="0.55"
          />

          {/* Fluffy White/Cream Chest & Belly Patch */}
          <path
            d="M 100 86
               C 126 86, 150 102, 152 136
               C 154 165, 134 194, 100 194
               C 66 194, 46 165, 48 136
               C 50 102, 74 86, 100 86 Z"
            fill="url(#hamsterCream)"
          />

          {/* Soft Chubby Cheek Patches */}
          {/* Left Cheek */}
          <ellipse cx="48" cy="122" rx="22" ry="18" fill="#FFF8F0" />
          <circle cx="48" cy="124" r="14" fill="url(#hamsterBlush)" />
          {/* Right Cheek */}
          <ellipse cx="152" cy="122" rx="22" ry="18" fill="#FFF8F0" />
          <circle cx="152" cy="124" r="14" fill="url(#hamsterBlush)" />

          {/* Cute Whiskers */}
          {/* Left Whiskers */}
          <path d="M 38 120 Q 22 118 12 114" stroke="#D97706" strokeWidth="1.8" strokeLinecap="round" opacity="0.75" />
          <path d="M 38 126 Q 20 128 10 131" stroke="#D97706" strokeWidth="1.8" strokeLinecap="round" opacity="0.75" />
          {/* Right Whiskers */}
          <path d="M 162 120 Q 178 118 188 114" stroke="#D97706" strokeWidth="1.8" strokeLinecap="round" opacity="0.75" />
          <path d="M 162 126 Q 180 128 190 131" stroke="#D97706" strokeWidth="1.8" strokeLinecap="round" opacity="0.75" />

          {/* Expressive Sparkly Chibi Eyes */}
          {/* Left Eye */}
          <g>
            <ellipse cx="73" cy="98" rx="10" ry="12" fill="url(#hamsterEyeGrad)" />
            {/* Primary Twinkle Reflection */}
            <circle cx="70" cy="93" r="4.2" fill="#FFFFFF" />
            {/* Secondary Micro Sparkle */}
            <circle cx="76" cy="103" r="2.2" fill="#FFFFFF" opacity="0.9" />
            <circle cx="68" cy="102" r="1.3" fill="#FFFFFF" opacity="0.6" />
            {/* Eyebrow */}
            <path d="M 64 82 Q 74 77 82 81" stroke="#B45309" strokeWidth="2.6" strokeLinecap="round" />
          </g>

          {/* Right Eye */}
          <g>
            <ellipse cx="127" cy="98" rx="10" ry="12" fill="url(#hamsterEyeGrad)" />
            {/* Primary Twinkle Reflection */}
            <circle cx="124" cy="93" r="4.2" fill="#FFFFFF" />
            {/* Secondary Micro Sparkle */}
            <circle cx="130" cy="103" r="2.2" fill="#FFFFFF" opacity="0.9" />
            <circle cx="122" cy="102" r="1.3" fill="#FFFFFF" opacity="0.6" />
            {/* Eyebrow */}
            <path d="M 118 81 Q 126 77 136 82" stroke="#B45309" strokeWidth="2.6" strokeLinecap="round" />
          </g>

          {/* Cute Tiny Hamster Heart Nose */}
          <path
            d="M 100 110 C 97 106, 92 108, 94 112 C 96 116, 100 119, 100 119 C 100 119, 104 116, 106 112 C 108 108, 103 106, 100 110 Z"
            fill="#FF6B8B"
          />

          {/* Cheerful Curved Hamster Smile (Cute 'w' Mouth) */}
          <path
            d="M 90 120 Q 95 125 100 120 Q 105 125 110 120"
            stroke="#5D2E17"
            strokeWidth="2.6"
            strokeLinecap="round"
            fill="none"
          />

          {/* Tiny Open Joy Tongue */}
          {isHappy && (
            <path
              d="M 96 123 Q 100 130 104 123 Z"
              fill="#FF8A80"
              stroke="#5D2E17"
              strokeWidth="1.2"
            />
          )}

          {/* Festive Coral Ribbon & Teal Gem Drop */}
          <path
            d="M 72 144 C 88 152, 112 152, 128 144 C 122 148, 78 148, 72 144 Z"
            fill="#F43F5E"
          />
          {/* Teal Jewel Pendant */}
          <g filter="url(#momoSoftGlow)">
            <circle cx="100" cy="151" r="5.5" fill="url(#hamsterTealGem)" stroke="#FFFFFF" strokeWidth="1.5" />
            <circle cx="98.5" cy="149" r="1.5" fill="#FFFFFF" />
          </g>

          {/* Tiny Chubby Front Paws */}
          {/* Left Paw holding celebration heart or seed */}
          <g>
            <ellipse cx="78" cy="148" rx="8" ry="9" fill="#FFF3E0" stroke="#F57C00" strokeWidth="2" />
            <circle cx="75" cy="146" r="1.4" fill="#FFA726" />
            <circle cx="78" cy="145" r="1.4" fill="#FFA726" />
            <circle cx="81" cy="146" r="1.4" fill="#FFA726" />
          </g>

          {/* Right Waving Paw */}
          <g className={isWaving ? 'momo-wave-paw' : ''}>
            <ellipse cx="128" cy="145" rx="8" ry="9" fill="#FFF3E0" stroke="#F57C00" strokeWidth="2" />
            <circle cx="125" cy="143" r="1.4" fill="#FFA726" />
            <circle cx="128" cy="142" r="1.4" fill="#FFA726" />
            <circle cx="131" cy="143" r="1.4" fill="#FFA726" />
          </g>

          {/* Signature Golden Blossom on Ear */}
          <g className="momo-flower" transform="translate(152, 34)">
            {/* 5 Warm Marigold/Jasmine Petals */}
            <circle cx="0" cy="-7" r="5" fill="url(#hamsterFlower)" />
            <circle cx="7" cy="-2" r="5" fill="url(#hamsterFlower)" />
            <circle cx="4" cy="6" r="5" fill="url(#hamsterFlower)" />
            <circle cx="-4" cy="6" r="5" fill="url(#hamsterFlower)" />
            <circle cx="-7" cy="-2" r="5" fill="url(#hamsterFlower)" />
            {/* Flower Center with Ruby Gem */}
            <circle cx="0" cy="0" r="4.2" fill="#E11D48" />
            <circle cx="-1" cy="-1" r="1.5" fill="#FFFFFF" />
          </g>

          {/* Magic Celebration Twinkles */}
          {showSparkle && (
            <g className="momo-sparkle" transform="translate(178, 55)">
              <path
                d="M 0 -8 Q 0 0 8 0 Q 0 0 0 8 Q 0 0 -8 0 Q 0 0 0 -8 Z"
                fill="#FBBF24"
              />
              <circle cx="0" cy="0" r="2" fill="#FFFFFF" />
            </g>
          )}
          {showSparkle && (
            <g className="momo-sparkle" transform="translate(24, 75) scale(0.75)">
              <path
                d="M 0 -8 Q 0 0 8 0 Q 0 0 0 8 Q 0 0 -8 0 Q 0 0 0 -8 Z"
                fill="#FBBF24"
              />
              <circle cx="0" cy="0" r="2" fill="#FFFFFF" />
            </g>
          )}
        </g>
      </svg>
    </div>
  );
};

export default MomoMascot;

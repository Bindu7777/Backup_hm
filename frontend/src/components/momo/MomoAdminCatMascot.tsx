import React from 'react';

export interface MomoAdminCatMascotProps {
  size?: number | string;
  className?: string;
  isWaving?: boolean;
  isHappy?: boolean;
  showSparkle?: boolean;
  title?: string;
}

/**
 * Momo Admin Cat Mascot - Dedicated Executive AI Co-Pilot for Happy Moments Admin.
 * Design attributes:
 * - Ultra-cute, charismatic cat with sharp perky ears & fluffy pink inner ear tufts
 * - Big bright emerald anime eyes with multi-reflection twinkle
 * - Dainty pink nose, cute ω cat smile, fine whiskers, and soft blush
 * - Executive royal indigo collar with golden star medallion / bowtie
 * - Warm silky cream & golden-amber coat matching the Happy Moments warm executive aesthetic
 * - Waving paw and executive AI sparkles
 * - Pure scalable vector SVG for infinite crispness at any resolution
 */
export const MomoAdminCatMascot: React.FC<MomoAdminCatMascotProps> = ({
  size = 140,
  className = '',
  isWaving = true,
  isHappy = true,
  showSparkle = true,
  title = 'Momo Admin Cat, your Executive AI Co-Pilot'
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{
        width: typeof size === 'number' ? `${size}px` : size,
        height: typeof size === 'number' ? `${(size * 1.1).toFixed(0)}px` : 'auto'
      }}
      role="img"
      aria-label={title}
    >
      <svg
        viewBox="0 0 200 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full overflow-visible transition-transform duration-300"
      >
        <defs>
          {/* Cat Fur Gradient: Soft Silk Cream to Golden Amber */}
          <linearGradient id="catFurReact" x1="40" y1="20" x2="160" y2="200" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFDF9" />
            <stop offset="25%" stopColor="#FEF3C7" />
            <stop offset="65%" stopColor="#FDE68A" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>

          {/* Cat Cream Tummy & Cheeks */}
          <linearGradient id="catCreamReact" x1="100" y1="70" x2="100" y2="195" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#FFFBEB" />
          </linearGradient>

          {/* Ear Outer Fur */}
          <linearGradient id="catEarOuterReact" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>

          {/* Ear Inner Pink */}
          <linearGradient id="catEarInnerReact" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FECDD3" />
            <stop offset="100%" stopColor="#FB7185" />
          </linearGradient>

          {/* Rosy Cheek Blush */}
          <radialGradient id="catCheekBlushReact" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FB7185" stopOpacity="0.45" />
            <stop offset="60%" stopColor="#FDA4AF" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#FDA4AF" stopOpacity="0" />
          </radialGradient>

          {/* Emerald Anime Eyes */}
          <linearGradient id="catEyeGradReact" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#064E3B" />
            <stop offset="40%" stopColor="#047857" />
            <stop offset="80%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#34D399" />
          </linearGradient>

          {/* Executive Collar */}
          <linearGradient id="executiveCollarReact" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#312E81" />
            <stop offset="50%" stopColor="#4338CA" />
            <stop offset="100%" stopColor="#4F46E5" />
          </linearGradient>

          {/* Golden Badge */}
          <linearGradient id="catGoldReact" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>

          {/* Soft Ground Shadow */}
          <radialGradient id="catShadowReact" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#6366F1" stopOpacity="0.25" />
            <stop offset="70%" stopColor="#818CF8" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#818CF8" stopOpacity="0" />
          </radialGradient>
        </defs>

        <style>{`
          @media (prefers-reduced-motion: no-preference) {
            .momo-cat-idle {
              animation: momoCatBreathing 3.6s ease-in-out infinite;
              transform-origin: 100px 185px;
            }
            .momo-cat-wave {
              animation: momoCatWaving 2.2s ease-in-out infinite;
              transform-origin: 132px 152px;
            }
            .momo-cat-tail {
              animation: momoCatTailWag 4s ease-in-out infinite;
              transform-origin: 148px 185px;
            }
            .momo-cat-sparkle {
              animation: momoCatSparklePulse 2.8s ease-in-out infinite;
            }
          }
          @keyframes momoCatBreathing {
            0%, 100% { transform: translateY(0px) scale(1); }
            50% { transform: translateY(-3px) scale(1.015, 0.985); }
          }
          @keyframes momoCatWaving {
            0%, 100% { transform: rotate(0deg); }
            20% { transform: rotate(-14deg); }
            40% { transform: rotate(8deg); }
            60% { transform: rotate(-10deg); }
            80% { transform: rotate(4deg); }
          }
          @keyframes momoCatTailWag {
            0%, 100% { transform: rotate(0deg); }
            50% { transform: rotate(6deg); }
          }
          @keyframes momoCatSparklePulse {
            0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.9; }
            50% { transform: scale(1.25) rotate(15deg); opacity: 1; }
          }
        `}</style>

        {/* Ambient Ground Shadow */}
        <ellipse cx="100" cy="208" rx="60" ry="8" fill="url(#catShadowReact)" />

        {/* Animated Main Cat Character */}
        <g className="momo-cat-idle">
          {/* Animated Tail */}
          <g className="momo-cat-tail">
            <path
              d="M 148 185 C 168 188, 185 174, 182 152 C 180 134, 166 138, 170 148 C 172 154, 166 166, 146 168 Z"
              fill="url(#catFurReact)"
              stroke="#D97706"
              strokeWidth="2"
            />
            <circle cx="176" cy="142" r="5" fill="#FFFFFF" opacity="0.9" />
          </g>

          {/* Back Paws */}
          <ellipse cx="70" cy="198" rx="14" ry="7.5" fill="#FEF3C7" stroke="#D97706" strokeWidth="1.8" />
          <ellipse cx="130" cy="198" rx="14" ry="7.5" fill="#FEF3C7" stroke="#D97706" strokeWidth="1.8" />

          {/* Perky Triangular Cat Ears */}
          {/* Left Ear */}
          <g>
            <path
              d="M 44 76 L 38 24 C 38 20, 42 18, 46 22 L 80 50 Z"
              fill="url(#catEarOuterReact)"
              stroke="#D97706"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            <path
              d="M 46 64 L 43 28 C 43 26, 46 25, 48 28 L 71 47 Z"
              fill="url(#catEarInnerReact)"
            />
            <path d="M 45 38 Q 51 41 49 48" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.8" />
          </g>

          {/* Right Ear */}
          <g>
            <path
              d="M 156 76 L 162 24 C 162 20, 158 18, 154 22 L 120 50 Z"
              fill="url(#catEarOuterReact)"
              stroke="#D97706"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            <path
              d="M 154 64 L 157 28 C 157 26, 154 25, 152 28 L 129 47 Z"
              fill="url(#catEarInnerReact)"
            />
            <path d="M 155 38 Q 149 41 151 48" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.8" />
          </g>

          {/* Chubby Cat Body Silhouette */}
          <path
            d="M 62 66 C 62 38, 138 38, 138 66 C 154 76, 172 102, 168 144 C 164 184, 138 202, 100 202 C 62 202, 36 184, 32 144 C 28 102, 46 76, 62 66 Z"
            fill="url(#catFurReact)"
            stroke="#D97706"
            strokeWidth="2.5"
          />

          {/* Amber/Calico Shoulder Markings */}
          <path
            d="M 42 74 C 52 82, 56 100, 50 118 C 38 110, 32 94, 42 74 Z"
            fill="#F59E0B"
            opacity="0.45"
          />
          <path
            d="M 158 74 C 148 82, 144 100, 150 118 C 162 110, 168 94, 158 74 Z"
            fill="#F59E0B"
            opacity="0.45"
          />

          {/* Cream Muzzle & Tummy Patch */}
          <path
            d="M 64 104 C 58 128, 54 144, 68 170 C 78 190, 122 190, 132 170 C 146 144, 142 128, 136 104 C 132 82, 118 76, 100 76 C 82 76, 68 82, 64 104 Z"
            fill="url(#catCreamReact)"
          />

          {/* Executive Forehead Golden Star Accent */}
          <path
            d="M 100 48 L 102.5 56 L 110 57 L 104 62 L 106 70 L 100 65 L 94 70 L 96 62 L 90 57 L 97.5 56 Z"
            fill="url(#catGoldReact)"
            opacity="0.9"
          />

          {/* Big Kawaii Emerald Cat Eyes */}
          {/* Left Eye */}
          <g>
            <ellipse cx="76" cy="106" rx="8.5" ry="11.5" fill="url(#catEyeGradReact)" />
            <ellipse cx="76" cy="106" rx="3.5" ry="9.5" fill="#042F2E" />
            <circle cx="73.5" cy="101.5" r="3.5" fill="#FFFFFF" />
            <circle cx="78.5" cy="110" r="1.6" fill="#FFFFFF" />
            <circle cx="74" cy="112" r="1" fill="#A7F3D0" />
            <path d="M 67 96 Q 76 91 85 95" stroke="#374151" strokeWidth="2.2" strokeLinecap="round" fill="none" />
            <path d="M 67 96 L 63 94" stroke="#374151" strokeWidth="2" strokeLinecap="round" />
          </g>

          {/* Right Eye */}
          <g>
            <ellipse cx="124" cy="106" rx="8.5" ry="11.5" fill="url(#catEyeGradReact)" />
            <ellipse cx="124" cy="106" rx="3.5" ry="9.5" fill="#042F2E" />
            <circle cx="121.5" cy="101.5" r="3.5" fill="#FFFFFF" />
            <circle cx="126.5" cy="110" r="1.6" fill="#FFFFFF" />
            <circle cx="122" cy="112" r="1" fill="#A7F3D0" />
            <path d="M 115 95 Q 124 91 133 96" stroke="#374151" strokeWidth="2.2" strokeLinecap="round" fill="none" />
            <path d="M 133 96 L 137 94" stroke="#374151" strokeWidth="2" strokeLinecap="round" />
          </g>

          {/* Soft Blushing Cheeks */}
          <ellipse cx="56" cy="118" rx="13" ry="8" fill="url(#catCheekBlushReact)" />
          <ellipse cx="144" cy="118" rx="13" ry="8" fill="url(#catCheekBlushReact)" />

          {/* Dainty Pink Nose */}
          <path
            d="M 100 112 C 97.5 112, 96 114.5, 98 117 L 100 119.5 L 102 117 C 104 114.5, 102.5 112, 100 112 Z"
            fill="#FB7185"
          />

          {/* Sweet ω Cat Smile */}
          <path
            d="M 92 121 Q 96 125 100 121 Q 104 125 108 121"
            stroke="#4B5563"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />

          {/* Cat Whiskers */}
          <path d="M 44 115 L 22 112" stroke="#4B5563" strokeWidth="1.5" strokeLinecap="round" opacity="0.65" />
          <path d="M 44 121 L 20 124" stroke="#4B5563" strokeWidth="1.5" strokeLinecap="round" opacity="0.65" />
          <path d="M 46 127 L 26 132" stroke="#4B5563" strokeWidth="1.5" strokeLinecap="round" opacity="0.65" />

          <path d="M 156 115 L 178 112" stroke="#4B5563" strokeWidth="1.5" strokeLinecap="round" opacity="0.65" />
          <path d="M 156 121 L 180 124" stroke="#4B5563" strokeWidth="1.5" strokeLinecap="round" opacity="0.65" />
          <path d="M 154 127 L 174 132" stroke="#4B5563" strokeWidth="1.5" strokeLinecap="round" opacity="0.65" />

          {/* Executive Collar (Royal Indigo) */}
          <path
            d="M 72 144 C 86 152, 114 152, 128 144 L 126 152 C 112 160, 88 160, 74 152 Z"
            fill="url(#executiveCollarReact)"
          />

          {/* Executive Bow Tie & Golden Admin Badge */}
          <g transform="translate(100, 152)">
            <path d="M 0 -1 L -12 -7 L -10 6 Z" fill="#4338CA" />
            <path d="M 0 -1 L 12 -7 L 10 6 Z" fill="#4338CA" />
            <circle cx="0" cy="0" r="5" fill="url(#catGoldReact)" stroke="#FFFFFF" strokeWidth="1.2" />
            <circle cx="-1" cy="-1" r="1.3" fill="#FFFFFF" />
          </g>

          {/* Left Cat Paw */}
          <g>
            <ellipse cx="76" cy="158" rx="8" ry="9.5" fill="#FFFDF9" stroke="#D97706" strokeWidth="2" />
            <circle cx="73" cy="156" r="1.3" fill="#F59E0B" />
            <circle cx="76" cy="155" r="1.3" fill="#F59E0B" />
            <circle cx="79" cy="156" r="1.3" fill="#F59E0B" />
          </g>

          {/* Right Waving Cat Paw */}
          <g className={isWaving ? 'momo-cat-wave' : ''}>
            <ellipse cx="132" cy="152" rx="8.5" ry="10" fill="#FFFDF9" stroke="#D97706" strokeWidth="2" />
            <circle cx="129" cy="150" r="1.4" fill="#F59E0B" />
            <circle cx="132" cy="149" r="1.4" fill="#F59E0B" />
            <circle cx="135" cy="150" r="1.4" fill="#F59E0B" />
          </g>

          {/* Executive Magic Sparkles (AI Intelligence) */}
          {showSparkle && (
            <g className="momo-cat-sparkle" transform="translate(178, 55)">
              <path d="M 0 -8 Q 0 0 8 0 Q 0 0 0 8 Q 0 0 -8 0 Q 0 0 0 -8 Z" fill="#6366F1" />
              <circle cx="0" cy="0" r="2" fill="#FFFFFF" />
            </g>
          )}
          {showSparkle && (
            <g className="momo-cat-sparkle" transform="translate(24, 75) scale(0.75)">
              <path d="M 0 -8 Q 0 0 8 0 Q 0 0 0 8 Q 0 0 -8 0 Q 0 0 0 -8 Z" fill="#818CF8" />
              <circle cx="0" cy="0" r="2" fill="#FFFFFF" />
            </g>
          )}
        </g>
      </svg>
    </div>
  );
};

export default MomoAdminCatMascot;


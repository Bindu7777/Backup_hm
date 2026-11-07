import React from 'react';

export interface MomoMascotProps {
  size?: number | string;
  className?: string;
  isWaving?: boolean;
  isHappy?: boolean;
  showSparkle?: boolean;
  title?: string;
}

/**
 * Momo Mascot - Original, custom vector character for Happy Moments.
 * Design attributes:
 * - Soft rounded pear silhouette in warm ivory with peach-to-coral blush
 * - Expressive eyes with dual twinkle reflections and warm welcoming smile
 * - Signature golden celebration blossom (marigold/jasmine) with celebration sparkle
 * - Festive coral neckband with polished teal drop gem accent
 * - Pure SVG for infinite crispness at any screen size or pixel density
 * - Respects prefers-reduced-motion for all subtle idle animations
 */
export const MomoMascot: React.FC<MomoMascotProps> = ({
  size = 140,
  className = '',
  isWaving = true,
  isHappy = true,
  showSparkle = true,
  title = 'Momo, your Happy Moments event planning companion'
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
          {/* Soft 3D Body Lighting: Warm Ivory -> Peach -> Coral Tone */}
          <linearGradient id="momoBodyGrad" x1="45" y1="30" x2="160" y2="205" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFDF9" />
            <stop offset="40%" stopColor="#FFF5EE" />
            <stop offset="75%" stopColor="#FED7C3" />
            <stop offset="100%" stopColor="#FDBA9B" />
          </linearGradient>

          {/* 3D Sheen Highlight */}
          <radialGradient id="momoHighlight" cx="75" cy="65" r="65" fx="65" fy="50" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>

          {/* Soft Pearly Belly Patch */}
          <linearGradient id="momoBellyGrad" x1="100" y1="110" x2="100" y2="190" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#FFF2E8" stopOpacity="0.95" />
          </linearGradient>

          {/* Rosy Cheek Blush */}
          <radialGradient id="momoBlush" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FF6B6B" stopOpacity="0.55" />
            <stop offset="60%" stopColor="#FF8E85" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#FF8E85" stopOpacity="0" />
          </radialGradient>

          {/* Celebration Flower Gradient (Warm Gold & Amber) */}
          <linearGradient id="momoFlowerPetal" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#EA580C" />
          </linearGradient>

          {/* Teal Accent Gem/Charm (Happy Moments Elegance) */}
          <linearGradient id="momoTealGem" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#5EEAD4" />
            <stop offset="50%" stopColor="#14B8A6" />
            <stop offset="100%" stopColor="#0F766E" />
          </linearGradient>

          {/* Coral Neck Ribbon */}
          <linearGradient id="momoCollarGrad" x1="70" y1="136" x2="130" y2="144" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FB7185" />
            <stop offset="50%" stopColor="#F43F5E" />
            <stop offset="100%" stopColor="#E11D48" />
          </linearGradient>

          {/* Eye Depth Gradient */}
          <linearGradient id="momoEyeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#231815" />
            <stop offset="100%" stopColor="#3A231C" />
          </linearGradient>

          {/* Ambient Ground Shadow Filter */}
          <filter id="momoSoftShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#C2410C" floodOpacity="0.14" />
          </filter>

          {/* Sparkle Glow Filter */}
          <filter id="momoSparkleGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <style>{`
          @media (prefers-reduced-motion: no-preference) {
            .momo-idle-float {
              animation: momoFloat 4s ease-in-out infinite;
            }
            .momo-arm-wave {
              animation: momoWave 2.8s ease-in-out infinite;
              transform-origin: 148px 132px;
            }
            .momo-sparkle-twinkle {
              animation: momoTwinkle 3s ease-in-out infinite;
            }
          }
          @keyframes momoFloat {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-4px); }
          }
          @keyframes momoWave {
            0%, 100% { transform: rotate(0deg); }
            35% { transform: rotate(-9deg); }
            70% { transform: rotate(3deg); }
          }
          @keyframes momoTwinkle {
            0%, 100% { opacity: 0.85; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.15); }
          }
        `}</style>

        {/* Ambient Ground Shadow (Soft warm depth) */}
        <ellipse cx="100" cy="210" rx="52" ry="6.5" fill="#7C2D12" opacity="0.14" />

        {/* Floating Animated Character Group */}
        <g className="momo-idle-float">
          {/* Rounded Ears with Blush Interior */}
          {/* Left Ear */}
          <path d="M 46 62 C 34 50, 42 26, 60 38 C 65 42, 66 52, 58 60 Z" fill="url(#momoBodyGrad)" />
          <path d="M 48 56 C 42 48, 47 34, 57 42 C 59 45, 59 52, 53 56 Z" fill="#FFAEA0" opacity="0.45" />

          {/* Right Ear */}
          <path d="M 154 62 C 166 50, 158 26, 140 38 C 135 42, 134 52, 142 60 Z" fill="url(#momoBodyGrad)" />
          <path d="M 152 56 C 158 48, 153 34, 143 42 C 141 45, 141 52, 147 56 Z" fill="#FFAEA0" opacity="0.45" />

          {/* Main Body Silhouette (Organic Chubby Pear Contour) */}
          <path
            d="M 62 68 C 62 26, 138 26, 138 68 C 145 92, 166 122, 162 165 C 158 198, 130 206, 100 206 C 70 206, 42 198, 38 165 C 34 122, 55 92, 62 68 Z"
            fill="url(#momoBodyGrad)"
            filter="url(#momoSoftShadow)"
          />

          {/* 3D Highlight Sheen Overlay */}
          <path
            d="M 62 68 C 62 26, 138 26, 138 68 C 145 92, 166 122, 162 165 C 158 198, 130 206, 100 206 C 70 206, 42 198, 38 165 C 34 122, 55 92, 62 68 Z"
            fill="url(#momoHighlight)"
          />

          {/* Soft Cream Belly Patch */}
          <path
            d="M 74 125 C 74 105, 126 105, 126 125 C 136 150, 134 192, 100 195 C 66 192, 64 150, 74 125 Z"
            fill="url(#momoBellyGrad)"
          />

          {/* Chubby Little Paws / Feet */}
          <ellipse cx="78" cy="204" rx="13" ry="6.5" fill="url(#momoBodyGrad)" />
          <ellipse cx="78" cy="203" rx="8" ry="3.5" fill="#FFFFFF" opacity="0.6" />
          <ellipse cx="122" cy="204" rx="13" ry="6.5" fill="url(#momoBodyGrad)" />
          <ellipse cx="122" cy="203" rx="8" ry="3.5" fill="#FFFFFF" opacity="0.6" />

          {/* Resting Left Hand */}
          <path d="M 42 145 C 36 142, 40 162, 50 162 C 58 162, 58 148, 50 145 Z" fill="url(#momoBodyGrad)" />
          <ellipse cx="48" cy="153" rx="5.5" ry="4.5" fill="#FFF5EE" />

          {/* Welcoming Waving Right Arm */}
          <g className={isWaving ? 'momo-arm-wave' : ''}>
            <path
              d="M 152 140 C 168 132, 178 114, 172 104 C 166 94, 154 106, 146 122 C 143 128, 145 136, 152 140 Z"
              fill="url(#momoBodyGrad)"
            />
            {/* Friendly Rounded Paw */}
            <ellipse cx="170" cy="104" rx="7.5" ry="8" fill="#FFF9F5" />
            <circle cx="168" cy="102" r="2.2" fill="#FFFFFF" />
          </g>

          {/* Rosy Cheeks (Coral Pink Airbrush Blush) */}
          <ellipse cx="63" cy="118" rx="12" ry="7" fill="url(#momoBlush)" />
          <ellipse cx="137" cy="118" rx="12" ry="7" fill="url(#momoBlush)" />

          {/* Expressive Friendly Eyes */}
          {/* Left Eye */}
          <g>
            <ellipse cx="75" cy="102" rx="7.5" ry="10" fill="url(#momoEyeGrad)" />
            {/* Primary Catchlight */}
            <ellipse cx="73" cy="98" rx="3.2" ry="4.2" fill="#FFFFFF" />
            {/* Secondary Twinkle */}
            <circle cx="77.5" cy="105.5" r="1.8" fill="#FFFFFF" />
          </g>

          {/* Right Eye */}
          <g>
            <ellipse cx="125" cy="102" rx="7.5" ry="10" fill="url(#momoEyeGrad)" />
            {/* Primary Catchlight */}
            <ellipse cx="123" cy="98" rx="3.2" ry="4.2" fill="#FFFFFF" />
            {/* Secondary Twinkle */}
            <circle cx="127.5" cy="105.5" r="1.8" fill="#FFFFFF" />
          </g>

          {/* Gentle Curved Eyebrows */}
          <path d="M 68 87 Q 75 83 82 87" stroke="#8B4513" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.65" />
          <path d="M 118 87 Q 125 83 132 87" stroke="#8B4513" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.65" />

          {/* Warm Welcoming Smile */}
          <path d="M 91 116 Q 100 126 109 116" stroke="#702214" strokeWidth="2.4" strokeLinecap="round" fill="none" />
          <path d="M 89.5 115 Q 90.5 117 92 116" stroke="#702214" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.45" />
          <path d="M 108 116 Q 109.5 117 110.5 115" stroke="#702214" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.45" />

          {/* Tiny Cute Peach Nose */}
          <ellipse cx="100" cy="107" rx="2.4" ry="1.8" fill="#F97316" opacity="0.4" />

          {/* Festival Collar with Teal Gem Pendant (Happy Moments Motif) */}
          <g>
            <path d="M 74 136 C 88 143, 112 143, 126 136 C 122 143, 78 143, 74 136 Z" fill="url(#momoCollarGrad)" />
            <path d="M 76 136 C 90 142, 110 142, 124 136" stroke="#FDE047" strokeWidth="0.8" fill="none" opacity="0.75" />
            {/* Gold Pendant Loop */}
            <circle cx="100" cy="142" r="2.5" fill="#F59E0B" />
            {/* Polished Teal Drop Gem */}
            <path d="M 100 142 L 104 148 C 104 151, 96 151, 96 148 Z" fill="url(#momoTealGem)" filter="url(#momoSoftShadow)" />
            <circle cx="99.5" cy="146.5" r="1" fill="#FFFFFF" opacity="0.85" />
          </g>

          {/* Signature Golden Celebration Blossom Headpiece */}
          <g transform="translate(52, 44)" filter="url(#momoSparkleGlow)">
            {/* 5 Delicate Petals */}
            <circle cx="0" cy="-7" r="5.5" fill="url(#momoFlowerPetal)" />
            <circle cx="6.6" cy="-2.2" r="5.5" fill="url(#momoFlowerPetal)" />
            <circle cx="4.1" cy="5.6" r="5.5" fill="url(#momoFlowerPetal)" />
            <circle cx="-4.1" cy="5.6" r="5.5" fill="url(#momoFlowerPetal)" />
            <circle cx="-6.6" cy="-2.2" r="5.5" fill="url(#momoFlowerPetal)" />
            {/* Flower Core */}
            <circle cx="0" cy="0" r="4" fill="#FFFBEB" />
            <circle cx="0" cy="0" r="2.5" fill="#EA580C" />
            <circle cx="-0.8" cy="-0.8" r="1" fill="#FFFFFF" />
          </g>

          {/* Celebration Magic Sparkles */}
          {showSparkle && (
            <g className="momo-sparkle-twinkle">
              {/* Main Golden Star Sparkle near blossom */}
              <path
                d="M 38 34 Q 38 27 41 24 Q 44 27 44 34 Q 44 41 41 44 Q 38 41 38 34 Z"
                fill="#FDE047"
                filter="url(#momoSparkleGlow)"
              />
              <circle cx="41" cy="34" r="1.4" fill="#FFFFFF" />

              {/* Gentle Secondary Sparkle */}
              <circle cx="148" cy="74" r="2" fill="#FDE047" opacity="0.85" filter="url(#momoSparkleGlow)" />
              <circle cx="148" cy="74" r="1" fill="#FFFFFF" />
            </g>
          )}
        </g>
      </svg>
    </div>
  );
};

export default MomoMascot;


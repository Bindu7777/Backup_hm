// Momo on the greeting card: waves at the start, nods/bounces when the customer
// picks something, celebrates at the end. Uses the existing MomoMascot SVG; if it
// ever fails to render, a hamster emoji takes its place. All motion is CSS and is
// switched off for people who prefer reduced motion.

import React from "react";
import MomoMascot from "@/components/momo/MomoMascot";

export type MomoMood = "wave" | "nod" | "bounce" | "celebrate" | "dance";

class MomoFallback extends React.Component<{ size: number; children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) {
      return <span role="img" aria-label="Momo" style={{ fontSize: this.props.size * 0.7, lineHeight: 1 }}>🐹</span>;
    }
    return this.props.children;
  }
}

type Props = {
  mood: MomoMood;
  /** Changes on every reaction so the animation replays. */
  beat: number;
  say?: string;
  size?: number;
  className?: string;
  /** Tapping Momo: the parent plays a sound / reaction. */
  onTap?: () => void;
};

export const MomoBuddy: React.FC<Props> = ({ mood, beat, say, size = 64, className = "", onTap }) => {
  const inner = (
    <div key={`${mood}-${beat}`} className={`hm-momo hm-momo-${mood} relative shrink-0`} style={{ width: size, height: Math.round(size * 1.08) }}>
      {(mood === "dance" || mood === "celebrate") && (
        <span className="hm-notes pointer-events-none absolute -top-2 left-0 right-0" aria-hidden>
          <i>♪</i><i>♫</i><i>✨</i>
        </span>
      )}
      <MomoFallback size={size}>
        <MomoMascot size={size} isWaving={mood === "wave" || mood === "celebrate" || mood === "dance"} interactive={false} playSoundOnClick={false} showSparkle={mood === "celebrate" || mood === "dance"} title="Momo" />
      </MomoFallback>
    </div>
  );
  return (
    <div className={`flex items-end gap-2 ${className}`}>
      {onTap ? (
        <button type="button" onClick={onTap} aria-label="Say hi to Momo" className="shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A63A]">
          {inner}
        </button>
      ) : inner}
      {say && (
        <p key={say} aria-live="polite"
          className="hm-bubble relative mb-3 max-w-[15rem] rounded-2xl rounded-bl-sm bg-white px-3 py-2 text-[13px] leading-snug text-[#5A1E33] shadow-[0_4px_14px_rgba(122,31,61,0.10)] ring-1 ring-[#EAD7B7]">
          {say}
        </p>
      )}
    </div>
  );
};

export const momoStyles = `
  .hm-momo { transform-origin: 50% 90%; }
  @media (prefers-reduced-motion: no-preference) {
    .hm-momo-wave { animation: hmMomoIn .5s cubic-bezier(.3,1.4,.5,1) both; }
    .hm-momo-nod { animation: hmMomoNod .55s ease-in-out both; }
    .hm-momo-bounce { animation: hmMomoBounce .6s cubic-bezier(.3,1.6,.5,1) both; }
    .hm-momo-celebrate { animation: hmMomoParty 1.1s ease-in-out 2 both; }
    .hm-bubble { animation: hmBubble .3s ease-out both; }
    .hm-momo-dance { animation: hmMomoDance .9s ease-in-out 4 both; }
    .hm-notes i { position: absolute; font-style: normal; color: #C9567A; font-size: 14px; opacity: 0; animation: hmNote 1.6s ease-out infinite; }
    .hm-notes i:nth-child(1) { left: 0; animation-delay: 0s; }
    .hm-notes i:nth-child(2) { left: 45%; animation-delay: .5s; color: #D4A63A; }
    .hm-notes i:nth-child(3) { right: 0; animation-delay: 1s; }
  }
  @keyframes hmMomoDance { 0%,100% { transform: none; } 15% { transform: translateY(-10px) rotate(-12deg); } 30% { transform: translateY(0) rotate(0) scale(1.05,.95); } 45% { transform: translateY(-10px) rotate(12deg); } 60% { transform: translateY(0) rotate(0) scale(1.05,.95); } 80% { transform: translateY(-16px) rotate(360deg); } }
  @keyframes hmNote { 0% { opacity: 0; transform: translateY(6px) scale(.7); } 25% { opacity: 1; } 100% { opacity: 0; transform: translateY(-26px) scale(1.15); } }
  @keyframes hmMomoIn { from { opacity: 0; transform: translateY(14px) scale(.85); } to { opacity: 1; transform: none; } }
  @keyframes hmMomoNod { 0%,100% { transform: none; } 30% { transform: rotate(-7deg) translateY(2px); } 65% { transform: rotate(5deg); } }
  @keyframes hmMomoBounce { 0%,100% { transform: none; } 35% { transform: translateY(-14px) scale(1.04,.96); } 60% { transform: translateY(0) scale(.97,1.03); } }
  @keyframes hmMomoParty { 0%,100% { transform: none; } 25% { transform: translateY(-16px) rotate(-8deg); } 50% { transform: translateY(0) rotate(0); } 75% { transform: translateY(-10px) rotate(8deg); } }
  @keyframes hmBubble { from { opacity: 0; transform: translateY(4px) scale(.96); } to { opacity: 1; transform: none; } }
`;

export default MomoBuddy;

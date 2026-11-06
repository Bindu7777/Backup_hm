import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Heart, 
  ExternalLink, 
  X, 
  Footprints, 
  Zap,
  Mic,
  MessageCircle,
  Target,
  Smile,
  Volume1
} from 'lucide-react';
import { momoSound } from '../../utils/momoSoundEffects';

const MomoCompanionInner: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Screen coordinates
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    if (typeof window !== 'undefined') {
      return {
        x: Math.max(20, window.innerWidth - 220),
        y: Math.max(20, window.innerHeight - 170)
      };
    }
    return { x: 500, y: 500 };
  });

  const [facing, setFacing] = useState<'left' | 'right'>('left');
  const [isWalking, setIsWalking] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isDancing, setIsDancing] = useState<boolean>(false);
  const [isWaving, setIsWaving] = useState<boolean>(true);
  const [walkMode, setWalkMode] = useState<'walk' | 'stay'>('walk');
  const [catchMeMode, setCatchMeMode] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(momoSound.isEnabled());
  const [speechBubble, setSpeechBubble] = useState<string>('Hey Hima! Hey Hima! Catch me! 🏃‍♀️💨');
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [hearts, setHearts] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [walkCycle, setWalkCycle] = useState<number>(0);
  const [caughtCount, setCaughtCount] = useState<number>(0);

  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const walkTimerRef = useRef<NodeJS.Timeout | null>(null);
  const speechIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastDodgeTimeRef = useRef<number>(0);
  const positionRef = useRef<{ x: number; y: number }>(position);
  positionRef.current = position;

  // Window resize handler to keep Momo on-screen
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => ({
        x: Math.min(prev.x, window.innerWidth - 160),
        y: Math.min(prev.y, window.innerHeight - 160)
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Articulated limbs walking & footstep ticker
  useEffect(() => {
    if (!isWalking) {
      setWalkCycle(0);
      return;
    }
    const ticker = setInterval(() => {
      setWalkCycle((prev) => (prev + 1) % 8);
      momoSound.playFootstep();
    }, 125);
    return () => clearInterval(ticker);
  }, [isWalking]);

  // Initial greeting (SINGLE call, no duplicate triggers!)
  useEffect(() => {
    let triggered = false;
    const triggerFirstSpeech = () => {
      if (triggered) return;
      triggered = true;
      setSpeechBubble('Hey Hima! Hey Hima! Catch me! 🏃‍♀️💨');
      momoSound.speakCatchMe();
      window.removeEventListener('click', triggerFirstSpeech);
    };

    window.addEventListener('click', triggerFirstSpeech, { once: true });

    return () => {
      window.removeEventListener('click', triggerFirstSpeech);
    };
  }, []);

  // Autonomous wandering loop
  useEffect(() => {
    if (walkMode !== 'walk' || isDragging || showMenu) return;

    const scheduleNextWalk = () => {
      const delay = 6000 + Math.random() * 6000;
      walkTimerRef.current = setTimeout(() => {
        if (walkMode !== 'walk' || isDragging || showMenu) return;

        const minX = 40;
        const maxX = Math.max(100, window.innerWidth - 180);
        const minY = Math.max(100, window.innerHeight - 200);
        const maxY = Math.max(120, window.innerHeight - 140);

        const targetX = Math.round(minX + Math.random() * (maxX - minX));
        const targetY = Math.round(minY + Math.random() * (maxY - minY));

        walkTo(targetX, targetY);
      }, delay);
    };

    scheduleNextWalk();

    return () => {
      if (walkTimerRef.current) clearTimeout(walkTimerRef.current);
    };
  }, [walkMode, isDragging, showMenu, position]);

  // Smooth walking engine with limb articulation
  const walkTo = (targetX: number, targetY: number, speedMultiplier: number = 1) => {
    if (isDragging) return;

    const startX = positionRef.current.x;
    const startY = positionRef.current.y;
    const dx = targetX - startX;
    const dy = targetY - startY;
    const distance = Math.hypot(dx, dy);

    if (distance < 15) return;

    setFacing(dx < 0 ? 'left' : 'right');
    setIsWalking(true);
    setIsWaving(false);

    const baseSpeed = 85 * speedMultiplier;
    const duration = Math.min(4500, Math.max(800, (distance / baseSpeed) * 1000));
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - progress, 3);

      setPosition({
        x: Math.round(startX + dx * ease),
        y: Math.round(startY + dy * ease)
      });

      if (progress < 1 && !isDragging) {
        requestAnimationFrame(step);
      } else {
        setIsWalking(false);
        setIsWaving(true);
      }
    };

    requestAnimationFrame(step);
  };

  // "Catch Me" Mouse Proximity Evasion
  useEffect(() => {
    if (!catchMeMode || isDragging || showMenu) return;

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastDodgeTimeRef.current < 2500) return;

      const momoCenterX = positionRef.current.x + 45;
      const momoCenterY = positionRef.current.y + 45;
      const dist = Math.hypot(e.clientX - momoCenterX, e.clientY - momoCenterY);

      if (dist < 85 && dist > 20) {
        lastDodgeTimeRef.current = now;
        
        const angle = Math.atan2(momoCenterY - e.clientY, momoCenterX - e.clientX);
        const escapeDistance = 140 + Math.random() * 120;
        
        let newX = momoCenterX + Math.cos(angle) * escapeDistance - 45;
        let newY = momoCenterY + Math.sin(angle) * escapeDistance - 45;

        newX = Math.max(30, Math.min(window.innerWidth - 160, newX));
        newY = Math.max(80, Math.min(window.innerHeight - 160, newY));

        setSpeechBubble('Hehe! Too slow Hima! 💨 Catch me!');
        momoSound.speakTooSlow();
        walkTo(Math.round(newX), Math.round(newY), 1.9);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [catchMeMode, isDragging, showMenu]);

  // Dragging Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();

    setIsDragging(true);
    setIsWalking(false);
    momoSound.playBoing();
    setSpeechBubble('Wheeee! You picked me up! 🎈');

    dragOffsetRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newX = Math.max(10, Math.min(window.innerWidth - 130, moveEvent.clientX - dragOffsetRef.current.x));
      const newY = Math.max(10, Math.min(window.innerHeight - 130, moveEvent.clientY - dragOffsetRef.current.y));
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      momoSound.playChirp();
      setSpeechBubble('Landed softly on my feet! ✨');
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Touch Dragging
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 0) return;
    const touch = e.touches[0];
    setIsDragging(true);
    setIsWalking(false);
    momoSound.playBoing();

    dragOffsetRef.current = {
      x: touch.clientX - position.x,
      y: touch.clientY - position.y
    };

    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (moveEvent.touches.length === 0) return;
      const t = moveEvent.touches[0];
      const newX = Math.max(10, Math.min(window.innerWidth - 130, t.clientX - dragOffsetRef.current.x));
      const newY = Math.max(10, Math.min(window.innerHeight - 130, t.clientY - dragOffsetRef.current.y));
      setPosition({ x: newX, y: newY });
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      momoSound.playChirp();
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };

    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);
  };

  // Click on Momo: HIMA CAUGHT MOMO!
  const handleMomoClick = (e: React.MouseEvent) => {
    if (isDragging) return;
    e.stopPropagation();

    setCaughtCount((c) => c + 1);
    setSpeechBubble('Yay! You caught me Hima! 🥰💖');
    momoSound.speakCaught();

    const burst = [
      { id: Date.now(), x: -20, y: -30 },
      { id: Date.now() + 1, x: 0, y: -45 },
      { id: Date.now() + 2, x: 20, y: -30 }
    ];
    setHearts((prev) => [...prev.slice(-3), ...burst]);

    setTimeout(() => {
      setShowMenu((prev) => !prev);
    }, 350);
  };

  // Voice actions
  const handleSayCatchMe = () => {
    setSpeechBubble('Hey Hima! Hey Hima! Catch me! 🏃‍♀️💨');
    momoSound.speakCatchMe();
  };

  const handleSayGreeting = () => {
    setSpeechBubble('Look at my hands & legs move Hima! 🤖👋');
    momoSound.speakGreeting();
  };

  const handleSayStats = () => {
    setSpeechBubble('WhatsApp & Instagram stats are ready! 📊');
    momoSound.speakStats();
  };

  // Dance spin action
  const handleDance = () => {
    if (isDancing) return;
    setIsDancing(true);
    momoSound.playChime();
    setSpeechBubble('Yaaay! Dance party for Hima! 💃🎉');
    momoSound.speakCute('Watch me dance Hima! Wiggle wiggle!');
    setTimeout(() => {
      setIsDancing(false);
    }, 1400);
  };

  // Toggle sound
  const handleToggleSound = () => {
    const updated = momoSound.toggleSound();
    setSoundEnabled(updated);
    setSpeechBubble(updated ? 'Sounds & Voice ON! 🔊' : 'Quiet mode! Shh... 🔇');
    if (updated) {
      momoSound.speakCute('I can talk to you now Hima!');
    }
  };

  // Calculate dynamic 3D limb rotations based on walkCycle
  // Cycle 0 to 7 (8 frames)
  const walkPhase = (walkCycle / 8) * Math.PI * 2;
  const legLeftAngle = isWalking ? Math.sin(walkPhase) * 26 : 0;
  const legRightAngle = isWalking ? -Math.sin(walkPhase) * 26 : 0;
  const armLeftAngle = isWalking ? -Math.sin(walkPhase) * 32 : (isDragging ? 65 : 10);
  const armRightAngle = isWalking ? Math.sin(walkPhase) * 32 : (isDragging ? 65 : (isWaving ? Math.sin(Date.now() / 180) * 18 - 35 : -10));
  const bodyBobY = isWalking ? Math.abs(Math.sin(walkPhase * 2)) * 5 : 0;

  return (
    <>
      {/* 3D Floating & Walking Momo Bot Companion Widget */}
      <div
        className="fixed z-50 select-none touch-none"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Floating Heart Particle Burst */}
        {hearts.map((h) => (
          <div
            key={h.id}
            className="absolute pointer-events-none text-rose-500 font-bold"
            style={{
              left: `${42 + h.x}px`,
              top: `${h.y}px`,
              fontSize: '24px',
              animation: 'floatUp 1.2s forwards'
            }}
          >
            💖
          </div>
        ))}

        {/* Floating Speech / Mood Bubble */}
        {speechBubble && !showMenu && (
          <div 
            onClick={handleMomoClick}
            className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-xl border-2 border-pink-300 text-xs font-bold text-slate-800 whitespace-nowrap cursor-pointer hover:scale-105 transition-all flex items-center gap-1.5 group ring-4 ring-pink-100/60"
          >
            <Sparkles className="w-3.5 h-3.5 text-pink-500 animate-spin" style={{ animationDuration: '4s' }} />
            <span>{speechBubble}</span>
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white rotate-45 border-r border-b border-pink-300" />
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3D ARTICULATED BOT: MOVING HEAD, ARMS, HANDS, LEGS, FEET                   */}
        {/* ========================================================================= */}
        <div 
          onClick={handleMomoClick}
          className={`relative group flex flex-col items-center justify-center transition-transform ${
            isDancing ? 'animate-bounce' : ''
          }`}
          style={{
            transform: `${facing === 'left' ? 'scaleX(-1)' : 'scaleX(1)'} ${
              isDragging ? 'scale(1.15) rotate(6deg)' : `translateY(${-bodyBobY}px)`
            }`,
            transition: 'transform 0.12s ease-out'
          }}
        >
          {/* Glowing Ambient 3D Aura */}
          <div className="absolute -inset-2 bg-gradient-to-r from-sky-400/30 via-indigo-400/30 to-pink-400/30 rounded-full blur-xl group-hover:blur-2xl transition-all" />

          {/* MAIN 3D CHARACTER CONTAINER */}
          <div className="relative w-24 h-28 flex flex-col items-center justify-center">

            {/* ARTICULATED LEFT ARM & HAND (Behind Body in 3D perspective) */}
            <div
              className="absolute left-1 top-10 origin-top z-0 transition-transform"
              style={{
                transform: `rotate(${armLeftAngle}deg)`,
                transformOrigin: 'top center'
              }}
            >
              {/* Shoulder Ball Joint */}
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-slate-200 via-sky-300 to-blue-500 shadow-md border border-white" />
              {/* Segmented Robotic Arm */}
              <div className="w-2.5 h-6 mx-auto -mt-1 bg-gradient-to-b from-slate-300 via-sky-200 to-slate-400 rounded-full border border-sky-400/50 shadow-inner flex flex-col justify-around py-0.5">
                <div className="w-full h-0.5 bg-sky-600/30" />
                <div className="w-full h-0.5 bg-sky-600/30" />
              </div>
              {/* 3D Hand / Paw */}
              <div className="w-4 h-4 -mt-1 mx-auto rounded-full bg-gradient-to-br from-white via-sky-100 to-sky-300 border border-sky-400 shadow-md flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-sky-500/40" />
              </div>
            </div>

            {/* 3D HEAD & TORSO (PIXAR 3D MASCOT CHASSIS) */}
            <div className="relative z-10 w-22 h-22 rounded-3xl overflow-hidden bg-gradient-to-b from-white via-slate-50 to-sky-50 shadow-2xl border-2 border-white ring-4 ring-sky-300/40 flex items-center justify-center">
              <img
                src="/momo_3d_bot.png"
                alt="3D Momo Bot"
                className="w-full h-full object-contain pointer-events-none transform scale-110"
              />

              {/* Blinking Cyan Eyes Overlay Animation */}
              <div 
                className="absolute top-7 left-5 w-4 h-4 rounded-full bg-cyan-400/20 blur-[2px] animate-pulse"
                style={{ animationDuration: '2s' }}
              />
              <div 
                className="absolute top-7 right-5 w-4 h-4 rounded-full bg-cyan-400/20 blur-[2px] animate-pulse"
                style={{ animationDuration: '2s' }}
              />

              {/* Rosy Blushing Cheeks */}
              <div className="absolute bottom-5 left-3 w-3 h-2 bg-rose-400/40 rounded-full blur-[1px]" />
              <div className="absolute bottom-5 right-3 w-3 h-2 bg-rose-400/40 rounded-full blur-[1px]" />
            </div>

            {/* ARTICULATED RIGHT ARM & HAND (Foreground 3D - Waving at Hima!) */}
            <div
              className="absolute right-1 top-10 origin-top z-20 transition-transform"
              style={{
                transform: `rotate(${armRightAngle}deg)`,
                transformOrigin: 'top center'
              }}
            >
              {/* Shoulder Ball Joint */}
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-white via-sky-300 to-blue-600 shadow-md border border-white" />
              {/* Segmented Robotic Arm */}
              <div className="w-2.5 h-6 mx-auto -mt-1 bg-gradient-to-b from-slate-200 via-sky-100 to-slate-400 rounded-full border border-sky-400/60 shadow-inner flex flex-col justify-around py-0.5">
                <div className="w-full h-0.5 bg-blue-600/30" />
                <div className="w-full h-0.5 bg-blue-600/30" />
              </div>
              {/* 3D Hand / Waving Paw with articulated fingers! */}
              <div className="w-4.5 h-4.5 -mt-1 mx-auto rounded-full bg-gradient-to-br from-white via-sky-100 to-blue-400 border border-sky-400 shadow-md flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50" />
              </div>
            </div>

            {/* ARTICULATED LEFT & RIGHT LEGS + 3D SHOES */}
            <div className="flex justify-between w-14 px-1.5 -mt-1 relative z-10">
              {/* Left Leg */}
              <div
                className="origin-top flex flex-col items-center transition-transform"
                style={{
                  transform: `rotate(${legLeftAngle}deg)`,
                  transformOrigin: 'top center'
                }}
              >
                {/* Hip Joint */}
                <div className="w-3 h-3 rounded-full bg-sky-600 border border-white shadow-sm" />
                {/* Robotic Thigh & Calf */}
                <div className="w-2.5 h-4 bg-gradient-to-b from-sky-400 to-blue-600 rounded-sm shadow-inner" />
                {/* 3D Blue & White Shoe with Rubber Sole */}
                <div className="w-5 h-3 bg-gradient-to-r from-blue-600 to-sky-500 rounded-full border border-white shadow-md -mt-0.5 flex items-end justify-center pb-0.5">
                  <div className="w-4 h-1 bg-white rounded-full shadow-inner" />
                </div>
              </div>

              {/* Right Leg */}
              <div
                className="origin-top flex flex-col items-center transition-transform"
                style={{
                  transform: `rotate(${legRightAngle}deg)`,
                  transformOrigin: 'top center'
                }}
              >
                {/* Hip Joint */}
                <div className="w-3 h-3 rounded-full bg-sky-600 border border-white shadow-sm" />
                {/* Robotic Thigh & Calf */}
                <div className="w-2.5 h-4 bg-gradient-to-b from-sky-400 to-blue-600 rounded-sm shadow-inner" />
                {/* 3D Blue & White Shoe with Rubber Sole */}
                <div className="w-5 h-3 bg-gradient-to-r from-blue-600 to-sky-500 rounded-full border border-white shadow-md -mt-0.5 flex items-end justify-center pb-0.5">
                  <div className="w-4 h-1 bg-white rounded-full shadow-inner" />
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic 3D Ground Shadow */}
          <div 
            className="w-16 h-3 bg-slate-900/20 rounded-full blur-[2px] mt-0.5 transition-all"
            style={{
              transform: isWalking 
                ? `scaleX(${0.85 + Math.sin(walkPhase * 2) * 0.15})`
                : (isDragging ? 'scaleX(0.5) opacity(0.2)' : 'scaleX(1)')
            }}
          />
        </div>

        {/* ========================================================================= */}
        {/* INTERACTIVE ACTION MENU: VOICE, CATCH ME GAME, STATS                     */}
        {/* ========================================================================= */}
        {showMenu && (
          <div 
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-28 -left-20 w-72 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-sky-200 p-4 animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-full overflow-hidden bg-sky-100 flex items-center justify-center border-2 border-sky-300 shadow-sm">
                  <img src="/momo_3d_bot.png" alt="3D Momo" className="w-full h-full object-contain" />
                </span>
                <div>
                  <h4 className="text-xs font-black text-slate-800 flex items-center gap-1">
                    <span>3D Momo Bot</span>
                    <span className="text-[10px] text-pink-500">✨</span>
                  </h4>
                  <p className="text-[10px] text-sky-600 font-bold">Caught {caughtCount} times by Hima! 💖</p>
                </div>
              </div>
              <button 
                onClick={() => setShowMenu(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Actions List */}
            <div className="py-2.5 space-y-1.5">
              {/* Voice Button 1: "Hey Hima! Catch me!" */}
              <button
                onClick={handleSayCatchMe}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-pink-50 hover:bg-pink-100 text-xs font-bold text-pink-700 transition-all shadow-sm"
              >
                <span className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-pink-600" />
                  Talk: "Hey Hima! Catch me!"
                </span>
                <span className="text-[10px] bg-pink-200 px-1.5 py-0.5 rounded-full font-bold">
                  Voice 🎙️
                </span>
              </button>

              {/* Voice Button 2: "Look at my hands & legs move!" */}
              <button
                onClick={handleSayGreeting}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-xs font-bold text-sky-700 transition-all"
              >
                <span className="flex items-center gap-2">
                  <Smile className="w-4 h-4 text-sky-600" />
                  "Look at my hands & legs!"
                </span>
                <span className="text-[10px] bg-sky-200 px-1.5 py-0.5 rounded-full font-bold">
                  Wave 👋
                </span>
              </button>

              {/* Voice Button 3: WhatsApp & Instagram Stats Announcement */}
              <button
                onClick={handleSayStats}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-xs font-bold text-emerald-800 transition-all"
              >
                <span className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  "Announce Stats!"
                </span>
                <span className="text-[10px] bg-emerald-200 px-1.5 py-0.5 rounded-full font-bold">
                  Stats 📊
                </span>
              </button>

              {/* Catch Me Game Mode Toggle */}
              <button
                onClick={() => {
                  const next = !catchMeMode;
                  setCatchMeMode(next);
                  momoSound.playChirp();
                  if (next) {
                    setSpeechBubble('Catch me mode ON! 🏃‍♀️💨');
                    momoSound.speakCatchMe();
                  } else {
                    setSpeechBubble('Chilling with you Hima! 🧘');
                    momoSound.speakCute('Okay Hima, I will stay right here!');
                  }
                }}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl hover:bg-blue-50 text-xs font-semibold text-slate-700 transition-colors text-left"
              >
                <span className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-amber-500" />
                  "Catch Me" Tag Game
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  catchMeMode ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'
                }`}>
                  {catchMeMode ? 'ACTIVE' : 'OFF'}
                </span>
              </button>

              {/* Sound & Voice Toggle */}
              <button
                onClick={handleToggleSound}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl hover:bg-blue-50 text-xs font-semibold text-slate-700 transition-colors text-left"
              >
                <span className="flex items-center gap-2">
                  {soundEnabled ? (
                    <Volume2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-slate-400" />
                  )}
                  Voice & Cute Sounds
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  soundEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {soundEnabled ? 'ON' : 'MUTED'}
                </span>
              </button>

              {/* Do a Dance! */}
              <button
                onClick={handleDance}
                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-purple-50 text-xs font-bold text-purple-700 transition-colors text-left"
              >
                <Zap className="w-4 h-4 text-purple-600" />
                Do a 3D Dance! 💃
              </button>
            </div>

            {/* Jump to Full Momo Bot Dashboard */}
            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setShowMenu(false);
                  navigate('/admin/momo');
                }}
                className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold py-2.5 px-3 rounded-2xl shadow-md shadow-blue-500/20 transition-all hover:shadow-lg"
              >
                <span>Open WhatsApp & IG Dashboard</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Global CSS keyframes for floating hearts */}
      <style>{`
        @keyframes floatUp {
          0% {
            opacity: 1;
            transform: translateY(0) scale(0.8);
          }
          100% {
            opacity: 0;
            transform: translateY(-65px) scale(1.4);
          }
        }
      `}</style>
    </>
  );
};

/**
 * Strict Admin-Only Guard:
 * Momo Bot Companion will ONLY be rendered and visible to authenticated admins
 * while actively navigating /admin pages.
 * For all public visitors, vendors, customers, or guests, Momo is 100% hidden and unmounted.
 */
export const MomoScreenCompanion: React.FC = () => {
  const location = useLocation();

  const isAdminLoggedIn =
    typeof window !== 'undefined' && localStorage.getItem('adminLoggedIn') === 'true';
  const isAdminRoute =
    location.pathname.startsWith('/admin') && location.pathname !== '/admin/login';

  // If not logged in as admin, or not on an admin route, do not render at all
  if (!isAdminRoute || !isAdminLoggedIn) {
    return null;
  }

  return <MomoCompanionInner />;
};

export default MomoScreenCompanion;

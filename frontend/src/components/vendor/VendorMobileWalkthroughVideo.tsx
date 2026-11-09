import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Subtitles,
  Smartphone,
  Sparkles,
  LogIn,
  CheckCircle2,
  MessageCircle,
  FileText,
  DollarSign,
  TrendingUp,
  Camera,
  Star,
  Layers,
  ChevronRight,
  ShieldCheck,
  Send,
  Eye,
  Download,
  Share2,
  Bell
} from 'lucide-react';
import { momoSound } from '@/utils/momoSoundEffects';
import MomoMascot from '../momo/MomoMascot';

export interface VideoScene {
  id: number;
  title: string;
  timeLabel: string;
  startTime: number; // seconds
  endTime: number; // seconds
  caption: string;
  narrative: string;
  icon: React.ReactNode;
}

export const SCENES: VideoScene[] = [
  {
    id: 1,
    title: '1. Login with Credentials',
    timeLabel: '00:00 - 00:15',
    startTime: 0,
    endTime: 15,
    caption: 'Step 1: Sign in securely with your registered Phone Number & Password.',
    narrative: 'Welcome to Happy Moments Partner Portal. Enter your registered phone number and temporary password to sign in.',
    icon: <LogIn className="w-4 h-4 text-blue-500" />
  },
  {
    id: 2,
    title: '2. Dashboard & Live Leads',
    timeLabel: '00:15 - 00:30',
    startTime: 15,
    endTime: 30,
    caption: 'Step 2: Monitor real-time wedding leads, profile views, and performance stats.',
    narrative: 'Your mobile dashboard provides instant visibility into new customer inquiries, profile views, and active bookings.',
    icon: <TrendingUp className="w-4 h-4 text-amber-500" />
  },
  {
    id: 3,
    title: '3. Portfolio & Packages',
    timeLabel: '00:30 - 00:45',
    startTime: 30,
    endTime: 45,
    caption: 'Step 3: Upload your wedding portfolio, cinematic teasers, and package rates.',
    narrative: 'Showcase your best wedding work with high-resolution albums, cinematic video links, and transparent package pricing.',
    icon: <Camera className="w-4 h-4 text-purple-500" />
  },
  {
    id: 4,
    title: '4. Direct WhatsApp Connect',
    timeLabel: '00:45 - 01:00',
    startTime: 45,
    endTime: 60,
    caption: 'Step 4: Connect directly with wedding clients on WhatsApp with pre-filled quotes.',
    narrative: 'When a couple requests your service, click Chat on WhatsApp to connect directly with all event details pre-filled.',
    icon: <MessageCircle className="w-4 h-4 text-emerald-500" />
  },
  {
    id: 5,
    title: '5. Instant Quotations',
    timeLabel: '01:00 - 01:15',
    startTime: 60,
    endTime: 75,
    caption: 'Step 5: Generate professional GST-compliant estimates and PDF quotations.',
    narrative: 'Create and dispatch branded quotations in seconds, complete with customized item breakdowns and payment milestones.',
    icon: <FileText className="w-4 h-4 text-rose-500" />
  },
  {
    id: 6,
    title: '6. Momo AI & Growth Tips',
    timeLabel: '01:15 - 01:30',
    startTime: 75,
    endTime: 90,
    caption: 'Step 6: Grow your business with 24/7 Momo AI assistant & verified 5-star reviews.',
    narrative: 'Our AI assistant Momo works 24/7 matching high-intent wedding couples to your profile to maximize your bookings.',
    icon: <Sparkles className="w-4 h-4 text-orange-500" />
  }
];

export const VendorMobileWalkthroughVideo: React.FC = () => {
  const TOTAL_DURATION = 90; // seconds
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [showCaptions, setShowCaptions] = useState<boolean>(true);
  const [isVoiceoverOn, setIsVoiceoverOn] = useState<boolean>(true);
  const [activeSceneIndex, setActiveSceneIndex] = useState<number>(0);
  const [isRecording, setIsRecording] = useState<boolean>(false);

  // Simulated typing animation states for Scene 1
  const [typedPhone, setTypedPhone] = useState<string>('');
  const [typedPass, setTypedPass] = useState<string>('');
  const [isLoginVerified, setIsLoginVerified] = useState<boolean>(false);

  const phoneRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  // Determine current active scene based on currentTime
  useEffect(() => {
    const idx = SCENES.findIndex((s) => currentTime >= s.startTime && currentTime < s.endTime);
    if (idx !== -1 && idx !== activeSceneIndex) {
      setActiveSceneIndex(idx);
      // Voice narration when scene starts
      if (isVoiceoverOn && 'speechSynthesis' in window && isPlaying) {
        try {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(SCENES[idx].narrative);
          utterance.rate = 1.05 * playbackRate;
          utterance.pitch = 1.05;
          window.speechSynthesis.speak(utterance);
        } catch (e) {}
      }
    }
  }, [currentTime, isVoiceoverOn, isPlaying, playbackRate, activeSceneIndex]);

  // Main playback timer loop
  useEffect(() => {
    if (!isPlaying) {
      lastTimeRef.current = null;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    const step = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const delta = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      setCurrentTime((prev) => {
        const next = prev + delta * playbackRate;
        if (next >= TOTAL_DURATION) {
          setIsPlaying(false);
          return 0; // loop or reset
        }
        return next;
      });

      animationFrameRef.current = requestAnimationFrame(step);
    };

    animationFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, playbackRate]);

  // Scene 1: Automated typing simulation
  useEffect(() => {
    if (activeSceneIndex === 0) {
      const fullPhone = '9505726010';
      const fullPass = 'HM@2026!';
      const sceneProgress = (currentTime - SCENES[0].startTime) / (SCENES[0].endTime - SCENES[0].startTime);

      if (sceneProgress < 0.45) {
        const charCount = Math.floor((sceneProgress / 0.45) * fullPhone.length);
        setTypedPhone(fullPhone.slice(0, charCount));
        setTypedPass('');
        setIsLoginVerified(false);
      } else if (sceneProgress < 0.75) {
        setTypedPhone(fullPhone);
        const passProgress = (sceneProgress - 0.45) / 0.3;
        const charCount = Math.floor(passProgress * fullPass.length);
        setTypedPass('•'.repeat(charCount));
        setIsLoginVerified(false);
      } else {
        setTypedPhone(fullPhone);
        setTypedPass('••••••••');
        setIsLoginVerified(true);
      }
    }
  }, [currentTime, activeSceneIndex]);

  const togglePlay = () => {
    if (!isPlaying) {
      momoSound.playBubblePop(true);
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    }
  };

  const jumpToScene = (sceneIndex: number) => {
    const target = SCENES[sceneIndex];
    setCurrentTime(target.startTime);
    setActiveSceneIndex(sceneIndex);
    momoSound.playBubblePop(true);
    if (!isPlaying) setIsPlaying(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const activeScene = SCENES[activeSceneIndex] || SCENES[0];

  return (
    <div className="w-full flex flex-col items-center">
      {/* Top Banner Tag */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-bold border border-orange-200 mb-4 shadow-sm">
        <Smartphone className="w-3.5 h-3.5 text-orange-600" />
        <span>Mobile Screen Walkthrough (9:16 Vertical HD View)</span>
      </div>

      {/* Main Smartphone Shell Showcase */}
      <div className="relative group p-2 sm:p-4 bg-slate-900/5 rounded-[48px] border border-slate-200 shadow-2xl max-w-sm w-full mx-auto">
        {/* Outer Glow */}
        <div className="absolute -inset-1.5 bg-gradient-to-tr from-orange-500/20 via-amber-500/20 to-rose-500/20 rounded-[52px] blur-xl -z-10" />

        {/* Smartphone Hardware Frame */}
        <div
          ref={phoneRef}
          className="relative w-full aspect-[9/18.5] max-h-[640px] bg-slate-950 rounded-[40px] overflow-hidden border-4 border-slate-800 shadow-2xl flex flex-col justify-between select-none"
        >
          {/* Top Status Bar & Dynamic Island */}
          <div className="relative z-30 pt-3 px-6 flex items-center justify-between text-[11px] text-white font-semibold">
            {/* Clock */}
            <span>9:41</span>

            {/* Dynamic Island Pill */}
            <div className="w-24 h-5 bg-black rounded-full border border-slate-800 flex items-center justify-center gap-1.5 px-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] text-slate-400 font-medium">HM Partner</span>
            </div>

            {/* Icons: 5G & Battery */}
            <div className="flex items-center gap-1.5 text-white/90">
              <span className="text-[10px]">5G</span>
              <div className="w-5 h-2.5 border border-white/80 rounded-sm p-0.5 flex items-center">
                <div className="w-3 h-1.5 bg-emerald-400 rounded-2xs" />
              </div>
            </div>
          </div>

          {/* Interactive Screen Content Viewport */}
          <div className="relative flex-1 w-full bg-slate-50 overflow-hidden flex flex-col">
            {/* Mobile Header Bar */}
            <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 px-4 py-2.5 text-white flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center p-0.5 shadow-sm">
                  <MomoMascot size={22} isWaving={true} />
                </div>
                <div className="text-left leading-none">
                  <span className="text-[11px] font-extrabold tracking-wide uppercase">Happy Moments</span>
                  <p className="text-[9px] text-orange-100 font-medium">Partner Portal</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full font-bold">
                  {activeScene.title.split('.')[0]}
                </span>
              </div>
            </div>

            {/* SCENE 1: Vendor Login with Credentials */}
            {activeSceneIndex === 0 && (
              <div className="flex-1 p-4 flex flex-col justify-center animate-in fade-in zoom-in-95 duration-300">
                <div className="bg-white rounded-2xl border-2 border-orange-200/80 p-4 shadow-lg text-left">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                      <LogIn className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Partner Login</h4>
                      <p className="text-[10px] text-slate-500">Sign in with verified credentials</p>
                    </div>
                  </div>

                  {/* Phone Input */}
                  <div className="space-y-1 mb-2.5">
                    <label className="text-[10px] font-bold text-slate-700">Phone Number / Username</label>
                    <div className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-medium text-slate-900 flex items-center justify-between">
                      <span>{typedPhone || <span className="text-slate-400">Enter phone number...</span>}</span>
                      <span className="w-1.5 h-3 bg-orange-500 animate-pulse" />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-1 mb-3.5">
                    <label className="text-[10px] font-bold text-slate-700">Password</label>
                    <div className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-medium text-slate-900">
                      {typedPass || <span className="text-slate-400">Enter password...</span>}
                    </div>
                  </div>

                  {/* Sign In Button with simulated click */}
                  <button
                    className={`w-full py-2 rounded-xl text-xs font-bold text-white transition-all shadow-md flex items-center justify-center gap-1.5 ${
                      isLoginVerified
                        ? 'bg-emerald-600 scale-98 shadow-emerald-500/30'
                        : 'bg-gradient-to-r from-orange-500 to-amber-600'
                    }`}
                  >
                    {isLoginVerified ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verified! Logging In...</span>
                      </>
                    ) : (
                      <>
                        <LogIn className="w-3.5 h-3.5" />
                        <span>Sign In to Portal</span>
                      </>
                    )}
                  </button>

                  {/* Credentials helper banner */}
                  <div className="mt-3 p-2 bg-amber-50 rounded-lg border border-amber-200 text-[10px] text-amber-900 flex items-start gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <span>Credentials dispatched via official WhatsApp during onboarding.</span>
                  </div>
                </div>
              </div>
            )}

            {/* SCENE 2: Vendor Dashboard Home */}
            {activeSceneIndex === 1 && (
              <div className="flex-1 p-3 overflow-y-auto space-y-2.5 animate-in fade-in slide-in-from-right-3 duration-300 text-left">
                {/* Welcome Card */}
                <div className="bg-gradient-to-r from-orange-500 to-amber-600 rounded-2xl p-3 text-white shadow-md">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded-full font-bold uppercase">
                      Live Dashboard
                    </span>
                    <span className="text-[9px] text-orange-100">Verified Partner</span>
                  </div>
                  <h4 className="text-sm font-extrabold">The Film Frames</h4>
                  <p className="text-[10px] text-orange-100">Photography & Videography • Hyderabad</p>
                </div>

                {/* KPI Cards Grid */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                      <span className="text-[10px] font-bold">New Leads</span>
                      <Bell className="w-3 h-3 text-orange-500" />
                    </div>
                    <span className="text-base font-extrabold text-slate-900">12</span>
                    <span className="text-[9px] text-emerald-600 font-semibold block">+4 this week</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                      <span className="text-[10px] font-bold">Profile Views</span>
                      <Eye className="w-3 h-3 text-blue-500" />
                    </div>
                    <span className="text-base font-extrabold text-slate-900">450+</span>
                    <span className="text-[9px] text-blue-600 font-semibold block">High intent</span>
                  </div>
                </div>

                {/* Recent High-Priority Lead Alert */}
                <div className="bg-orange-50 rounded-xl p-2.5 border border-orange-200 shadow-sm flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[9px] font-bold text-orange-700 uppercase tracking-wide">
                      🔥 Urgent Lead
                    </span>
                    <p className="text-[11px] font-bold text-slate-900">Wedding at Taj Falaknuma</p>
                    <p className="text-[9px] text-slate-500">Dec 2026 • 2-Day Shoot</p>
                  </div>
                  <button className="bg-orange-500 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg shadow-sm">
                    View
                  </button>
                </div>
              </div>
            )}

            {/* SCENE 3: Portfolio & Packages Setup */}
            {activeSceneIndex === 2 && (
              <div className="flex-1 p-3 overflow-y-auto space-y-2.5 animate-in fade-in slide-in-from-right-3 duration-300 text-left">
                <div className="flex items-center justify-between border-b pb-1.5">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-purple-600" />
                    Portfolio & Packages
                  </h4>
                  <span className="text-[10px] text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded-md">
                    + Add New
                  </span>
                </div>

                {/* Portfolio Visual Showcase */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative aspect-video rounded-xl bg-gradient-to-tr from-purple-200 to-indigo-100 overflow-hidden border border-purple-200 flex items-center justify-center shadow-sm">
                    <span className="text-[10px] font-bold text-purple-900">Wedding Teaser 4K</span>
                    <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[8px] px-1 rounded">HD</span>
                  </div>
                  <div className="relative aspect-video rounded-xl bg-gradient-to-tr from-amber-200 to-orange-100 overflow-hidden border border-amber-200 flex items-center justify-center shadow-sm">
                    <span className="text-[10px] font-bold text-amber-900">Candid Album</span>
                    <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[8px] px-1 rounded">50+ Photos</span>
                  </div>
                </div>

                {/* Package Rates Card */}
                <div className="bg-white rounded-xl p-2.5 border border-slate-200 shadow-sm space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-900">Cinematic Wedding Package</span>
                    <span className="text-[11px] font-extrabold text-orange-600">₹35,000</span>
                  </div>
                  <p className="text-[9px] text-slate-500 leading-tight">
                    Includes 2 Candid Photographers, 1 Drone Pilot, 4K Highlights Video & 200 Edited Stills.
                  </p>
                </div>
              </div>
            )}

            {/* SCENE 4: Direct WhatsApp Connect */}
            {activeSceneIndex === 3 && (
              <div className="flex-1 p-3 overflow-y-auto space-y-2.5 animate-in fade-in slide-in-from-right-3 duration-300 text-left">
                <div className="flex items-center justify-between border-b pb-1.5">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    Incoming Client Leads
                  </h4>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                    Active Leads
                  </span>
                </div>

                {/* Lead Card with WhatsApp Button */}
                <div className="bg-white rounded-2xl p-3 border-2 border-emerald-200 shadow-md space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-extrabold text-slate-900">Priya & Rahul</h5>
                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      ₹1,20,000 Budget
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-600">
                    Location: <strong className="text-slate-900">Hyderabad (Novotel)</strong> • Date: Dec 2026
                  </p>
                  <div className="p-2 bg-emerald-50/70 rounded-xl border border-emerald-100 text-[10px] text-emerald-950 font-medium leading-snug">
                    “Looking for high quality cinematic wedding photography and drone teaser for 2 days.”
                  </div>

                  {/* Direct WhatsApp Call-To-Action */}
                  <div className="flex items-center gap-2 pt-1">
                    <button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold py-1.5 rounded-xl shadow-md flex items-center justify-center gap-1.5">
                      <MessageCircle className="w-3.5 h-3.5 fill-current" />
                      <span>Chat on WhatsApp</span>
                    </button>
                    <button className="px-2.5 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-[10px] font-bold">
                      Call
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SCENE 5: Invoices & Quotations */}
            {activeSceneIndex === 4 && (
              <div className="flex-1 p-3 overflow-y-auto space-y-2.5 animate-in fade-in slide-in-from-right-3 duration-300 text-left">
                <div className="flex items-center justify-between border-b pb-1.5">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-rose-600" />
                    Quotations & Invoicing
                  </h4>
                  <span className="text-[10px] bg-rose-50 text-rose-700 px-2 py-0.5 rounded font-bold">
                    Generate PDF
                  </span>
                </div>

                {/* Digital Estimate Preview */}
                <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 border-b pb-1">
                    <span>Quotation #HM-QT-2026-081</span>
                    <span className="text-emerald-600 font-bold">Ready to Send</span>
                  </div>

                  <div className="space-y-1 text-[10px]">
                    <div className="flex justify-between font-medium">
                      <span>Candid Photo & Cinema</span>
                      <span className="font-bold">₹50,000</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Drone Coverage & Teaser</span>
                      <span className="font-bold">₹15,000</span>
                    </div>
                    <div className="flex justify-between font-extrabold text-xs text-slate-900 pt-1 border-t">
                      <span>Total Quotation</span>
                      <span className="text-orange-600">₹65,000</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 pt-1">
                    <button className="flex-1 bg-slate-900 text-white text-[10px] font-bold py-1.5 rounded-lg flex items-center justify-center gap-1">
                      <Download className="w-3 h-3" />
                      <span>Download PDF</span>
                    </button>
                    <button className="flex-1 bg-orange-500 text-white text-[10px] font-bold py-1.5 rounded-lg flex items-center justify-center gap-1">
                      <Share2 className="w-3 h-3" />
                      <span>Send to Client</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SCENE 6: Momo Partner Assistant */}
            {activeSceneIndex === 5 && (
              <div className="flex-1 p-3 flex flex-col justify-center animate-in fade-in slide-in-from-right-3 duration-300 text-left">
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-3.5 border-2 border-orange-200 shadow-lg text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-white mx-auto shadow-md border-2 border-orange-200 overflow-hidden flex items-center justify-center">
                    <MomoMascot size={42} isWaving={true} />
                  </div>
                  <h4 className="text-xs font-extrabold text-slate-900">Momo Partner Co-Pilot</h4>
                  <p className="text-[10px] text-slate-600 leading-snug">
                    “Vendors who reply within 15 minutes convert 3x more bookings! Update your availability calendar for December.”
                  </p>
                  <div className="inline-flex items-center gap-1 bg-white px-3 py-1 rounded-full text-[10px] font-bold text-orange-700 shadow-sm border border-orange-200">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                    <span>Target: 5.0 Star Partner Badge</span>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Closed Captions Bar */}
            {showCaptions && (
              <div className="bg-slate-950/90 backdrop-blur-md px-3 py-2 text-center text-white border-t border-slate-800 transition-all">
                <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block mb-0.5">
                  [Closed Captions]
                </span>
                <p className="text-[11px] font-semibold text-slate-100 leading-tight">
                  {activeScene.caption}
                </p>
              </div>
            )}

            {/* Bottom Home Indicator Bar */}
            <div className="py-1 bg-slate-950 flex items-center justify-center">
              <div className="w-24 h-1 bg-white/40 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Modern Player Controls Below Mobile Frame */}
      <div className="w-full max-w-md mt-4 bg-white rounded-2xl p-4 border border-slate-200 shadow-lg space-y-3">
        {/* Timeline Bar */}
        <div className="space-y-1">
          <div
            className="w-full bg-slate-200 h-2.5 rounded-full cursor-pointer overflow-hidden relative"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pos = (e.clientX - rect.left) / rect.width;
              setCurrentTime(pos * TOTAL_DURATION);
              momoSound.playBubblePop(true);
            }}
          >
            <div
              className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 h-full rounded-full transition-all duration-100"
              style={{ width: `${(currentTime / TOTAL_DURATION) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] font-semibold text-slate-500">
            <span>{formatTime(currentTime)}</span>
            <span className="text-orange-600 font-bold">{activeScene.title}</span>
            <span>{formatTime(TOTAL_DURATION)}</span>
          </div>
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            {/* Play/Pause Button */}
            <button
              onClick={togglePlay}
              className="w-9 h-9 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center shadow-md transition-all active:scale-95 cursor-pointer"
              title={isPlaying ? 'Pause' : 'Play Walkthrough'}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>

            {/* -10s Rewind */}
            <button
              onClick={() => {
                setCurrentTime((prev) => Math.max(0, prev - 10));
                momoSound.playBubblePop(true);
              }}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-xs transition-colors cursor-pointer"
              title="Rewind 10s"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* +10s Forward */}
            <button
              onClick={() => {
                setCurrentTime((prev) => Math.min(TOTAL_DURATION, prev + 10));
                momoSound.playBubblePop(true);
              }}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-xs transition-colors cursor-pointer"
              title="Forward 10s"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Captions Toggle */}
            <button
              onClick={() => setShowCaptions(!showCaptions)}
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                showCaptions ? 'bg-orange-100 text-orange-800' : 'bg-slate-100 text-slate-500'
              }`}
              title="Toggle Subtitles / Captions"
            >
              <Subtitles className="w-3.5 h-3.5" />
              <span className="text-[10px]">CC</span>
            </button>

            {/* Voiceover Toggle */}
            <button
              onClick={() => {
                const next = !isVoiceoverOn;
                setIsVoiceoverOn(next);
                if (!next && 'speechSynthesis' in window) window.speechSynthesis.cancel();
              }}
              className={`p-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                isVoiceoverOn ? 'bg-orange-100 text-orange-800' : 'bg-slate-100 text-slate-500'
              }`}
              title="Toggle Audio Voiceover"
            >
              {isVoiceoverOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>

            {/* Speed Selector */}
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 text-xs font-semibold text-slate-700">
              {[1, 1.25, 1.5].map((s) => (
                <button
                  key={s}
                  onClick={() => setPlaybackRate(s)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                    playbackRate === s ? 'bg-white shadow text-orange-600' : 'text-slate-600'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Chapter Pills for Quick Navigation */}
      <div className="w-full max-w-2xl mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
        {SCENES.map((scene, idx) => (
          <button
            key={scene.id}
            onClick={() => jumpToScene(idx)}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
              activeSceneIndex === idx
                ? 'bg-orange-50 border-orange-300 shadow-sm scale-102'
                : 'bg-white border-slate-200 hover:border-orange-200'
            }`}
          >
            <div className="p-1 rounded-lg bg-slate-50 flex-shrink-0">{scene.icon}</div>
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-slate-900 block truncate">{scene.title}</span>
              <span className="text-[9px] text-slate-500">{scene.timeLabel}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default VendorMobileWalkthroughVideo;


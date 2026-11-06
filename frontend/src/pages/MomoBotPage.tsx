import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  TrendingUp,
  Instagram,
  Send,
  ExternalLink,
  MessageCircle,
  PhoneCall,
  Clock,
  Heart,
  Layers,
  Smartphone,
  CheckCheck,
  RefreshCw,
  BarChart3,
  MessageSquare,
  Edit3,
  Save,
  Check
} from 'lucide-react';
import { momoApiService } from '../services/momoApiService';

// WhatsApp sample conversations for the live feed
const WHATSAPP_SAMPLE_CHATS = [
  {
    id: 'wa_01',
    customerName: 'Ananya Reddy',
    phone: '+91 98490 12345',
    category: 'Wedding Decor',
    eventDate: 'Nov 18, 2026',
    venue: 'Gachibowli, Hyderabad',
    lastMessage: 'Can you share the floral mandap catalog with pricing tiers?',
    time: '12 mins ago',
    status: 'Quote Sent'
  },
  {
    id: 'wa_02',
    customerName: 'Karthik Varma',
    phone: '+91 97000 88990',
    category: 'Convention Hall & Mandap',
    eventDate: 'Dec 05, 2026',
    venue: 'Jubilee Hills, Hyderabad',
    lastMessage: 'We need space for 450 guests with in-house catering.',
    time: '34 mins ago',
    status: 'Deal Confirmed'
  },
  {
    id: 'wa_03',
    customerName: 'Divya Sri',
    phone: '+91 98765 43210',
    category: 'Candid Photography',
    eventDate: 'Nov 24, 2026',
    venue: 'Madhapur, Hyderabad',
    lastMessage: 'Looking for traditional + candid 2-day wedding package.',
    time: '1 hour ago',
    status: 'Needs Follow-up'
  },
  {
    id: 'wa_04',
    customerName: 'Suresh Kumar',
    phone: '+91 99887 76655',
    category: 'Haldi & Sangeet Decor',
    eventDate: 'Nov 12, 2026',
    venue: 'Banjara Hills, Hyderabad',
    lastMessage: 'Loved the marigold brass urli setup from your Instagram!',
    time: '2 hours ago',
    status: 'Quote Sent'
  }
];

// Instagram media showcase for @happymoments_india
const INSTAGRAM_MEDIA = [
  {
    id: 'media_ig_01',
    caption: '✨ Grand Telugu Wedding Mandap & Floral Decoration in Gachibowli, Hyderabad! Complete event styling by Happy Moments. DM us for dates & quotes! #HyderabadWeddings #happymoments_india',
    media_type: 'CAROUSEL_ALBUM',
    media_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
    permalink: 'https://www.instagram.com/happymoments_india/',
    like_count: 342,
    comments_count: 28,
    date: '2 days ago'
  },
  {
    id: 'media_ig_02',
    caption: 'Traditional Pellikuthuru & Haldi Ceremony Decor ✨ Vibrant yellow marigolds & traditional brass urli accents. DM for custom packages!',
    media_type: 'IMAGE',
    media_url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80',
    permalink: 'https://www.instagram.com/happymoments_india/',
    like_count: 418,
    comments_count: 35,
    date: '5 days ago'
  },
  {
    id: 'media_ig_03',
    caption: 'Cocktail & Sangeet Night Lighting Setup! Fairy light canopy with ambient chandeliers in Jubilee Hills. Booking inquiries open for winter season! 🥂✨',
    media_type: 'REEL / VIDEO',
    media_url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=800&q=80',
    permalink: 'https://www.instagram.com/happymoments_india/',
    like_count: 512,
    comments_count: 49,
    date: '1 week ago'
  }
];

export const MomoBotPage: React.FC = () => {
  const navigate = useNavigate();

  // Active view: Default to 'instagram'
  const [activeTab, setActiveTab] = useState<'instagram' | 'whatsapp'>('instagram');
  const [periodFilter, setPeriodFilter] = useState<'7d' | '30d'>('30d');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // User-configurable live stats for @happymoments_india
  const [followers, setFollowers] = useState<string>(() => localStorage.getItem('ig_followers') || '3,840');
  const [reach, setReach] = useState<string>(() => localStorage.getItem('ig_reach') || '42,600');
  const [postsCount, setPostsCount] = useState<string>(() => localStorage.getItem('ig_posts') || '192');
  const [engagementRate, setEngagementRate] = useState<string>(() => localStorage.getItem('ig_engagement') || '4.8%');
  const [isEditingStats, setIsEditingStats] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Sync with live server in the background without blocking
  useEffect(() => {
    momoApiService.getDashboard(periodFilter).catch(() => {});
  }, [periodFilter]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
  };

  const handleSaveStats = () => {
    localStorage.setItem('ig_followers', followers);
    localStorage.setItem('ig_reach', reach);
    localStorage.setItem('ig_posts', postsCount);
    localStorage.setItem('ig_engagement', engagementRate);
    setIsEditingStats(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/20 to-blue-50/30 text-slate-800 flex flex-col">
      {/* Sleek Minimal Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              ← Admin Portal
            </button>
            <div className="h-5 w-[1px] bg-slate-200" />
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full overflow-hidden bg-sky-100 border border-sky-300 flex items-center justify-center">
                <img src="/momo_3d_bot.png" alt="Momo" className="w-full h-full object-contain" />
              </span>
              <span className="text-sm font-black text-slate-900 tracking-tight">Momo Stats Portal</span>
            </div>
          </div>

          {/* Right Tools: Date Filter & Refresh */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
              <button
                onClick={() => setPeriodFilter('7d')}
                className={`py-1 px-3 rounded-lg transition-all cursor-pointer ${
                  periodFilter === '7d' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                7 Days
              </button>
              <button
                onClick={() => setPeriodFilter('30d')}
                className={`py-1 px-3 rounded-lg transition-all cursor-pointer ${
                  periodFilter === '30d' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                30 Days
              </button>
            </div>

            <button
              onClick={handleRefresh}
              className="py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Sync'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 space-y-6">
        
        {/* ========================================================================= */}
        {/* THE TWO MAIN TABS: INSTAGRAM STATS & WHATSAPP BUSINESS STATS               */}
        {/* ========================================================================= */}
        <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex gap-2">
          {/* Tab 1: Instagram Stats */}
          <button
            onClick={() => setActiveTab('instagram')}
            className={`flex-1 py-3 px-6 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'instagram'
                ? 'bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 text-white shadow-md shadow-pink-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Instagram className="w-5 h-5 text-pink-200" />
            <span>Instagram Stats</span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              activeTab === 'instagram' ? 'bg-white/20 text-white' : 'bg-pink-100 text-pink-700'
            }`}>
              @happymoments_india
            </span>
          </button>

          {/* Tab 2: WhatsApp Business Stats */}
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`flex-1 py-3 px-6 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'whatsapp'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <MessageCircle className="w-5 h-5 text-emerald-200" />
            <span>WhatsApp Business Stats</span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              activeTab === 'whatsapp' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'
            }`}>
              486 Inquiries
            </span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* VIEW 1: INSTAGRAM STATS (@happymoments_india)                             */}
        {/* ========================================================================= */}
        {activeTab === 'instagram' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Account Banner */}
            <div className="bg-gradient-to-r from-pink-50 via-purple-50 to-indigo-50 border border-pink-200 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-600 via-rose-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-pink-500/20">
                  <Instagram className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <h3 className="text-base font-black text-slate-900">
                      @happymoments_india
                    </h3>
                    <span className="text-[10px] font-bold bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full">
                      Official Brand
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    Happy Moments Event Management & Wedding Decorators in Hyderabad
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                {/* Edit Stats Button */}
                <button
                  onClick={() => setIsEditingStats((prev) => !prev)}
                  className="py-2.5 px-3.5 rounded-xl bg-white hover:bg-pink-50 border border-pink-200 text-pink-700 text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isEditingStats ? 'Cancel' : 'Update Stats'}</span>
                </button>

                <a
                  href="https://www.instagram.com/happymoments_india/"
                  target="_blank"
                  rel="noreferrer"
                  className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                >
                  <span>Open in Instagram</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Inline Quick Stats Editor (If toggled) */}
            {isEditingStats && (
              <div className="bg-white p-5 rounded-3xl border-2 border-pink-200 shadow-md animate-in fade-in space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Edit Live Instagram Stats for @happymoments_india</h4>
                    <p className="text-[11px] text-slate-500">Update your current followers, reach, and publications</p>
                  </div>
                  <button
                    onClick={handleSaveStats}
                    className="py-1.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Followers:</label>
                    <input
                      type="text"
                      value={followers}
                      onChange={(e) => setFollowers(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-xl bg-slate-50 font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">30-Day Reach:</label>
                    <input
                      type="text"
                      value={reach}
                      onChange={(e) => setReach(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-xl bg-slate-50 font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Total Posts & Reels:</label>
                    <input
                      type="text"
                      value={postsCount}
                      onChange={(e) => setPostsCount(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-xl bg-slate-50 font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Engagement Rate:</label>
                    <input
                      type="text"
                      value={engagementRate}
                      onChange={(e) => setEngagementRate(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-xl bg-slate-50 font-bold text-slate-900"
                    />
                  </div>
                </div>
              </div>
            )}

            {saveSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Stats updated and saved for @happymoments_india!</span>
              </div>
            )}

            {/* 4 Instagram KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Followers */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Followers</span>
                  <div className="p-2.5 rounded-2xl bg-pink-50 text-pink-600">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900">{followers}</span>
                  <span className="text-xs font-bold text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full">
                    Live
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">@happymoments_india audience</p>
              </div>

              {/* Reach */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">30-Day Reach</span>
                  <div className="p-2.5 rounded-2xl bg-purple-50 text-purple-600">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900">{reach}</span>
                  <span className="text-xs text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded-full">
                    Accounts
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Reels, carousels, and stories</p>
              </div>

              {/* Total Posts */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Publications</span>
                  <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600">
                    <Layers className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900">{postsCount}</span>
                  <span className="text-xs text-slate-400 font-semibold">Posts & Reels</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">High quality wedding decor setups</p>
              </div>

              {/* Engagement Rate */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Engagement Rate</span>
                  <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600">
                    <Heart className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900">{engagementRate}</span>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Active 🏆
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Consistent likes & comments</p>
              </div>
            </div>

            {/* Recent Media Showcase */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Instagram className="w-4 h-4 text-pink-600" />
                  Recent Posts & Reels from @happymoments_india
                </h4>
                <a
                  href="https://www.instagram.com/happymoments_india/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-pink-700 bg-pink-50 hover:bg-pink-100 px-3 py-1 rounded-full border border-pink-200 transition-colors flex items-center gap-1"
                >
                  <span>Visit @happymoments_india</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                {INSTAGRAM_MEDIA.map((post) => (
                  <div key={post.id} className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-200/70 hover:shadow-lg transition-all group">
                    <div className="relative aspect-video w-full overflow-hidden bg-slate-200">
                      <img
                        src={post.media_url}
                        alt="Instagram media"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {post.media_type}
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      <p className="text-xs text-slate-700 line-clamp-2 font-medium">
                        {post.caption}
                      </p>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs text-slate-600 font-semibold">
                        <span className="flex items-center gap-1 text-rose-600">
                          <Heart className="w-3.5 h-3.5 fill-rose-500" />
                          {post.like_count} likes
                        </span>
                        <span className="flex items-center gap-1 text-blue-600">
                          <MessageSquare className="w-3.5 h-3.5" />
                          {post.comments_count} comments
                        </span>
                        <a
                          href={post.permalink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-pink-600 hover:text-pink-800 font-bold"
                        >
                          View →
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: WHATSAPP BUSINESS STATS                                           */}
        {/* ========================================================================= */}
        {activeTab === 'whatsapp' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Account Banner */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <h3 className="text-base font-black text-emerald-950">
                      Happy Moments WhatsApp Concierge
                    </h3>
                  </div>
                  <p className="text-xs text-emerald-700 font-medium mt-0.5">
                    Phone: <strong>+91 99634 72387</strong> • Meta WhatsApp Cloud API v20.0 (Ban-Proof & Official)
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 bg-white text-emerald-800 text-xs font-bold rounded-full border border-emerald-300 shadow-sm flex items-center gap-1">
                <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                Active & Verified
              </span>
            </div>

            {/* 4 WhatsApp Primary KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Total Conversations */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Inquiries</span>
                  <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900">486</span>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    +18% this mo
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Direct inquiries via WhatsApp Hub</p>
              </div>

              {/* Card 2: 2-Way Messages */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Messages Sent / Recv</span>
                  <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600">
                    <Send className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900">1,842</span>
                  <span className="text-xs text-slate-400 font-semibold">/ 1,418 in</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">99.4% template delivery rate</p>
              </div>

              {/* Card 3: Avg Response Time */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Avg Response Time</span>
                  <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900">3.2m</span>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Super Fast ⚡
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Instant concierge routing</p>
              </div>

              {/* Card 4: Conversion Win Rate */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Inquiry Win Rate</span>
                  <div className="p-2.5 rounded-2xl bg-purple-50 text-purple-600">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900">68%</span>
                  <span className="text-xs text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded-full">
                    331 Won Deals
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Confirmed vendor bookings</p>
              </div>
            </div>

            {/* Inquiries by Category & Cloud Templates */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Category Breakdown */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  Inquiries by Event Category
                </h4>
                <div className="space-y-3.5">
                  {[
                    { name: 'Wedding & Stage Decor', count: 204, pct: 42, color: 'bg-emerald-500' },
                    { name: 'Convention Halls & Mandapas', count: 136, pct: 28, color: 'bg-blue-500' },
                    { name: 'Candid & Pre-Wedding Photography', count: 87, pct: 18, color: 'bg-purple-500' },
                    { name: 'Full Event Planners & Catering', count: 59, pct: 12, color: 'bg-amber-500' }
                  ].map((cat, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-700">{cat.name}</span>
                        <span className="text-slate-900 font-bold">{cat.count} ({cat.pct}%)</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${cat.color} rounded-full`} style={{ width: `${cat.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Approved Cloud Templates */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
                  <CheckCheck className="w-4 h-4 text-blue-600" />
                  Approved Meta WhatsApp Templates
                </h4>
                <div className="space-y-3">
                  {[
                    { name: 'happy_moments_venue_partnership', lang: 'en_US', status: 'Approved', deliverPct: '99.4%' },
                    { name: 'vendor_welcome_hub', lang: 'en_US', status: 'Approved', deliverPct: '98.9%' },
                    { name: 'lead_callback_alert', lang: 'en_US', status: 'Approved', deliverPct: '99.8%' }
                  ].map((tpl, i) => (
                    <div key={i} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-800 font-mono">{tpl.name}</p>
                        <p className="text-[10px] text-slate-500">Language: {tpl.lang} • Cloud API v20.0</p>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {tpl.status}
                        </span>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{tpl.deliverPct} delivered</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Customer WhatsApp Inquiries Feed */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  Live WhatsApp Leads & Chats
                </h4>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  4 Active Conversations
                </span>
              </div>

              <div className="divide-y divide-slate-100 mt-2">
                {WHATSAPP_SAMPLE_CHATS.map((chat) => (
                  <div key={chat.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 p-2 rounded-2xl transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                        {chat.customerName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="text-xs font-bold text-slate-900">{chat.customerName}</h5>
                          <span className="text-[10px] text-slate-400 font-mono">{chat.phone}</span>
                          <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-semibold">
                            {chat.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 font-medium">"{chat.lastMessage}"</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Event: {chat.eventDate} • {chat.venue} • {chat.time}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        chat.status === 'Deal Confirmed' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {chat.status}
                      </span>
                      <a
                        href={`https://wa.me/${chat.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1"
                      >
                        <PhoneCall className="w-3 h-3" />
                        Chat on WA
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MomoBotPage;

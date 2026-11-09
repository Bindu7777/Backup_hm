import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  RotateCcw,
  CheckCircle2,
  ExternalLink,
  Shield,
  Layers,
  Database,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  KeyRound,
  ClipboardList
} from 'lucide-react';
import { MomoAdminCatMascot } from '../momo/MomoAdminCatMascot';
import { Vendor } from '@/lib/supabase';
import { getAdminCatResponse, AdminCatAction, PLATFORM_STATS } from '@/services/adminMomoCatService';

export interface AdminMomoChatProps {
  vendors?: Vendor[];
  onNavigateTab?: (tab: string) => void;
  onFilterChange?: (filterType: string) => void;
}

interface ChatMessage {
  id: string;
  role: 'cat' | 'user';
  content: string;
  timestamp: Date;
  actions?: AdminCatAction[];
}

export const AdminMomoChat: React.FC<AdminMomoChatProps> = ({
  vendors = [],
  onNavigateTab,
  onFilterChange
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      role: 'cat',
      content: `### 🐱 Purr-fect! Welcome to Momo Admin Cat!
I am your dedicated **Executive AI Co-Pilot** for Happy Moments platform administration.

I have complete, real-time knowledge of all **${vendors.length || PLATFORM_STATS.totalVendors} vendors**, database records, onboarding applications, credentials, and our **9 reliable verified partners**.

**Quick Platform Snapshot:**
- 🏷️ **Total Vendors:** ${vendors.length || PLATFORM_STATS.totalVendors}
- 🌟 **Reliable Onboarded Partners:** 9 Active Approved Vendors
- 🔑 **Active Credentials:** Passwords & usernames live in database
- 🟢 **Verified Vendors:** 913 (904 Sample + 9 Real Verified Partners)

How can I assist you today? Click any quick question below or ask me about any vendor or category!`,
      timestamp: new Date(),
      actions: [
        { label: '⭐ Reliable Vendors (Category-wise)', actionType: 'custom', payload: 'all_reliable' },
        { label: '📸 Photographers', actionType: 'custom', payload: 'photography' },
        { label: '🎪 Event Planners', actionType: 'custom', payload: 'planner' },
        { label: '🌸 Decor & DJ', actionType: 'custom', payload: 'decor' },
        { label: '💄 Bridal Makeup', actionType: 'custom', payload: 'makeup' },
        { label: '🎁 Return Favours', actionType: 'custom', payload: 'gifting' },
        { label: '🔑 Credentials Manager', tab: 'credentials', actionType: 'switch_tab' }
      ]
    }
  ]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isTyping) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate smart thinking delay
    setTimeout(async () => {
      try {
        const response = await getAdminCatResponse(query, vendors);
        const catMsg: ChatMessage = {
          id: `cat_${Date.now()}`,
          role: 'cat',
          content: response.content,
          timestamp: new Date(),
          actions: response.actions
        };
        setMessages((prev) => [...prev, catMsg]);
      } catch (err) {
        console.error('Admin cat query error:', err);
        setMessages((prev) => [
          ...prev,
          {
            id: `cat_err_${Date.now()}`,
            role: 'cat',
            content: 'I encountered a brief hiccup fetching that administrative record. Please try again or rephrase!',
            timestamp: new Date()
          }
        ]);
      } finally {
        setIsTyping(false);
      }
    }, 450);
  };

  const handleActionClick = (action: AdminCatAction) => {
    if (action.actionType === 'open_url' && action.payload) {
      window.open(action.payload, '_blank');
    } else if (action.actionType === 'custom' && action.payload) {
      if (action.payload === 'photography') {
        handleSendMessage('Give me reliable photography and film vendors');
      } else if (action.payload === 'planner') {
        handleSendMessage('Give me reliable luxury event planners and destination wedding organizers');
      } else if (action.payload === 'decor') {
        handleSendMessage('Give me reliable stage decorators, lighting, DJ and sound vendors');
      } else if (action.payload === 'makeup') {
        handleSendMessage('Give me reliable bridal makeup and hair styling artists');
      } else if (action.payload === 'gifting') {
        handleSendMessage('Give me reliable custom gifting and return favour vendors');
      } else {
        handleSendMessage('Give me the list of reliable vendors category wise with full contact details');
      }
    } else if (action.actionType === 'filter_real') {
      if (onFilterChange) onFilterChange('real');
      if (onNavigateTab) onNavigateTab('vendors');
    } else if (action.tab && onNavigateTab) {
      onNavigateTab(action.tab);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `welcome_${Date.now()}`,
        role: 'cat',
        content: `### 🐱 Momo Admin Cat ready for new tasks!
Ask me anything about your reliable vendors, applications, credentials, or operations.`,
        timestamp: new Date(),
        actions: [
          { label: '⭐ Reliable Vendors (Category-wise)', actionType: 'custom', payload: 'all_reliable' },
          { label: '📸 Photographers', actionType: 'custom', payload: 'photography' },
          { label: '🎪 Event Planners', actionType: 'custom', payload: 'planner' },
          { label: '🌸 Decor & DJ', actionType: 'custom', payload: 'decor' },
          { label: '💄 Bridal Makeup', actionType: 'custom', payload: 'makeup' },
          { label: '🎁 Return Favours', actionType: 'custom', payload: 'gifting' }
        ]
      }
    ]);
  };

  const QUICK_QUESTIONS = [
    { label: '⭐ Reliable Vendors (Category-wise)', text: 'Give me the list of reliable vendors who just onboarded category wise with full contact details.' },
    { label: '📸 Reliable Photographers', text: 'Who are our reliable photography and film vendors?' },
    { label: '🎪 Reliable Event Planners', text: 'Who are our reliable luxury event planning and destination wedding organizers?' },
    { label: '🌸 Reliable Decor & DJ', text: 'Who are our reliable stage decoration, lighting, and sound/DJ vendors?' },
    { label: '💄 Reliable Makeup Artists', text: 'Who are our reliable bridal makeup and hair styling artists?' },
    { label: '🎁 Reliable Return Gifts', text: 'Who are our reliable custom gifting and return favour vendors?' },
    { label: '🔑 Vendor Credentials', text: 'How do I view and manage login credentials for our onboarded vendors?' },
    { label: '📋 Pending Applications', text: 'Who are the vendor applications and what is their status?' },
    { label: '📥 Excel Export', text: 'How do I filter and export real vendors to Excel?' }
  ];

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 via-indigo-50/20 to-sky-50/30 rounded-3xl border-2 border-indigo-100 shadow-xl overflow-hidden">
      {/* Executive Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white flex items-center justify-between shadow-md border-b border-indigo-800">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-amber-500/20 p-1 border border-indigo-400/40 shadow-inner flex items-center justify-center shrink-0">
            <MomoAdminCatMascot size={42} isWaving={true} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                Momo Admin Cat
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 shadow-sm">
                  Executive AI
                </span>
              </h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                Live Co-Pilot
              </span>
            </div>
            <p className="text-xs text-indigo-200/90 font-medium">
              Full Platform Intelligence • Applications, Credentials & Operations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleClearChat}
            className="p-2 rounded-xl text-indigo-200 hover:text-white hover:bg-white/10 transition-colors text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            title="Reset conversation"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Clear Chat</span>
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 sm:gap-4 ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {/* Cat Avatar for Bot */}
            {msg.role === 'cat' && (
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 border border-indigo-200 p-0.5 shadow-sm shrink-0 flex items-center justify-center self-start">
                <MomoAdminCatMascot size={34} isWaving={false} />
              </div>
            )}

            {/* Message Bubble */}
            <div
              className={`max-w-[85%] sm:max-w-[78%] rounded-3xl p-5 shadow-sm transition-all ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-tr-none shadow-indigo-500/10'
                  : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none shadow-sm'
              }`}
            >
              {/* Message Content with Markdown Parsing */}
              <div className="text-sm leading-relaxed space-y-2 whitespace-pre-wrap font-sans">
                {msg.content}
              </div>

              {/* Action Buttons if Present */}
              {msg.actions && msg.actions.length > 0 && (
                <div className="mt-4 pt-3 border-t border-indigo-50 flex flex-wrap gap-2">
                  {msg.actions.map((act, i) => (
                    <button
                      key={i}
                      onClick={() => handleActionClick(act)}
                      className="text-xs font-bold py-2 px-3.5 rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 text-indigo-800 border border-indigo-200/80 shadow-xs flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                    >
                      <span>{act.label}</span>
                      <ArrowRight className="w-3 h-3 text-indigo-600" />
                    </button>
                  ))}
                </div>
              )}

              <div
                className={`text-[10px] mt-2 font-medium ${
                  msg.role === 'user' ? 'text-indigo-200 text-right' : 'text-slate-400'
                }`}
              >
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            {/* User Avatar */}
            {msg.role === 'user' && (
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white shadow-sm shrink-0 flex items-center justify-center self-start font-black text-xs">
                Admin
              </div>
            )}
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex gap-3 items-center text-slate-500 animate-pulse pl-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 p-0.5 shrink-0 flex items-center justify-center">
              <MomoAdminCatMascot size={26} isWaving={true} />
            </div>
            <div className="bg-white py-2.5 px-4 rounded-2xl border border-indigo-100 shadow-xs text-xs font-semibold text-indigo-700 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 animate-spin text-amber-500" />
              Momo Cat is analyzing platform intelligence...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions Pills */}
      <div className="px-4 sm:px-6 pt-2 pb-1 bg-white/70 border-t border-indigo-100">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span>Quick Admin Inquiries:</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {QUICK_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q.text)}
              className="text-xs font-semibold py-1.5 px-3 rounded-full bg-indigo-50/80 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/60 whitespace-nowrap transition-colors cursor-pointer shrink-0 active:scale-95"
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input Bar */}
      <div className="p-4 sm:p-5 bg-white border-t border-indigo-100">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2 sm:gap-3"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Momo Cat anything about vendors, credentials, applications, or Excel..."
              className="w-full py-3.5 pl-4 pr-10 rounded-2xl border-2 border-indigo-100 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 text-sm font-medium text-slate-900 placeholder:text-slate-400 bg-slate-50/60"
            />
          </div>

          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className={`py-3.5 px-6 rounded-2xl font-bold text-sm shadow-md transition-all flex items-center gap-2 shrink-0 ${
              !input.trim() || isTyping
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-700 hover:to-blue-700 text-white shadow-indigo-500/25 hover:scale-105 active:scale-95 cursor-pointer'
            }`}
          >
            <span>Ask Cat</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminMomoChat;


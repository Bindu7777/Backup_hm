import React from 'react';
import { Bot, RefreshCw, Settings, Lock, Instagram, Globe, BookOpen, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import { MomoDashboardData } from '../../services/momoApiService';

interface MomoHeaderProps {
  data: MomoDashboardData;
  isRefreshing: boolean;
  refreshProgress?: number;
  refreshStep?: string;
  onRefresh: () => void;
  onOpenSettings: () => void;
  onOpenKnowledgeBase: () => void;
  onLock: () => void;
}

export const MomoHeader: React.FC<MomoHeaderProps> = ({
  data,
  isRefreshing,
  refreshProgress = 0,
  refreshStep = '',
  onRefresh,
  onOpenSettings,
  onOpenKnowledgeBase,
  onLock
}) => {
  const meta = data.integrations.meta_instagram;
  const ga = data.integrations.google_analytics;
  const isMetaConnected = meta.status === 'connected';
  const isGaConnected = ga.status === 'connected';

  // Last sync formatted
  const lastSyncText = meta.lastSyncAt
    ? new Date(meta.lastSyncAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })
    : 'Never synced';

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-blue-100 sticky top-0 z-30 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Left: Mascot & Sleek Momo Brand */}
          <div className="flex items-center gap-3">
            <div className="relative group cursor-pointer">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 p-0.5 shadow-md shadow-blue-500/20 overflow-hidden border border-blue-200">
                <img
                  src="/momo-avatar.png"
                  alt="Momo Mascot"
                  className="w-full h-full object-cover transform hover:scale-105 transition-transform"
                />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white shadow-sm" title="Momo Active" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-slate-800 tracking-tight">Momo</span>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Refresh Analysis Primary Button */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="py-2 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              title="Refresh analysis across Instagram, inquiries, and run AI synthesis"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? `Analyzing (${refreshProgress}%)` : 'Refresh Instagram Analysis'}</span>
            </button>

            {/* Knowledge Base */}
            <button
              onClick={onOpenKnowledgeBase}
              className="p-2 rounded-xl text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 transition-colors cursor-pointer"
              title="Business Knowledge Base"
            >
              <BookOpen className="w-4 h-4" />
            </button>

            {/* Settings */}
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-xl text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 transition-colors cursor-pointer"
              title="Integration Settings & Setup Checklist"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Lock Momo */}
            <button
              onClick={onLock}
              className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors cursor-pointer"
              title="Lock Momo Session"
            >
              <Lock className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Refresh progress bar if running */}
        {isRefreshing && (
          <div className="mt-3 pt-2 border-t border-blue-100">
            <div className="flex items-center justify-between text-[11px] text-blue-700 mb-1">
              <span className="font-medium animate-pulse">{refreshStep || 'Processing background analysis...'}</span>
              <span>{refreshProgress}%</span>
            </div>
            <div className="w-full bg-blue-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-600 to-sky-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${refreshProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default MomoHeader;

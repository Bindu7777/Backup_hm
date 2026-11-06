import React, { useState } from 'react';
import {
  Settings,
  Instagram,
  Globe,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  LogOut,
  X,
  Copy,
  Check,
  Key,
  Radio,
  Sparkles
} from 'lucide-react';
import { momoApiService, MomoDashboardData } from '../../services/momoApiService';

interface MomoIntegrationSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  data: MomoDashboardData;
  onReloadDashboard: () => void;
}

export const MomoIntegrationSettings: React.FC<MomoIntegrationSettingsProps> = ({
  isOpen,
  onClose,
  data,
  onReloadDashboard
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isConnectingMeta, setIsConnectingMeta] = useState(false);
  const [isDisconnectingMeta, setIsDisconnectingMeta] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [isConnectingDirect, setIsConnectingDirect] = useState(false);
  const [showTokenInput, setShowTokenInput] = useState(false);

  const meta = data.integrations.meta_instagram;
  const ga = data.integrations.google_analytics;

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleConnectMeta = async () => {
    setIsConnectingMeta(true);
    try {
      const res = await momoApiService.connectMeta(window.location.href);
      if (res.authUrl) {
        window.location.href = res.authUrl;
      } else {
        // Fallback to direct connection for @happymoments_india
        await handleConnectDirect();
      }
    } catch (err: any) {
      alert(`Meta connect error: ${err.message}`);
    } finally {
      setIsConnectingMeta(false);
    }
  };

  const handleConnectDirect = async () => {
    setIsConnectingDirect(true);
    try {
      await momoApiService.connectInstagramDirect({
        accessToken: manualToken.trim() || undefined,
        username: 'happymoments_india',
        profileUrl: 'https://www.instagram.com/happymoments_india/'
      });
      await onReloadDashboard();
      setManualToken('');
      setShowTokenInput(false);
    } catch (err: any) {
      alert(`Connect error: ${err.message}`);
    } finally {
      setIsConnectingDirect(false);
    }
  };

  const handleDisconnectMeta = async () => {
    if (!confirm('Are you sure you want to disconnect Meta Instagram? Stored access tokens will be revoked.')) return;
    setIsDisconnectingMeta(true);
    try {
      await momoApiService.disconnectMeta();
      await onReloadDashboard();
    } catch (err: any) {
      alert(`Error disconnecting: ${err.message}`);
    } finally {
      setIsDisconnectingMeta(false);
    }
  };

  if (!isOpen) return null;

  const currentOrigin = window.location.origin;
  const webhookUrl = `${currentOrigin}/api/momo/webhooks/meta`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-blue-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-md">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                <span>Integration Settings & Accounts</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-100 border border-blue-300/30 font-medium">
                  Official Meta Graph API
                </span>
              </h3>
              <p className="text-xs text-blue-100 mt-0.5">
                Official Instagram Business integration for Happy Moments India & Analytics Configuration
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-8 text-xs">
          {/* Section 1: Meta Instagram Integration */}
          <div className="p-5 bg-gradient-to-br from-blue-50/50 to-white rounded-2xl border-2 border-blue-200/80 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                  <Instagram className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-slate-900">Instagram Business Account</h4>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                        meta.status === 'connected'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {meta.status === 'connected' ? 'Connected' : 'Action Required'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <a
                      href="https://www.instagram.com/happymoments_india/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1 hover:underline"
                    >
                      <span>@happymoments_india</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <span className="text-slate-300">•</span>
                    <span className="text-[11px] text-slate-500">Official Brand Channel</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {meta.status === 'connected' ? (
                  <>
                    <button
                      onClick={handleConnectDirect}
                      disabled={isConnectingDirect}
                      className="py-1.5 px-3.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl font-semibold cursor-pointer transition-all flex items-center gap-1.5"
                      title="Sync live Instagram profile & metrics"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isConnectingDirect ? 'animate-spin' : ''}`} />
                      <span>{isConnectingDirect ? 'Syncing...' : 'Sync Now'}</span>
                    </button>
                    <button
                      onClick={handleDisconnectMeta}
                      disabled={isDisconnectingMeta}
                      className="py-1.5 px-3 bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-slate-200 rounded-xl font-medium cursor-pointer transition-all"
                    >
                      {isDisconnectingMeta ? 'Disconnecting...' : 'Disconnect'}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleConnectDirect}
                    disabled={isConnectingDirect}
                    className="py-2 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 cursor-pointer flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isConnectingDirect ? 'Connecting...' : 'Connect @happymoments_india'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Direct Connect / Access Token Input Panel */}
            <div className="bg-white p-4 rounded-xl border border-blue-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-blue-600" />
                  Meta Access Token & Authentication
                </span>
                <button
                  onClick={() => setShowTokenInput(!showTokenInput)}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                >
                  {showTokenInput ? 'Hide Token Input' : '+ Paste Meta Graph Page Access Token'}
                </button>
              </div>

              {showTokenInput && (
                <div className="pt-2 space-y-2 border-t border-slate-100 animate-fade-in">
                  <p className="text-[11px] text-slate-600">
                    If you have generated a Meta System User Token or Page Access Token with <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-700">instagram_manage_messages</code> and <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-700">pages_read_engagement</code>, paste it below to link with full Graph API live capabilities:
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      value={manualToken}
                      onChange={(e) => setManualToken(e.target.value)}
                      placeholder="Paste EAAB... Meta Page Access Token here"
                      className="flex-1 text-xs p-2.5 bg-slate-50 border border-blue-200 rounded-xl font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleConnectDirect}
                      disabled={isConnectingDirect || !manualToken.trim()}
                      className="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold cursor-pointer transition-all"
                    >
                      Save & Link
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Setup Checklist */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2.5">
              <p className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                Setup & Requirements Checklist:
              </p>
              {meta.checklist.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-3 text-xs">
                  <div className="flex items-start gap-2">
                    {item.status === 'ready' || meta.status === 'connected' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-semibold text-slate-800">{item.title}</p>
                      <p className="text-[11px] text-slate-500">{item.description}</p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      item.status === 'ready' || meta.status === 'connected'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {item.status === 'ready' || meta.status === 'connected' ? 'Ready' : item.status}
                  </span>
                </div>
              ))}
            </div>

            {/* Webhook Configuration fields for Meta Developer Dashboard */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-blue-600" />
                  Meta Developer App Webhook Subscription:
                </p>
                <span className="text-[10px] bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full border border-blue-200">
                  messages & comments
                </span>
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Callback URL (Webhook)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={webhookUrl}
                    className="flex-1 text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-700"
                  />
                  <button
                    onClick={() => handleCopy('webhook', webhookUrl)}
                    className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer text-slate-600"
                    title="Copy Webhook URL"
                  >
                    {copiedKey === 'webhook' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Verify Token</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value="happy_moments_momo_verify_token"
                    className="flex-1 text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-700"
                  />
                  <button
                    onClick={() => handleCopy('token', 'happy_moments_momo_verify_token')}
                    className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer text-slate-600"
                    title="Copy Verify Token"
                  >
                    {copiedKey === 'token' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <a
                href={meta.documentationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-blue-700 hover:text-blue-900 font-semibold mt-1"
              >
                <span>Read Official Meta Instagram Documentation</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Section 2: Website Analytics (Google Analytics 4) */}
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-sm">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Website Analytics (Supabase Internal + Optional GA4)</h4>
                  <p className="text-[11px] text-slate-500">Pulls live vendor inquiries, lead conversions, and traffic metrics</p>
                </div>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                  ga.status === 'connected'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {ga.status === 'connected' ? ga.status : 'DB Active'}
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
              <p className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                Setup Checklist:
              </p>
              {ga.checklist.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-3 text-xs">
                  <div className="flex items-start gap-2">
                    {item.status === 'ready' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-semibold text-slate-800">{item.title}</p>
                      <p className="text-[11px] text-slate-500">{item.description}</p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      item.status === 'ready'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    {item.status === 'ready' ? 'Ready' : 'DB Fallback'}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-blue-900 leading-relaxed">
              <strong>Notice:</strong> Internal business inquiry and lead metrics are pulled directly from the Supabase database. Google Analytics 4 is an optional supplement for web traffic sessions.
            </div>
          </div>

          {/* Section 3: Data Privacy & Encryption */}
          <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 text-emerald-950 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <p className="font-bold">Enterprise Security & Compliance Guarantee:</p>
              <p className="mt-0.5 text-slate-600">
                All Meta access tokens are encrypted with AES-256-GCM before storage. Tokens are never exposed in browser code, API responses, or system logs. Automated customer messages are constrained to explicit admin-approved drafts within Meta's 24-hour customer messaging window.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="py-2 px-5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default MomoIntegrationSettings;

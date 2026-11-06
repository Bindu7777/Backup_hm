import React, { useState, useEffect } from 'react';
import { 
  KeyRound, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  RefreshCw, 
  MessageSquare, 
  ShieldCheck, 
  X, 
  AlertCircle,
  Building2,
  Lock,
  User,
  Clock
} from 'lucide-react';
import { Vendor } from '@/lib/supabase';
import { getVendorCredentials, upsertVendorCredentials } from '@/services/supabaseService';

export interface VendorCredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendor: Vendor | null;
  onCredentialsUpdated?: (vendorId: string | number, updatedCred: any) => void;
}

export const VendorCredentialsModal: React.FC<VendorCredentialsModalProps> = ({
  isOpen,
  onClose,
  vendor,
  onCredentialsUpdated
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [lastLogin, setLastLogin] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load existing credentials when vendor changes
  useEffect(() => {
    if (!isOpen || !vendor) return;

    setMessage(null);
    setLoading(true);

    // Default suggestions
    const defaultUsername = String(vendor.vendor_id);
    const defaultPassword = `HM@${vendor.phone_number?.slice(-4) || '2026'}#`;

    getVendorCredentials(vendor.vendor_id).then((res) => {
      setLoading(false);
      if (res.success && res.data) {
        setUsername(res.data.username || defaultUsername);
        setPassword(res.data.password || defaultPassword);
        setIsActive(res.data.is_active ?? true);
        setLastLogin(res.data.last_login || null);
      } else {
        // No record yet, prefill default suggestions
        setUsername(defaultUsername);
        setPassword(defaultPassword);
        setIsActive(true);
        setLastLogin(null);
      }
    });
  }, [isOpen, vendor]);

  if (!isOpen || !vendor) return null;

  // Generate strong random password
  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let generated = 'HM@';
    for (let i = 0; i < 6; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(generated);
  };

  // Save or update credentials in Supabase
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setMessage({ type: 'error', text: 'Username and password cannot be empty.' });
      return;
    }

    setSaving(true);
    setMessage(null);

    const res = await upsertVendorCredentials(
      vendor.vendor_id,
      username.trim(),
      password.trim(),
      isActive,
      vendor.brand_name
    );

    setSaving(false);

    if (res.success) {
      setMessage({ type: 'success', text: 'Vendor login credentials saved successfully!' });
      if (onCredentialsUpdated) {
        onCredentialsUpdated(vendor.vendor_id, res.data);
      }
    } else {
      setMessage({ type: 'error', text: res.error || 'Failed to save credentials' });
    }
  };

  // Formatted credentials text for sharing
  const loginUrl = `${window.location.origin}/vendor-login`;
  const shareText = `🎉 Happy Moments Vendor Portal Access
Brand: ${vendor.brand_name}
Contact: ${vendor.spoc_name || 'Partner'}
Login Portal: ${loginUrl}
Username: ${username}
Password: ${password}

Please log in to manage your bookings, leads, packages, and calendar!`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const rawPhone = (vendor.whatsapp_number || vendor.phone_number || '').replace(/[^0-9]/g, '');
  const formattedWa = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
  const waUrl = `https://wa.me/${formattedWa}?text=${encodeURIComponent(shareText)}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white p-6 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-inner">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-200">
                Vendor Authentication
              </span>
              <h3 className="text-xl font-extrabold text-white leading-tight">
                {vendor.brand_name}
              </h3>
              <p className="text-xs text-white/80 mt-0.5 font-mono">
                Vendor ID: #{vendor.vendor_id}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Quick info banner */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between gap-3 mb-5">
            <div>
              <span className="text-slate-500 block">SPOC & Phone</span>
              <span className="font-bold text-slate-900">{vendor.spoc_name || 'Vendor SPOC'} ({vendor.phone_number})</span>
            </div>
            {lastLogin ? (
              <div className="text-right">
                <span className="text-slate-500 block">Last Active</span>
                <span className="font-medium text-emerald-700 flex items-center gap-1 justify-end">
                  <Clock className="w-3 h-3" />
                  {new Date(lastLogin).toLocaleDateString()}
                </span>
              </div>
            ) : (
              <span className="text-slate-400 text-[11px] italic">Never logged in yet</span>
            )}
          </div>

          {/* Feedback message */}
          {message && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 mb-4 ${
                message.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {message.type === 'success' ? (
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {loading ? (
            <div className="py-8 text-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-orange-500" />
              <p className="text-xs">Loading vendor credentials...</p>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              {/* Username Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Login ID / Username <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter login username or ID"
                    required
                    className="w-full pl-9 pr-24 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <button
                    type="button"
                    onClick={() => setUsername(String(vendor.vendor_id))}
                    className="absolute right-2 top-2 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-[11px] font-semibold text-slate-600 transition-colors"
                  >
                    Use ID
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Vendors enter this username at <span className="font-mono text-slate-600">/vendor-login</span>
                </p>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Vendor Password <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-[11px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Auto-Generate
                  </button>
                </div>

                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter vendor password"
                    required
                    className="w-full pl-9 pr-12 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Account Status */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Account Active Status</span>
                  <span className="text-[11px] text-slate-500">
                    {isActive ? 'Vendor is allowed to log in' : 'Vendor login is locked / disabled'}
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-extrabold text-sm py-2.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Saving Credentials...
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      Save & Update Credentials
                    </>
                  )}
                </button>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                    {copied ? 'Copied Details!' : 'Copy Login Info'}
                  </button>

                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Share on WhatsApp
                  </a>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorCredentialsModal;


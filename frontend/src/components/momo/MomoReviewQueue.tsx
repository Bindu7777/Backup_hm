import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  UserCheck,
  ChevronRight,
  Sparkles,
  ShieldAlert,
  Edit3,
  SkipForward,
  Info
} from 'lucide-react';
import { ReplyDraft } from '../../services/momoApiService';

interface MomoReviewQueueProps {
  drafts: ReplyDraft[];
  onUpdateDraft: (id: number, update: Partial<ReplyDraft>) => Promise<void>;
  onSkipDraft: (id: number) => Promise<void>;
  onOpenConfirmModal: (selectedIds: number[]) => void;
  isExecuting: boolean;
}

export const MomoReviewQueue: React.FC<MomoReviewQueueProps> = ({
  drafts,
  onUpdateDraft,
  onSkipDraft,
  onOpenConfirmModal,
  isExecuting
}) => {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [editingDraftId, setEditingDraftId] = useState<number | null>(null);
  const [tempEditedText, setTempEditedText] = useState<string>('');

  const pendingDrafts = drafts.filter(d => d.approval_status === 'pending' || d.approval_status === 'needs_review');
  const eligibleDrafts = pendingDrafts.filter(d => d.messaging_window_valid);
  const blockedDrafts = drafts.filter(d => d.approval_status === 'blocked');
  const sentDrafts = drafts.filter(d => d.approval_status === 'sent');

  // Toggle selection
  const handleToggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllEligible = () => {
    if (selectedIds.length === eligibleDrafts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(eligibleDrafts.map(d => d.id));
    }
  };

  const handleStartEditing = (draft: ReplyDraft) => {
    setEditingDraftId(draft.id);
    setTempEditedText(draft.edited_reply || draft.suggested_reply);
  };

  const handleSaveEdit = async (draftId: number) => {
    await onUpdateDraft(draftId, { edited_reply: tempEditedText });
    setEditingDraftId(null);
  };

  const handleEscalate = async (draftId: number) => {
    await onUpdateDraft(draftId, {
      approval_status: 'needs_review',
      escalation_reason: 'Manually escalated by administrator for phone follow-up.'
    });
  };

  return (
    <section className="space-y-6">
      {/* Header and Counters */}
      <div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-purple-100 text-purple-700">
                <Sparkles className="w-4 h-4" />
              </span>
              <h2 className="text-xl font-bold text-slate-800">Ready for Your Review</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              AI-prepared customer response drafts grounded in your verified business knowledge base.
            </p>
          </div>

          {/* Quick Filter Counters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-800 font-semibold border border-purple-200">
              Awaiting Approval: {pendingDrafts.length}
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
              Sent: {sentDrafts.length}
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-800 font-semibold border border-rose-200">
              Policy Blocked: {blockedDrafts.length}
            </span>
          </div>
        </div>

        {/* Messaging Policy Reminder */}
        <div className="mt-4 p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100 text-xs text-indigo-900 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold">Instagram Compliance Policy:</span> Automated replies can only be sent within the official Meta 24-hour response window. Replies outside 24h are blocked to safeguard your Instagram account standing.
          </div>
        </div>
      </div>

      {/* Action Bar (Select all & Approve Selected) */}
      {eligibleDrafts.length > 0 && (
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-blue-100 shadow-md flex items-center justify-between gap-4 sticky top-20 z-20">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="selectAllEligible"
              checked={selectedIds.length === eligibleDrafts.length && eligibleDrafts.length > 0}
              onChange={handleSelectAllEligible}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="selectAllEligible" className="text-xs font-semibold text-slate-700 cursor-pointer">
              Select All Eligible ({eligibleDrafts.length})
            </label>
            {selectedIds.length > 0 && (
              <span className="text-xs text-blue-600 font-medium">
                • {selectedIds.length} selected
              </span>
            )}
          </div>

          <button
            onClick={() => onOpenConfirmModal(selectedIds)}
            disabled={selectedIds.length === 0 || isExecuting}
            className="py-2.5 px-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Approve Selected & Send Replies ({selectedIds.length})</span>
          </button>
        </div>
      )}

      {/* Review Cards List */}
      <div className="space-y-4">
        {pendingDrafts.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">All Replies Are Up to Date!</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              There are no customer inquiries awaiting reply approval. Click "Refresh Analysis" anytime to ingest new interactions.
            </p>
          </div>
        ) : (
          pendingDrafts.map((draft) => {
            const isSelected = selectedIds.includes(draft.id);
            const isEditing = editingDraftId === draft.id;

            return (
              <div
                key={draft.id}
                className={`bg-white rounded-3xl p-6 border transition-all duration-200 shadow-sm ${
                  isSelected
                    ? 'border-purple-500 ring-2 ring-purple-500/20 shadow-md'
                    : 'border-slate-200 hover:border-purple-200'
                }`}
              >
                {/* Card Top: Customer info, Intent, 24h Badge */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    {draft.messaging_window_valid ? (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(draft.id)}
                        className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer"
                      />
                    ) : (
                      <span title="Policy blocked (Window expired)">
                        <ShieldAlert className="w-4 h-4 text-rose-500" />
                      </span>
                    )}

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-800">{draft.participant_name}</span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                          {draft.provider === 'instagram_dm' ? 'Instagram DM' : 'Website Lead'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Received: {new Date(draft.message_timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Intent badge */}
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                      {draft.detected_intent}
                    </span>

                    {/* Window status */}
                    {draft.messaging_window_valid ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Clock className="w-3 h-3" />
                        Within 24h Window
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                        <ShieldAlert className="w-3 h-3" />
                        Window Expired (Blocked)
                      </span>
                    )}

                    {/* Confidence */}
                    <span className="text-[11px] text-slate-400 font-medium">
                      Confidence: {Math.round(draft.ai_confidence * 100)}%
                    </span>
                  </div>
                </div>

                {/* Card Middle: Customer message & AI Draft */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 my-4">
                  {/* Customer Message */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Customer Inquiry
                    </p>
                    <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                      "{draft.original_incoming_message}"
                    </p>
                  </div>

                  {/* AI Generated Draft (Editable) */}
                  <div className="p-4 bg-blue-50/40 rounded-2xl border border-blue-100">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full overflow-hidden border border-blue-200 shadow-sm shrink-0 bg-white">
                          <img src="/momo-avatar.png" alt="Momo" className="w-full h-full object-cover" />
                        </div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1">
                          Momo Proposed Reply ({draft.detected_language === 'te' ? 'Telugu' : 'English'}) ✨
                        </p>
                      </div>
                      {!isEditing && (
                        <button
                          onClick={() => handleStartEditing(draft)}
                          className="text-[11px] text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          Edit Draft
                        </button>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="space-y-2">
                        <textarea
                          value={tempEditedText}
                          onChange={(e) => setTempEditedText(e.target.value)}
                          rows={4}
                          className="w-full text-xs p-2.5 bg-white border border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingDraftId(null)}
                            className="px-3 py-1 text-xs text-slate-600 hover:text-slate-800 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveEdit(draft.id)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg cursor-pointer"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                        {draft.edited_reply || draft.suggested_reply}
                      </p>
                    )}
                  </div>
                </div>

                {/* Escalation warning if present */}
                {draft.escalation_reason && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-xs text-amber-800">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      <strong className="font-semibold">Review Alert:</strong> {draft.escalation_reason}
                    </span>
                  </div>
                )}

                {/* Card Bottom: Individual action buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <div className="text-[11px] text-slate-400">
                    ID: #{draft.id} • Grounded in Happy Moments Knowledge Base
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSkipDraft(draft.id)}
                      className="py-1.5 px-3 rounded-xl text-xs text-slate-600 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <SkipForward className="w-3.5 h-3.5" />
                      Skip
                    </button>

                    <button
                      onClick={() => handleEscalate(draft.id)}
                      className="py-1.5 px-3 rounded-xl text-xs text-amber-700 hover:text-amber-800 hover:bg-amber-50 border border-amber-200 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      Escalate to Human
                    </button>

                    {draft.messaging_window_valid && (
                      <button
                        onClick={() => onOpenConfirmModal([draft.id])}
                        disabled={isExecuting}
                        className="py-1.5 px-3.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Approve & Send
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};

export default MomoReviewQueue;

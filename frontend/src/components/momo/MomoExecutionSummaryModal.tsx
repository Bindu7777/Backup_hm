import React from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  ShieldAlert,
  ArrowRight,
  X,
  FileText,
  Clock
} from 'lucide-react';
import { ExecutionSummaryResult } from '../../services/momoApiService';

interface MomoExecutionSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: ExecutionSummaryResult | null;
  onViewAuditLog: () => void;
}

export const MomoExecutionSummaryModal: React.FC<MomoExecutionSummaryModalProps> = ({
  isOpen,
  onClose,
  summary,
  onViewAuditLog
}) => {
  if (!isOpen || !summary) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-blue-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-600 text-white flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-200">Execution Report</span>
            <h3 className="text-xl font-bold">Momo Bot Execution Summary</h3>
            <p className="text-xs text-blue-100 mt-0.5">
              Completed at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Metrics summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3.5 bg-purple-50 rounded-2xl border border-purple-100">
              <p className="text-xs text-purple-700 font-medium">Selected</p>
              <h4 className="text-2xl font-black text-purple-900 mt-1">{summary.totalSelected}</h4>
            </div>

            <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-100">
              <p className="text-xs text-emerald-700 font-medium">Sent Successfully</p>
              <h4 className="text-2xl font-black text-emerald-900 mt-1">{summary.sentCount}</h4>
            </div>

            <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-100">
              <p className="text-xs text-rose-700 font-medium">Policy Blocked</p>
              <h4 className="text-2xl font-black text-rose-900 mt-1">{summary.blockedCount}</h4>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <p className="text-xs text-slate-600 font-medium">Failed / Errors</p>
              <h4 className="text-2xl font-black text-slate-800 mt-1">{summary.failedCount}</h4>
            </div>
          </div>

          {/* Details breakdown */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
              Action Execution Details
            </h4>
            <div className="space-y-2">
              {summary.details.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border flex items-center justify-between text-xs transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    {item.status === 'sent' && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                    {item.status === 'blocked' && <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />}
                    {item.status === 'failed' && <XCircle className="w-4 h-4 text-red-500 shrink-0" />}

                    <div>
                      <span className="font-semibold text-slate-800">{item.recipient}</span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {item.status === 'sent' && `Sent via Meta Graph API • ID: ${item.messageId}`}
                        {item.status === 'blocked' && `Blocked: ${item.reason}`}
                        {item.status === 'failed' && `Error: ${item.error}`}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full font-semibold uppercase text-[10px] ${
                      item.status === 'sent'
                        ? 'bg-emerald-50 text-emerald-700'
                        : item.status === 'blocked'
                        ? 'bg-rose-50 text-rose-700'
                        : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations / Next steps */}
          <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-100 text-xs text-indigo-900 space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              Recommended Next Steps:
            </p>
            <ul className="list-disc pl-5 space-y-0.5 text-slate-600">
              {summary.blockedCount > 0 && (
                <li>Call or WhatsApp customers whose 24h Meta automated response window has expired.</li>
              )}
              {summary.sentCount > 0 && (
                <li>Monitor Instagram inbox for customer follow-up questions and booking confirmations.</li>
              )}
              <li>All dispatch attempts are permanently recorded in the immutable security audit log.</li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              onViewAuditLog();
            }}
            className="text-xs text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>View Security & Action Audit Trail</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onClose}
            className="py-2 px-5 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default MomoExecutionSummaryModal;

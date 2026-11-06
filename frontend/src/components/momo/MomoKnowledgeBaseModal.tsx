import React, { useState, useEffect } from 'react';
import { BookOpen, Save, X, Sparkles, Check, Edit3, HelpCircle } from 'lucide-react';
import { momoApiService, KnowledgeBaseItem } from '../../services/momoApiService';

interface MomoKnowledgeBaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MomoKnowledgeBaseModal: React.FC<MomoKnowledgeBaseModalProps> = ({ isOpen, onClose }) => {
  const [items, setItems] = useState<KnowledgeBaseItem[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>('');
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await momoApiService.getKnowledgeBase();
      if (res.success && res.knowledgeBase.length > 0) {
        setItems(res.knowledgeBase);
        const first = res.knowledgeBase[0];
        setSelectedKey(first.key);
        setEditTitle(first.title);
        setEditContent(first.content);
      }
    } catch (err) {
      console.error('Failed to load knowledge base:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (item: KnowledgeBaseItem) => {
    setSelectedKey(item.key);
    setEditTitle(item.title);
    setEditContent(item.content);
    setSavedSuccess(false);
  };

  const handleSave = async () => {
    if (!selectedKey || isSaving) return;
    setIsSaving(true);
    setSavedSuccess(false);
    try {
      const res = await momoApiService.updateKnowledgeBaseItem(selectedKey, {
        title: editTitle,
        content: editContent
      });
      if (res.success) {
        setItems(prev => prev.map(k => (k.key === selectedKey ? res.item : k)));
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2500);
      }
    } catch (err) {
      console.error('Failed to save knowledge base item:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-blue-100 overflow-hidden flex flex-col h-[85vh]">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Business Knowledge Base</h3>
              <p className="text-xs text-blue-100 mt-0.5">
                The AI uses these verified policies and pricing rules to ground all customer responses.
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

        {/* Body (Sidebar + Content Editor) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Sidebar List */}
          <div className="w-full md:w-72 bg-slate-50 border-r border-slate-200 overflow-y-auto p-4 space-y-1.5 shrink-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
              Topics & Policies
            </p>
            {isLoading ? (
              <div className="p-6 text-center text-xs text-slate-400">Loading knowledge base...</div>
            ) : (
              items.map((item) => (
                <button
                  key={item.key}
                  onClick={() => handleSelect(item)}
                  className={`w-full text-left p-3 rounded-2xl text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                    selectedKey === item.key
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="truncate">{item.title}</span>
                  {selectedKey === item.key && <Sparkles className="w-3.5 h-3.5 shrink-0 ml-1" />}
                </button>
              ))
            )}
          </div>

          {/* Editor Area */}
          <div className="flex-1 p-6 overflow-y-auto flex flex-col space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Topic Title
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full text-sm font-semibold p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Topic Content & Verified Business Facts
                </label>
                <span className="text-[11px] text-slate-400">
                  Grounded facts used for AI draft replies
                </span>
              </div>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={12}
                className="w-full flex-1 text-xs p-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed font-mono"
              />
            </div>

            {/* Note on hallucination prevention */}
            <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-900 flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                <strong>Anti-Hallucination Rule:</strong> If a customer asks a question not covered here (e.g. custom discounts or specific vendor calendar availability), Momo Bot will flag the query and escalate to a human agent instead of inventing details.
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {savedSuccess ? (
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <Check className="w-4 h-4" />
                Knowledge Base Updated Successfully!
              </span>
            ) : (
              'Changes take effect immediately for all subsequent reply generations.'
            )}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="py-2 px-4 rounded-xl text-xs text-slate-600 hover:text-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="py-2 px-5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Knowledge Topic'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MomoKnowledgeBaseModal;

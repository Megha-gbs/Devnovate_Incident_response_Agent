'use client';

import React, { useState } from 'react';
import type { InvestigationStep } from '@/types';

interface InvestigationStepModalProps {
  step: InvestigationStep | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (stepId: string, status: InvestigationStep['status'], notes?: string) => Promise<void>;
}

export default function InvestigationStepModal({
  step,
  isOpen,
  onClose,
  onSave,
}: InvestigationStepModalProps) {
  const [notes, setNotes] = useState(step?.notes || '');
  const [submitting, setSubmitting] = useState(false);

  // Sync notes when step changes
  React.useEffect(() => {
    if (step) {
      setNotes(step.notes || '');
    }
  }, [step]);

  if (!isOpen || !step) return null;

  const handleAction = async (status: InvestigationStep['status']) => {
    setSubmitting(true);
    try {
      await onSave(step.id, status, notes.trim() || undefined);
      onClose();
    } catch {
      // Error handled by parent hook
    } finally {
      setSubmitting(false);
    }
  };

  const statusMap = {
    pending: { label: 'Pending', color: 'text-slate-400 bg-slate-800/60 border-slate-700' },
    in_progress: { label: 'In Progress', color: 'text-cyan-400 bg-cyan-950/40 border-cyan-800/50' },
    done: { label: 'Worked', color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/50' },
    skipped: { label: 'Failed / Skipped', color: 'text-rose-400 bg-rose-950/40 border-rose-800/50' },
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-base/80 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="step-modal-title"
    >
      <div className="w-full max-w-lg ops-card p-6 border-brand-border/80 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4 pb-3 border-b border-brand-border/60">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/50 border border-indigo-500/30 px-2 py-0.5 rounded">
                STEP {step.order.toString().padStart(2, '0')}
              </span>
              <span
                className={`text-[11px] font-mono px-2 py-0.5 rounded-full border ${statusMap[step.status].color}`}
              >
                {statusMap[step.status].label}
              </span>
            </div>
            <h3 id="step-modal-title" className="text-base font-bold text-slate-100">
              {step.action}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1"
            aria-label="Close dialog"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Why / Rationale */}
        <div className="mb-4 p-3 rounded-lg bg-brand-surface-2/60 border border-brand-border/60 text-xs">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 block mb-1">
            Why this investigation step:
          </span>
          <p className="text-slate-300 leading-relaxed">{step.rationale}</p>
        </div>

        {/* Investigation Notes input */}
        <div className="mb-5">
          <label htmlFor="step-notes" className="block text-xs font-semibold text-slate-300 mb-1.5">
            Investigation Notes &amp; Findings
          </label>
          <textarea
            id="step-notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Document what you observed (e.g., query output, metrics change, pool status)..."
            className="ops-input w-full text-xs font-mono"
            disabled={submitting}
          />
          <p className="text-[11px] text-brand-muted mt-1">
            Notes will be appended to the operational timeline and included in post-mortem synthesis.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-brand-border/60">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="btn-secondary text-xs px-3 py-1.5"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleAction('skipped')}
              disabled={submitting}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
            >
              ✕ Mark Failed
            </button>
            <button
              type="button"
              onClick={() => handleAction('done')}
              disabled={submitting}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg border border-emerald-500/40 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-colors shadow-sm shadow-emerald-950"
            >
              {submitting ? 'Saving...' : '✓ Mark Worked'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

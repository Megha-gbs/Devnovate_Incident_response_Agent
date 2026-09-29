'use client';

import React, { useState } from 'react';
import type { InvestigationStep } from '@/types';
import { useInvestigation } from '@/hooks/useInvestigation';
import InvestigationStepModal from './InvestigationStepModal';

interface InvestigationStepsPanelProps {
  steps: InvestigationStep[];
  incidentId: string;
  onUpdateStep?: (
    stepId: string,
    status: InvestigationStep['status'],
    notes?: string,
  ) => Promise<void>;
}

export default function InvestigationStepsPanel({
  steps,
  incidentId,
  onUpdateStep,
}: InvestigationStepsPanelProps) {
  const { updateStepStatus, error } = useInvestigation(incidentId);
  const [activeModalStep, setActiveModalStep] = useState<InvestigationStep | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const sorted = [...steps].sort((a, b) => a.order - b.order);
  const doneCount = sorted.filter(
    (s) => s.status === 'done' || s.status === 'skipped',
  ).length;
  const workedCount = sorted.filter((s) => s.status === 'done').length;
  const pctComplete = sorted.length > 0 ? Math.round((doneCount / sorted.length) * 100) : 0;
  const allDone = doneCount === sorted.length && sorted.length > 0;

  const handleQuickAction = async (
    stepId: string,
    status: InvestigationStep['status'],
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    setUpdatingId(stepId);
    try {
      if (onUpdateStep) {
        await onUpdateStep(stepId, status);
      } else {
        await updateStepStatus(stepId, status);
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const handleModalSave = async (
    stepId: string,
    status: InvestigationStep['status'],
    notes?: string,
  ) => {
    if (onUpdateStep) {
      await onUpdateStep(stepId, status, notes);
    } else {
      await updateStepStatus(stepId, status, notes);
    }
  };

  return (
    <section
      aria-labelledby="steps-heading"
      className="ops-card p-5 sm:p-6 border-brand-border/80 bg-brand-surface relative"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-brand-border/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono text-cyan-400 font-bold">04</span>
            <h2 id="steps-heading" className="text-base font-bold text-slate-100">
              Recommended Investigation
            </h2>
          </div>
          <p className="text-xs text-brand-muted mt-0.5">
            Actionable diagnostic steps synthesized from similar historical incidents.
          </p>
        </div>

        {/* Progress meter */}
        <div className="flex items-center gap-3">
          <div className="w-24 h-2 bg-brand-base rounded-full overflow-hidden border border-brand-border/60">
            <div
              className="h-full bg-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${pctComplete}%` }}
            />
          </div>
          <span className="text-xs font-mono font-bold text-brand-muted tabular-nums">
            {doneCount}/{sorted.length} ({pctComplete}%)
          </span>
        </div>
      </div>

      {allDone && (
        <div
          className="flex items-center gap-2.5 p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30 mb-4 text-xs font-medium text-emerald-300"
          role="status"
        >
          <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
          </svg>
          <span>
            All investigation steps evaluated. {workedCount} confirmed contributing factor{workedCount !== 1 ? 's' : ''}.
          </span>
        </div>
      )}

      {error && (
        <div className="p-3 mb-4 rounded-lg bg-rose-950/20 border border-rose-500/30 text-xs text-rose-300">
          {error.message}
        </div>
      )}

      {sorted.length === 0 ? (
        <p className="text-xs text-brand-muted py-6 text-center">
          No investigation steps recorded yet. Run AI Analysis to generate recommendations.
        </p>
      ) : (
        <ol className="space-y-3">
          {sorted.map((step) => {
            const isDone = step.status === 'done';
            const isSkipped = step.status === 'skipped';
            const isInProgress = step.status === 'in_progress';
            const isBusy = updatingId === step.id;

            return (
              <li
                key={step.id}
                onClick={() => setActiveModalStep(step)}
                className={`ops-card p-4 transition-all duration-200 cursor-pointer ${
                  isDone
                    ? 'border-emerald-500/30 bg-emerald-950/10'
                    : isSkipped
                    ? 'border-brand-border/60 bg-brand-surface/40 opacity-75'
                    : isInProgress
                    ? 'border-cyan-500/40 bg-cyan-950/15'
                    : 'border-brand-border/80 bg-brand-surface-2/40 hover:border-slate-500'
                }`}
                aria-label={`Step ${step.order}: ${step.action}`}
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  {/* Step Order Pill */}
                  <span
                    className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs font-bold border ${
                      isDone
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : isSkipped
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        : isInProgress
                        ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40 animate-pulse'
                        : 'bg-brand-base text-slate-300 border-brand-border'
                    }`}
                  >
                    {isDone ? '✓' : isSkipped ? '✕' : step.order.toString().padStart(2, '0')}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                      <h3
                        className={`text-sm font-semibold ${
                          isSkipped ? 'text-brand-muted line-through' : 'text-slate-100'
                        }`}
                      >
                        {step.action}
                      </h3>

                      {/* Status Tag */}
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${
                          isDone
                            ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                            : isSkipped
                            ? 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                            : isInProgress
                            ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
                            : 'text-slate-400 bg-slate-800/40 border-slate-700/50'
                        }`}
                      >
                        {step.status === 'done'
                          ? 'WORKED'
                          : step.status === 'skipped'
                          ? 'FAILED / SKIPPED'
                          : step.status === 'in_progress'
                          ? 'IN PROGRESS'
                          : 'PENDING'}
                      </span>
                    </div>

                    {/* Why this step matters */}
                    <div className="mt-1.5 text-xs text-brand-muted">
                      <span className="text-[11px] font-mono text-cyan-400 font-semibold mr-1.5">
                        Why:
                      </span>
                      {step.rationale}
                    </div>

                    {/* Saved Notes preview if any */}
                    {step.notes && (
                      <div className="mt-2.5 p-2 rounded bg-brand-base/80 border border-brand-border/60 text-[11px] font-mono text-slate-300">
                        <span className="text-brand-muted mr-1">Notes:</span>
                        {step.notes}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div
                      className="mt-3 flex flex-wrap items-center gap-2 pt-2 border-t border-brand-border/40"
                      role="group"
                      aria-label="Step quick actions"
                    >
                      <button
                        type="button"
                        onClick={(e) => handleQuickAction(step.id, 'done', e)}
                        disabled={isBusy}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition-all ${
                          isDone
                            ? 'bg-emerald-500/25 border-emerald-500/50 text-emerald-300'
                            : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20'
                        }`}
                      >
                        ✓ Mark Worked
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleQuickAction(step.id, 'skipped', e)}
                        disabled={isBusy}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition-all ${
                          isSkipped
                            ? 'bg-rose-500/25 border-rose-500/50 text-rose-300'
                            : 'bg-rose-500/10 border-rose-500/25 text-rose-400 hover:bg-rose-500/20'
                        }`}
                      >
                        ✕ Mark Failed
                      </button>

                      {!isDone && !isSkipped && (
                        <button
                          type="button"
                          onClick={(e) => handleQuickAction(step.id, 'in_progress', e)}
                          disabled={isBusy}
                          className="px-2.5 py-1 text-xs font-semibold rounded-md border border-cyan-500/25 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-all"
                        >
                          → In Progress
                        </button>
                      )}

                      <span className="text-[11px] text-brand-muted ml-auto hover:text-cyan-400 transition-colors">
                        Click row for full notes modal &rarr;
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {/* Investigation Step Modal */}
      <InvestigationStepModal
        step={activeModalStep}
        isOpen={Boolean(activeModalStep)}
        onClose={() => setActiveModalStep(null)}
        onSave={handleModalSave}
      />
    </section>
  );
}

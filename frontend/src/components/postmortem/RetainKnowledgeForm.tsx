'use client';

import React, { useState, useId } from 'react';
import { retainKnowledge } from '@/lib/api/incidents';
import type { Incident, Knowledge_Entry } from '@/types';
import { ApiError } from '@/types';
import Toast from '@/components/shared/Toast';

interface RetainKnowledgeFormProps {
  incident: Incident;
  onRetained: (entry: Knowledge_Entry) => void;
}

export default function RetainKnowledgeForm({
  incident,
  onRetained,
}: RetainKnowledgeFormProps) {
  const id = useId();

  // Pre-populate insight from post-mortem root cause if available
  const [insight, setInsight] = useState(
    incident.postMortem?.rootCause ||
      (incident.resolution
        ? `Remediated ${incident.service} failure by addressing connection saturation and adjusting pool configurations.`
        : ''),
  );
  const [tagsInput, setTagsInput] = useState('database, connection-pool, deployment-check');
  const [errors, setErrors] = useState<{ insight?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  // Already retained — show celebratory organizational memory card
  if (incident.knowledgeEntry) {
    const retained = incident.knowledgeEntry;
    const retainedAt = new Date(retained.retainedAt).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <section
        aria-labelledby="retain-heading"
        className="ops-card p-6 sm:p-7 border-cyan-500/40 bg-gradient-to-b from-cyan-950/20 via-brand-surface to-brand-bg relative overflow-hidden"
      >
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-cyan-400 via-indigo-500 to-emerald-400 animate-pulse" />

        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/30 to-indigo-500/30 border border-cyan-400/50 flex items-center justify-center text-2xl shadow-lg shadow-cyan-950 flex-shrink-0">
            🧠
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-emerald-400 text-sm font-bold">✓</span>
              <h2 id="retain-heading" className="text-lg font-bold text-slate-100 tracking-tight">
                Knowledge Retained into Memory
              </h2>
            </div>
            <p className="text-xs text-cyan-300 font-medium">
              &ldquo;This incident is now available as organizational memory for future investigations.&rdquo;
            </p>
          </div>
        </div>

        {/* Retained Insight Box */}
        <div className="p-4 rounded-xl bg-brand-base/80 border border-cyan-500/30 mb-4">
          <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-cyan-400 block mb-1.5">
            Retained Memory Vector &amp; Insight
          </span>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-mono">
            {retained.insight}
          </p>

          {retained.tags && retained.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-brand-border/60">
              {retained.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-cyan-950/40 text-cyan-300 border border-cyan-500/30"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Feedback loop closed badge */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-brand-muted pt-2 border-t border-brand-border/40">
          <div className="flex items-center gap-2 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Closed-loop memory retention complete</span>
          </div>
          <time dateTime={retained.retainedAt} className="text-slate-400">
            Retained at {retainedAt}
          </time>
        </div>
      </section>
    );
  }

  // Only show after post-mortem
  if (!incident.postMortem) return null;

  function validate() {
    const e: typeof errors = {};
    if (!insight.trim()) e.insight = 'Organizational insight is required.';
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitting(true);

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      const entry = await retainKnowledge(incident.id, {
        insight: insight.trim(),
        tags,
      });
      setShowToast(true);
      onRetained(entry);
    } catch (err) {
      setApiError(
        err instanceof ApiError
          ? err.message
          : 'Unable to retain knowledge into memory. Please try again.',
      );
      setSubmitting(false);
    }
  }

  return (
    <>
      <section
        aria-labelledby="retain-heading"
        className="ops-card p-5 sm:p-6 border-cyan-500/30 bg-gradient-to-b from-brand-surface to-brand-surface-2 relative overflow-hidden"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-brand-border/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-cyan-400 font-bold">07</span>
              <h2 id="retain-heading" className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Approve &amp; Retain Knowledge</span>
              </h2>
            </div>
            <p className="text-xs text-brand-muted mt-0.5">
              Feed resolution insights back into the organizational memory graph for future incidents.
            </p>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 font-semibold">
            CLOSED-LOOP LEARNING
          </span>
        </div>

        {apiError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-950/20 border border-rose-500/30 text-rose-300 text-xs mb-4"
          >
            <span className="flex-1">{apiError}</span>
            <button
              type="button"
              onClick={() => setApiError(null)}
              className="text-rose-400 hover:text-rose-200"
            >
              ✕
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4" aria-label="Retain knowledge form">
          {/* Visual Memory Loop */}
          <div className="p-3 rounded-lg bg-brand-base border border-brand-border/60 text-[11px] font-mono text-slate-400 flex flex-wrap items-center justify-between gap-2">
            <span className="text-slate-300 font-semibold">Memory Loop:</span>
            <span className="text-slate-400">Incident Solved</span>
            <span>&rarr;</span>
            <span className="text-slate-400">Knowledge Formed</span>
            <span>&rarr;</span>
            <span className="text-cyan-400 font-bold">Cross-Incident Memory</span>
          </div>

          <div>
            <label htmlFor={`${id}-insight`} className="block text-xs font-semibold text-slate-300 mb-1.5">
              Knowledge Insight <span className="text-rose-400">*</span>
            </label>
            <p className="text-[11px] text-brand-muted mb-2">
              Summarize the lesson learned so the AI engine can retrieve this during future incidents.
            </p>
            <textarea
              id={`${id}-insight`}
              rows={3}
              value={insight}
              onChange={(e) => {
                setInsight(e.target.value);
                setErrors((er) => ({ ...er, insight: undefined }));
              }}
              className={`ops-input w-full text-xs font-mono resize-y ${
                errors.insight ? 'border-rose-500 ring-rose-500/20' : ''
              }`}
              aria-invalid={!!errors.insight}
            />
            {errors.insight && (
              <p className="mt-1 text-xs text-rose-400" role="alert">
                {errors.insight}
              </p>
            )}
          </div>

          <div>
            <label htmlFor={`${id}-tags`} className="block text-xs font-semibold text-slate-300 mb-1.5">
              Vector Index Tags <span className="text-brand-muted">(comma-separated)</span>
            </label>
            <input
              type="text"
              id={`${id}-tags`}
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. database, connection-pool, deployment, timeouts"
              className="ops-input w-full text-xs font-mono"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full btn-primary py-2.5 bg-gradient-to-r from-indigo-600 via-cyan-600 to-indigo-600 hover:from-indigo-500 hover:to-cyan-500 border border-cyan-400/40 text-slate-100 flex items-center justify-center gap-2 shadow-lg shadow-cyan-950 font-bold text-sm transition-all"
              aria-busy={submitting}
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Embedding into Organizational Memory…</span>
                </>
              ) : (
                <>
                  <span className="text-base">🧠</span>
                  <span>Approve &amp; Retain Knowledge</span>
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      {showToast && (
        <Toast
          message="✓ Knowledge retained — This incident is now available as organizational memory for future investigations."
          type="success"
          onDismiss={() => setShowToast(false)}
        />
      )}
    </>
  );
}

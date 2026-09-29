'use client';

import React, { useState, useId } from 'react';
import { createPostMortem } from '@/lib/api/incidents';
import type { Incident, Post_Mortem } from '@/types';
import { ApiError } from '@/types';
import PostmortemView from './PostmortemView';

interface PostmortemFormProps {
  incident: Incident;
  onComplete: (postMortem: Post_Mortem) => void;
}

export default function PostmortemForm({ incident, onComplete }: PostmortemFormProps) {
  const id = useId();
  const [rootCause, setRootCause] = useState(
    incident.resolution?.summary.includes('Root Cause:')
      ? incident.resolution.summary.split('Root Cause:')[1].split('Resolution:')[0].trim()
      : '',
  );
  const [impact, setImpact] = useState(
    `${incident.service} degradation lasting ~25 mins. 502 errors observed across 14% of payment transactions.`,
  );
  const [timeline, setTimeline] = useState(
    `17:18 — Latency threshold triggered; 502 error spike detected\n17:20 — Incident opened; AI investigation queried organizational memory\n17:24 — Correlation identified with INC-008 (connection saturation)\n17:32 — DB pool metrics confirmed 98% saturation; unreleased connections located\n17:41 — Pool size adjusted and leak patch deployed\n17:45 — Latency and error rates normalized; incident marked resolved`,
  );
  const [actionItems, setActionItems] = useState<string[]>([
    'Add automated circuit breaker alert when DB pool exceeds 85%',
    'Enforce linting rule requiring connection pool release in try-finally blocks',
  ]);
  const [errors, setErrors] = useState<{ rootCause?: string; impact?: string; timeline?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [draftNotice, setDraftNotice] = useState<string | null>(null);

  // Already has post-mortem
  if (incident.postMortem) {
    return (
      <section
        aria-labelledby="postmortem-heading"
        className="ops-card p-5 sm:p-6 border-brand-border/80 bg-brand-surface relative"
      >
        <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-brand-border/60">
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono text-cyan-400 font-bold">06</span>
            <h2 id="postmortem-heading" className="text-base font-bold text-slate-100">
              Post-Mortem &amp; Debrief
            </h2>
          </div>
          <span className="px-2.5 py-0.5 text-xs font-mono font-semibold rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            Recorded
          </span>
        </div>
        <PostmortemView postMortem={incident.postMortem} />
      </section>
    );
  }

  // Only show after resolution
  if (incident.status !== 'resolved') return null;

  function addActionItem() {
    setActionItems((a) => [...a, '']);
  }
  function removeActionItem(i: number) {
    setActionItems((a) => a.filter((_, idx) => idx !== i));
  }
  function updateActionItem(i: number, val: string) {
    setActionItems((a) => a.map((item, idx) => (idx === i ? val : item)));
  }

  function validate() {
    const e: typeof errors = {};
    if (!rootCause.trim()) e.rootCause = 'Root cause is required.';
    if (!impact.trim()) e.impact = 'Impact summary is required.';
    if (!timeline.trim()) e.timeline = 'Timeline of events is required.';
    return e;
  }

  async function handleSave(isDraft: boolean) {
    setApiError(null);
    setDraftNotice(null);
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitting(true);

    try {
      const pm = await createPostMortem(incident.id, {
        rootCause: rootCause.trim(),
        impact: impact.trim(),
        timeline: timeline.trim(),
        actionItems: actionItems.map((a) => a.trim()).filter(Boolean),
      });
      if (isDraft) {
        setDraftNotice('Draft saved successfully.');
        setSubmitting(false);
      } else {
        onComplete(pm);
      }
    } catch (err) {
      setApiError(
        err instanceof ApiError ? err.message : 'Unable to save post-mortem. Please try again.',
      );
      setSubmitting(false);
    }
  }

  return (
    <section
      aria-labelledby="postmortem-heading"
      className="ops-card p-5 sm:p-6 border-indigo-500/30 bg-brand-surface relative overflow-hidden"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-brand-border/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono text-indigo-400 font-bold">06</span>
            <h2 id="postmortem-heading" className="text-base font-bold text-slate-100">
              Post-Mortem Synthesis
            </h2>
          </div>
          <p className="text-xs text-brand-muted mt-0.5">
            Formal retrospective capturing root cause, impact, and systemic remedies.
          </p>
        </div>
        <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 font-semibold">
          RESOLVED &rarr; POST-MORTEM
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

      {draftNotice && (
        <div
          role="status"
          className="flex items-center gap-2 p-3 rounded-lg bg-emerald-950/25 border border-emerald-500/30 text-emerald-300 text-xs mb-4"
        >
          <span>✓</span>
          <span>{draftNotice}</span>
        </div>
      )}

      <div className="space-y-4" aria-label="Post-mortem form">
        {/* Root Cause */}
        <div>
          <label htmlFor={`${id}-rootCause`} className="block text-xs font-semibold text-slate-300 mb-1.5">
            Root Cause <span className="text-rose-400">*</span>
          </label>
          <textarea
            id={`${id}-rootCause`}
            rows={2}
            value={rootCause}
            onChange={(e) => {
              setRootCause(e.target.value);
              setErrors((er) => ({ ...er, rootCause: undefined }));
            }}
            placeholder="Detailed technical explanation of what caused the failure..."
            className={`ops-input w-full text-xs font-mono resize-y ${
              errors.rootCause ? 'border-rose-500 ring-rose-500/20' : ''
            }`}
            aria-invalid={!!errors.rootCause}
          />
          {errors.rootCause && (
            <p className="mt-1 text-xs text-rose-400" role="alert">
              {errors.rootCause}
            </p>
          )}
        </div>

        {/* Impact */}
        <div>
          <label htmlFor={`${id}-impact`} className="block text-xs font-semibold text-slate-300 mb-1.5">
            Customer &amp; Service Impact <span className="text-rose-400">*</span>
          </label>
          <textarea
            id={`${id}-impact`}
            rows={2}
            value={impact}
            onChange={(e) => {
              setImpact(e.target.value);
              setErrors((er) => ({ ...er, impact: undefined }));
            }}
            placeholder="Who/what was impacted, downtime duration, financial or SLO effects..."
            className={`ops-input w-full text-xs resize-y ${
              errors.impact ? 'border-rose-500 ring-rose-500/20' : ''
            }`}
            aria-invalid={!!errors.impact}
          />
          {errors.impact && (
            <p className="mt-1 text-xs text-rose-400" role="alert">
              {errors.impact}
            </p>
          )}
        </div>

        {/* Timeline */}
        <div>
          <label htmlFor={`${id}-timeline`} className="block text-xs font-semibold text-slate-300 mb-1.5">
            Incident Timeline <span className="text-rose-400">*</span>
          </label>
          <textarea
            id={`${id}-timeline`}
            rows={5}
            value={timeline}
            onChange={(e) => {
              setTimeline(e.target.value);
              setErrors((er) => ({ ...er, timeline: undefined }));
            }}
            className={`ops-input w-full text-xs font-mono resize-y ${
              errors.timeline ? 'border-rose-500 ring-rose-500/20' : ''
            }`}
            aria-invalid={!!errors.timeline}
          />
          {errors.timeline && (
            <p className="mt-1 text-xs text-rose-400" role="alert">
              {errors.timeline}
            </p>
          )}
        </div>

        {/* Action Items / Lessons Learned */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">
            Action Items &amp; Preventive Measures
          </label>
          <div className="space-y-2">
            {actionItems.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-brand-base border border-brand-border text-brand-muted text-[10px] font-mono flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <input
                  type="text"
                  value={item}
                  onChange={(e) => updateActionItem(i, e.target.value)}
                  placeholder={`Action item ${i + 1}…`}
                  className="ops-input flex-1 text-xs"
                />
                {actionItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeActionItem(i)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                    aria-label={`Remove action item ${i + 1}`}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addActionItem}
              className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 font-mono pt-1"
            >
              + Add another action item
            </button>
          </div>
        </div>

        {/* Actions: Save Draft & Approve / Save */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-brand-border/60">
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={submitting}
            className="btn-secondary text-xs px-3.5 py-2 font-mono"
          >
            Save Draft
          </button>

          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={submitting}
            className="btn-primary text-xs sm:text-sm py-2 px-5 flex items-center gap-2 shadow-lg shadow-indigo-950"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Recording Post-Mortem…</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Save Post-Mortem &amp; Proceed to Retention</span>
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}

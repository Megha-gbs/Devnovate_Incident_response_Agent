'use client';

import React, { useState, useId } from 'react';
import { resolveIncident } from '@/lib/api/incidents';
import type { Incident } from '@/types';
import { ApiError } from '@/types';
import ResolutionPanel from './ResolutionPanel';

interface ResolutionFormProps {
  incident: Incident;
  onResolved: (updated: Incident) => void;
}

export default function ResolutionForm({ incident, onResolved }: ResolutionFormProps) {
  const id = useId();
  const [rootCause, setRootCause] = useState('');
  const [summary, setSummary] = useState('');
  const [resolvedBy, setResolvedBy] = useState('SRE On-Call (Lead)');
  const [errors, setErrors] = useState<{ rootCause?: string; summary?: string; resolvedBy?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Already resolved — show read-only panel
  if (incident.status === 'resolved' && incident.resolution) {
    return <ResolutionPanel resolution={incident.resolution} />;
  }

  // Only show form on active / investigating incidents
  if (incident.status !== 'active') return null;

  function validate() {
    const e: typeof errors = {};
    if (!rootCause.trim()) e.rootCause = 'Root cause description is required.';
    if (!summary.trim()) e.summary = 'Successful resolution actions are required.';
    if (!resolvedBy.trim()) e.resolvedBy = 'Resolver name or team is required.';
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

    try {
      const fullSummary = `Root Cause: ${rootCause.trim()}\n\nResolution: ${summary.trim()}`;
      const updated = await resolveIncident(incident.id, {
        summary: fullSummary,
        resolvedBy: resolvedBy.trim(),
      });
      onResolved(updated);
    } catch (err) {
      setApiError(
        err instanceof ApiError ? err.message : 'Unable to resolve incident. Please try again.',
      );
      setSubmitting(false);
    }
  }

  return (
    <section
      id="resolution-section"
      aria-labelledby="resolution-form-heading"
      className="ops-card p-5 sm:p-6 border-emerald-500/30 bg-gradient-to-b from-brand-surface to-brand-surface-2 relative overflow-hidden"
    >
      <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-brand-border/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold">
            ✓
          </div>
          <div>
            <h2 id="resolution-form-heading" className="text-base font-bold text-slate-100">
              Resolve Incident
            </h2>
            <p className="text-xs text-brand-muted">
              Document root cause and remediation to transition incident to RESOLVED.
            </p>
          </div>
        </div>

        <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 font-semibold">
          ACTIVE &rarr; RESOLVED
        </span>
      </div>

      {apiError && (
        <div
          role="alert"
          className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-950/20 border border-rose-500/30 text-rose-300 text-xs mb-4"
        >
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
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

      <form onSubmit={handleSubmit} noValidate className="space-y-4" aria-label="Resolution form">
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
            placeholder="e.g. Database connection pool capacity was exhausted due to unreleased connections in payment batch retry loop..."
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

        {/* Successful Resolution */}
        <div>
          <label htmlFor={`${id}-summary`} className="block text-xs font-semibold text-slate-300 mb-1.5">
            Successful Resolution &amp; Remediation <span className="text-rose-400">*</span>
          </label>
          <textarea
            id={`${id}-summary`}
            rows={3}
            value={summary}
            onChange={(e) => {
              setSummary(e.target.value);
              setErrors((er) => ({ ...er, summary: undefined }));
            }}
            placeholder="e.g. Increased max pool connections to 250, deployed patch with connection.close() in finally block, validated DB saturation returned to 34%."
            className={`ops-input w-full text-xs font-mono resize-y ${
              errors.summary ? 'border-rose-500 ring-rose-500/20' : ''
            }`}
            aria-invalid={!!errors.summary}
          />
          {errors.summary && (
            <p className="mt-1 text-xs text-rose-400" role="alert">
              {errors.summary}
            </p>
          )}
        </div>

        {/* Resolved By */}
        <div>
          <label htmlFor={`${id}-resolvedBy`} className="block text-xs font-semibold text-slate-300 mb-1.5">
            Resolved By <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            id={`${id}-resolvedBy`}
            value={resolvedBy}
            onChange={(e) => {
              setResolvedBy(e.target.value);
              setErrors((er) => ({ ...er, resolvedBy: undefined }));
            }}
            placeholder="e.g. On-Call Engineer, SRE Team"
            className={`ops-input w-full text-xs ${
              errors.resolvedBy ? 'border-rose-500 ring-rose-500/20' : ''
            }`}
            aria-invalid={!!errors.resolvedBy}
          />
          {errors.resolvedBy && (
            <p className="mt-1 text-xs text-rose-400" role="alert">
              {errors.resolvedBy}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full btn-primary py-2.5 bg-emerald-600 hover:bg-emerald-500 border border-emerald-500/40 text-slate-100 flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 font-bold text-sm transition-all"
            aria-busy={submitting}
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Transitioning to Resolved…</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 text-emerald-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span>Resolve Incident</span>
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}

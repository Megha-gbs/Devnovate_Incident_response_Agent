'use client';

import React from 'react';
import type { Resolution } from '@/types';

interface ResolutionPanelProps {
  resolution: Resolution;
}

export default function ResolutionPanel({ resolution }: ResolutionPanelProps) {
  const resolvedAt = new Date(resolution.resolvedAt).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <section
      aria-labelledby="resolution-heading"
      className="ops-card p-5 sm:p-6 border-emerald-500/30 bg-gradient-to-r from-emerald-950/20 via-brand-surface to-brand-surface relative overflow-hidden"
    >
      <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-brand-border/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold">
            ✓
          </div>
          <div>
            <h2 id="resolution-heading" className="text-base font-bold text-emerald-400">
              Incident Resolved
            </h2>
            <p className="text-xs text-brand-muted">
              Remediation applied and service health restored.
            </p>
          </div>
        </div>

        <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-semibold">
          RESOLVED
        </span>
      </div>

      <div className="space-y-3.5">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400 block mb-1">
            Resolution Summary
          </span>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap font-mono bg-brand-base/80 p-3.5 rounded-lg border border-brand-border/60">
            {resolution.summary}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-brand-muted pt-2 border-t border-brand-border/40">
          <span>
            Resolved by: <strong className="text-slate-200">{resolution.resolvedBy}</strong>
          </span>
          <time dateTime={resolution.resolvedAt} className="text-slate-400">
            {resolvedAt}
          </time>
        </div>
      </div>
    </section>
  );
}

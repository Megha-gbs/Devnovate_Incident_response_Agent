'use client';

import React from 'react';
import type { Post_Mortem } from '@/types';

interface PostmortemViewProps {
  postMortem: Post_Mortem;
}

export default function PostmortemView({ postMortem }: PostmortemViewProps) {
  const authoredAt = new Date(postMortem.authoredAt).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="space-y-4 text-xs sm:text-sm">
      {/* Root Cause */}
      <div>
        <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-amber-400 block mb-1">
          Identified Root Cause
        </span>
        <p className="text-slate-200 leading-relaxed font-mono bg-brand-base/80 p-3 rounded-lg border border-brand-border/60">
          {postMortem.rootCause}
        </p>
      </div>

      {/* Impact */}
      <div>
        <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400 block mb-1">
          System &amp; Customer Impact
        </span>
        <p className="text-slate-300 leading-relaxed">{postMortem.impact}</p>
      </div>

      {/* Timeline */}
      <div>
        <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-cyan-400 block mb-1">
          Incident Event Log
        </span>
        <pre className="text-slate-300 font-mono text-xs whitespace-pre-wrap leading-relaxed bg-brand-base border border-brand-border rounded-lg p-3 overflow-x-auto max-h-60 overflow-y-auto">
          {postMortem.timeline}
        </pre>
      </div>

      {/* Action Items */}
      {postMortem.actionItems.length > 0 && (
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-indigo-400 block mb-1.5">
            Preventative Action Items
          </span>
          <ul className="space-y-1.5">
            {postMortem.actionItems.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-2 p-2 rounded bg-brand-surface-2/60 border border-brand-border/60 text-xs text-slate-200"
              >
                <span className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-400 font-mono text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="leading-snug">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="pt-2 border-t border-brand-border/40 text-[11px] font-mono text-brand-muted">
        Authored &amp; signed off on {authoredAt}
      </div>
    </div>
  );
}

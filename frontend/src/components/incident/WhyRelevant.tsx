'use client';

import React, { useState } from 'react';

interface WhyRelevantProps {
  explanation: string;
  resolution?: string;
  rootCause?: string;
  defaultExpanded?: boolean;
}

export default function WhyRelevant({
  explanation,
  resolution,
  rootCause,
  defaultExpanded = true,
}: WhyRelevantProps) {
  const [showDetails, setShowDetails] = useState(defaultExpanded);

  return (
    <div className="mt-3.5 space-y-2.5">
      {/* Prominent 'WHY THIS MATTERS' callout */}
      <div className="p-3 sm:p-3.5 rounded-lg bg-cyan-950/20 border border-cyan-500/30 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-cyan-400" />
        <div className="flex items-center justify-between gap-2 mb-1.5 pl-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-cyan-400 text-xs">⚡</span>
            <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-cyan-300">
              Why this memory matters
            </span>
          </div>
          {(resolution || rootCause) && (
            <button
              onClick={() => setShowDetails(v => !v)}
              className="text-[11px] text-cyan-400/80 hover:text-cyan-300 flex items-center gap-1 transition-colors"
              aria-expanded={showDetails}
            >
              <span>{showDetails ? 'Hide analysis' : 'View root cause & fix'}</span>
              <svg
                className={`w-3.5 h-3.5 transition-transform duration-200 ${showDetails ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>
        <p className="pl-1.5 text-xs sm:text-[13px] text-slate-200 leading-relaxed font-normal">
          &ldquo;{explanation}&rdquo;
        </p>
      </div>

      {/* Expanded Root Cause & Resolution */}
      {showDetails && (rootCause || resolution) && (
        <div className="space-y-2 pl-3 border-l-2 border-brand-border/60 ml-1 text-xs">
          {rootCause && (
            <div className="p-2.5 rounded-md bg-brand-surface-2/60 border border-brand-border/60">
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-amber-400/90 block mb-1">
                Root Cause Identified
              </span>
              <p className="text-slate-300 text-xs leading-relaxed">{rootCause}</p>
            </div>
          )}

          {resolution && (
            <div className="p-2.5 rounded-md bg-emerald-950/20 border border-emerald-500/20">
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-emerald-400 block mb-1">
                Proven Resolution
              </span>
              <p className="text-slate-300 text-xs leading-relaxed">{resolution}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import React from 'react';
import { getSimilarityTier } from '@/types';
import type { SimilarityTier } from '@/types';

interface SimilarityBadgeProps {
  score: number;
  showBar?: boolean;
}

const tierConfig: Record<SimilarityTier, { label: string; textClass: string; bgClass: string; borderClass: string; barClass: string }> = {
  HIGH: {
    label: 'HIGH',
    textClass: 'text-emerald-400',
    bgClass: 'bg-emerald-500/10',
    borderClass: 'border-emerald-500/30',
    barClass: 'bg-emerald-400 shadow-sm shadow-emerald-500/50',
  },
  MEDIUM: {
    label: 'MEDIUM',
    textClass: 'text-amber-400',
    bgClass: 'bg-amber-500/10',
    borderClass: 'border-amber-500/30',
    barClass: 'bg-amber-400 shadow-sm shadow-amber-500/50',
  },
  LOW: {
    label: 'LOW',
    textClass: 'text-slate-400',
    bgClass: 'bg-slate-700/20',
    borderClass: 'border-slate-600/30',
    barClass: 'bg-slate-500',
  },
};

export default function SimilarityBadge({ score, showBar = true }: SimilarityBadgeProps) {
  const tier = getSimilarityTier(score);
  const { label, textClass, bgClass, borderClass, barClass } = tierConfig[tier];
  const pct = Math.round(score * 100);

  return (
    <div className="flex items-center gap-2">
      <span
        className={`px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider rounded-full border ${textClass} ${bgClass} ${borderClass}`}
        aria-label={`Similarity: ${label} — ${pct}%`}
      >
        {label}
      </span>
      <span className="text-xs font-mono font-semibold text-brand-muted tabular-nums">
        {pct}%
      </span>
      {showBar && (
        <div
          className="w-14 h-1.5 bg-brand-base rounded-full overflow-hidden border border-brand-border/60"
          aria-hidden="true"
        >
          <div
            className={`h-full rounded-full transition-all duration-500 ${barClass}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
      <span className="sr-only">
        {label} similarity — {pct}% match
      </span>
    </div>
  );
}

'use client';

import React from 'react';
import type { Memory } from '@/types';
import { getSimilarityTier } from '@/types';
import SimilarityBadge from './SimilarityBadge';
import WhyRelevant from './WhyRelevant';
import SeverityBadge from '@/components/incidents/SeverityBadge';

interface MemoryCardProps {
  memory: Memory;
  rank?: number;
  isSelected?: boolean;
  onSelect?: () => void;
}

export default function MemoryCard({
  memory,
  rank,
  isSelected,
  onSelect,
}: MemoryCardProps) {
  const tier = getSimilarityTier(memory.similarityScore);

  const resolvedDate = new Date(memory.resolvedAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const tierStyles = {
    HIGH: 'border-l-4 border-l-emerald-400 border-emerald-500/25 bg-gradient-to-r from-emerald-950/10 via-brand-surface to-brand-surface',
    MEDIUM: 'border-l-4 border-l-amber-400 border-amber-500/20 bg-gradient-to-r from-amber-950/10 via-brand-surface to-brand-surface',
    LOW: 'border-l-4 border-l-slate-500 border-brand-border/70 bg-brand-surface',
  };

  return (
    <article
      id={`memory-${memory.id}`}
      onClick={onSelect}
      className={`ops-card p-4 sm:p-5 transition-all duration-200 ${
        tierStyles[tier]
      } ${
        isSelected
          ? 'ring-2 ring-cyan-400 shadow-lg shadow-cyan-950/40'
          : 'hover:border-slate-600 hover:shadow-md'
      }`}
      aria-label={`Historical incident ${memory.incidentId}: ${memory.title}`}
    >
      {/* Top row: Rank, ID, Service, Severity, Similarity */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          {rank !== undefined && (
            <span className="w-5 h-5 rounded-full bg-brand-base border border-brand-border text-brand-muted text-[10px] font-mono font-bold flex items-center justify-center">
              {rank}
            </span>
          )}
          <span className="font-mono text-xs font-bold text-slate-200 tracking-wide bg-brand-base px-2 py-0.5 rounded border border-brand-border">
            {memory.incidentId}
          </span>
          <SeverityBadge severity={memory.severity} size="xs" />
          <span className="text-xs text-brand-muted font-mono">
            {memory.service}
          </span>
        </div>

        <div>
          <SimilarityBadge score={memory.similarityScore} />
        </div>
      </div>

      {/* Title */}
      <h3 className="text-sm sm:text-base font-semibold text-slate-100 mb-2 leading-snug">
        {memory.title}
      </h3>

      {/* Metadata: Resolved at */}
      <div className="flex items-center gap-2 text-[11px] text-brand-muted mb-3 font-mono">
        <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Resolved <time dateTime={memory.resolvedAt}>{resolvedDate}</time></span>
      </div>

      {/* Why Relevant & Root Cause / Resolution */}
      <WhyRelevant
        explanation={memory.relevanceExplanation}
        rootCause={memory.rootCause}
        resolution={memory.resolution}
      />
    </article>
  );
}

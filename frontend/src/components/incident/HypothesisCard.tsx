'use client';

import React from 'react';
import type { Hypothesis } from '@/types';

interface HypothesisCardProps {
  hypothesis: Hypothesis;
  rank: number;
}

export default function HypothesisCard({ hypothesis, rank }: HypothesisCardProps) {
  const pct = Math.round(hypothesis.confidence * 100);

  const confidenceTier =
    pct >= 80
      ? {
          label: 'High Confidence',
          textColor: 'text-indigo-400',
          barColor: 'bg-indigo-500 shadow-sm shadow-indigo-500/50',
          border: 'border-indigo-500/30',
          bg: 'bg-indigo-950/20',
        }
      : pct >= 50
      ? {
          label: 'Moderate Confidence',
          textColor: 'text-amber-400',
          barColor: 'bg-amber-500 shadow-sm shadow-amber-500/50',
          border: 'border-amber-500/30',
          bg: 'bg-amber-950/15',
        }
      : {
          label: 'Low Confidence',
          textColor: 'text-slate-400',
          barColor: 'bg-slate-500',
          border: 'border-slate-700/50',
          bg: 'bg-brand-surface',
        };

  return (
    <article
      className={`ops-card p-4 transition-all duration-200 border ${confidenceTier.border} ${confidenceTier.bg} hover:border-slate-500`}
      aria-label={`Hypothesis ${rank}: ${hypothesis.description}`}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-2.5">
        <span
          className="flex-shrink-0 w-6 h-6 rounded-md bg-brand-base border border-brand-border flex items-center justify-center font-mono text-xs font-bold text-indigo-400"
          aria-label={`Rank ${rank}`}
        >
          {rank}
        </span>
        <h3 className="text-sm font-semibold text-slate-100 flex-1 leading-snug">
          {hypothesis.description}
        </h3>
        <span className={`text-xs font-mono font-bold ${confidenceTier.textColor}`}>
          {pct}%
        </span>
      </div>

      {/* Confidence Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-[11px] text-brand-muted mb-1">
          <span>{confidenceTier.label}</span>
          <span className="text-[10px] text-slate-500">Correlation score</span>
        </div>
        <div
          className="w-full h-1.5 bg-brand-base rounded-full overflow-hidden border border-brand-border/60"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={`h-full rounded-full transition-all duration-700 ${confidenceTier.barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-[10px] text-slate-500 mt-1 italic">
          Calculated from symptom overlap and historical precedent; not absolute truth.
        </p>
      </div>

      {/* Supporting Evidence */}
      {hypothesis.supporting_evidence && hypothesis.supporting_evidence.length > 0 && (
        <div className="pt-2 border-t border-brand-border/40">
          <span className="text-[10px] font-mono uppercase tracking-wider text-brand-muted block mb-1.5">
            Corroborating Evidence:
          </span>
          <ul className="space-y-1">
            {hypothesis.supporting_evidence.map((evidence, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0 mt-1.5" />
                <span>{evidence}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

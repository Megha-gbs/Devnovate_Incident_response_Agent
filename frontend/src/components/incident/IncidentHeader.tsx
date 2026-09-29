'use client';

import React from 'react';
import Link from 'next/link';
import type { Incident } from '@/types';
import SeverityBadge from '@/components/incidents/SeverityBadge';
import StatusBadge from '@/components/incidents/StatusBadge';

interface IncidentHeaderProps {
  incident: Incident;
  onAnalyze?: () => void;
  onResolveClick?: () => void;
  isAnalyzing?: boolean;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ${m % 60}m ago`;
  if (m > 0) return `${m}m ago`;
  return 'just now';
}

export default function IncidentHeader({
  incident,
  onAnalyze,
  onResolveClick,
  isAnalyzing,
}: IncidentHeaderProps) {
  const isResolved = incident.status === 'resolved';

  return (
    <header className="ops-card p-5 sm:p-6 border-brand-border/80 bg-brand-surface relative overflow-hidden mb-6">
      {/* Decorative top border */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-cyan-400 to-indigo-600 opacity-60" />

      {/* Back button and telemetry breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-brand-border/60">
        <Link
          href="/incidents"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors font-semibold group"
        >
          <span className="transition-transform group-hover:-translate-x-1">&larr;</span>
          <span>Back to Incidents</span>
        </Link>

        <div className="flex items-center gap-3 text-xs font-mono text-brand-muted">
          <span>Created {relativeTime(incident.timestamp)}</span>
          <span>&bull;</span>
          <span className="text-slate-300">{incident.service}</span>
        </div>
      </div>

      {/* Main Title Row */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2 flex-1 min-w-[280px]">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold text-slate-200 bg-brand-base border border-brand-border tracking-wider">
              INCIDENT #{incident.id}
            </span>
            <SeverityBadge severity={incident.severity} size="sm" />
            <StatusBadge status={incident.status} size="sm" />
          </div>

          <h1
            id="incident-title"
            className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight leading-snug"
          >
            {incident.title}
          </h1>
        </div>

        {/* Primary Operational Action Buttons */}
        <div className="flex items-center gap-2.5 flex-shrink-0 pt-1">
          {onAnalyze && (
            <button
              type="button"
              onClick={onAnalyze}
              disabled={isAnalyzing}
              className="btn-secondary text-xs sm:text-sm py-2 px-3.5 flex items-center gap-2 border-indigo-500/40 text-indigo-300 hover:bg-indigo-950/40"
            >
              <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>{isAnalyzing ? 'Analyzing...' : 'Analyze Incident'}</span>
            </button>
          )}

          {!isResolved && onResolveClick && (
            <button
              type="button"
              onClick={onResolveClick}
              className="btn-primary text-xs sm:text-sm py-2 px-4 shadow-md shadow-emerald-950/50 bg-emerald-600 hover:bg-emerald-500 border border-emerald-500/40 flex items-center gap-2"
            >
              <svg className="w-4 h-4 text-emerald-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Resolve Incident</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

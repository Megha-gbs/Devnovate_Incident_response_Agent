'use client';

import React, { useState } from 'react';
import type { Memory } from '@/types';
import MemoryCard from './MemoryCard';
import MemoryConnectionGraph from './MemoryConnectionGraph';

interface MemoryPanelProps {
  memory: Memory[];
  currentIncidentId?: string;
  currentTitle?: string;
  currentService?: string;
}

export default function MemoryPanel({
  memory,
  currentIncidentId = 'INC-ACTIVE',
  currentTitle = 'Active Incident Investigation',
  currentService,
}: MemoryPanelProps) {
  const [selectedMemoryId, setSelectedMemoryId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'high-only'>('all');

  const sorted = [...memory].sort((a, b) => b.similarityScore - a.similarityScore);
  const displayedMemories =
    viewMode === 'high-only'
      ? sorted.filter(m => m.similarityScore >= 0.85)
      : sorted;

  const handleSelectMemory = (id: string) => {
    setSelectedMemoryId(prev => (prev === id ? null : id));
    const el = document.getElementById(`memory-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  return (
    <section
      aria-label="Historical memory matches"
      aria-labelledby="memory-panel-heading"
      className="ops-card p-5 sm:p-6 border-indigo-500/30 bg-gradient-to-b from-brand-surface via-brand-surface to-brand-bg relative overflow-hidden"
    >
      {/* Top subtle decorative accent */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-cyan-400 to-indigo-500 opacity-60" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5 pb-4 border-b border-brand-border/60">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="text-xl" role="img" aria-label="Brain">🧠</span>
            <h2
              id="memory-panel-heading"
              className="text-base sm:text-lg font-bold text-slate-100 tracking-tight flex items-center gap-2"
            >
              Memory Used
            </h2>
            <span className="px-2.5 py-0.5 text-xs font-mono font-semibold rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/25">
              {sorted.length} {sorted.length === 1 ? 'similar incident found' : 'similar incidents found'}
            </span>
          </div>
          <p className="text-xs text-brand-muted">
            Organizational memory matches retrieved using semantic symptom similarity &amp; telemetry patterns.
          </p>
        </div>

        {/* View toggle if items exist */}
        {sorted.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-brand-muted uppercase font-mono tracking-wider">Filter:</span>
            <div className="inline-flex rounded-lg border border-brand-border bg-brand-base p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('all')}
                className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-md transition-colors ${
                  viewMode === 'all'
                    ? 'bg-brand-surface-2 text-cyan-400 shadow-sm'
                    : 'text-brand-muted hover:text-slate-200'
                }`}
              >
                All ({sorted.length})
              </button>
              <button
                type="button"
                onClick={() => setViewMode('high-only')}
                className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-md transition-colors ${
                  viewMode === 'high-only'
                    ? 'bg-brand-surface-2 text-emerald-400 shadow-sm'
                    : 'text-brand-muted hover:text-slate-200'
                }`}
              >
                High Match ({sorted.filter(m => m.similarityScore >= 0.85).length})
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Memory Connection Visual */}
      {sorted.length > 0 && (
        <MemoryConnectionGraph
          currentIncidentId={currentIncidentId}
          currentTitle={currentTitle}
          currentService={currentService}
          memories={sorted}
          selectedMemoryId={selectedMemoryId}
          onSelectMemory={handleSelectMemory}
        />
      )}

      {/* Memory Cards list */}
      {displayedMemories.length === 0 ? (
        <div className="text-center py-10 px-4 rounded-xl border border-dashed border-brand-border/80 bg-brand-base/40">
          <div className="w-12 h-12 rounded-full bg-brand-surface-2 flex items-center justify-center mx-auto mb-3 text-brand-muted">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-slate-300">
            {viewMode === 'high-only'
              ? 'No high similarity (>85%) matches found.'
              : 'No sufficiently similar historical incidents found.'}
          </p>
          <p className="text-xs text-brand-muted mt-1 max-w-md mx-auto">
            {viewMode === 'high-only'
              ? 'Switch back to "All" to inspect moderate and low similarity patterns.'
              : 'OpsMind scanned the organizational vector store but did not find high-confidence past incidents for these exact symptoms.'}
          </p>
          {viewMode === 'high-only' && (
            <button
              onClick={() => setViewMode('all')}
              className="mt-3 btn-secondary text-xs py-1.5 px-3"
            >
              Show all matches
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3.5">
          {displayedMemories.map((mem, i) => (
            <MemoryCard
              key={mem.id}
              memory={mem}
              rank={i + 1}
              isSelected={selectedMemoryId === mem.id}
              onSelect={() => handleSelectMemory(mem.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

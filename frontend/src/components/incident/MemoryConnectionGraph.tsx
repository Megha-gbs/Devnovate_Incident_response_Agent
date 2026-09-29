'use client';

import React from 'react';
import type { Memory } from '@/types';
import { getSimilarityTier } from '@/types';
import SeverityBadge from '@/components/incidents/SeverityBadge';

interface MemoryConnectionGraphProps {
  currentIncidentId: string;
  currentTitle?: string;
  currentService?: string;
  memories: Memory[];
  onSelectMemory?: (memoryId: string) => void;
  selectedMemoryId?: string | null;
}

export default function MemoryConnectionGraph({
  currentIncidentId,
  currentTitle = 'Active Incident',
  currentService,
  memories,
  onSelectMemory,
  selectedMemoryId,
}: MemoryConnectionGraphProps) {
  if (!memories || memories.length === 0) return null;

  const sortedMemories = [...memories].sort((a, b) => b.similarityScore - a.similarityScore);

  return (
    <div className="ops-card p-4 sm:p-5 mb-5 border-brand-border/60 bg-gradient-to-b from-brand-surface to-brand-bg/90">
      <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-brand-border/50">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-cyan-400">
            Memory Relationship Graph
          </span>
        </div>
        <span className="text-xs text-brand-muted font-mono">
          {sortedMemories.length} vector {sortedMemories.length === 1 ? 'cluster' : 'clusters'} matched
        </span>
      </div>

      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 lg:gap-8">
        {/* Root Node: Current Incident */}
        <div className="flex-shrink-0 lg:w-64 p-3.5 rounded-lg border border-indigo-500/40 bg-indigo-950/20 backdrop-blur-sm relative group shadow-sm shadow-indigo-950/50">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-indigo-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              CURRENT INCIDENT
            </span>
            <span className="text-xs font-mono font-bold text-slate-200">
              #{currentIncidentId}
            </span>
          </div>
          <p className="text-xs font-medium text-slate-200 line-clamp-1">
            {currentTitle}
          </p>
          {currentService && (
            <span className="inline-block mt-1 text-[11px] text-brand-muted font-mono">
              {currentService}
            </span>
          )}
        </div>

        {/* Tree Connection Visualization (CSS/SVG lines) */}
        <div className="flex-1 flex flex-col gap-2.5 relative">
          {sortedMemories.map((mem, idx) => {
            const tier = getSimilarityTier(mem.similarityScore);
            const pct = Math.round(mem.similarityScore * 100);
            const isSelected = selectedMemoryId === mem.id;

            const tierColor =
              tier === 'HIGH'
                ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                : tier === 'MEDIUM'
                ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                : 'text-slate-400 border-slate-600/30 bg-slate-800/40';

            const barColor =
              tier === 'HIGH'
                ? 'bg-emerald-400'
                : tier === 'MEDIUM'
                ? 'bg-amber-400'
                : 'bg-slate-400';

            return (
              <div
                key={mem.id}
                onClick={() => onSelectMemory?.(mem.id)}
                className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'border-cyan-400 bg-cyan-950/25 ring-1 ring-cyan-400/50 shadow-md'
                    : 'border-brand-border/70 bg-brand-surface/70 hover:border-slate-600 hover:bg-brand-surface-2/60'
                }`}
              >
                {/* Branch indicator */}
                <div className="hidden sm:flex items-center text-slate-600 font-mono text-xs select-none pl-1">
                  {idx === sortedMemories.length - 1 ? '└─────' : '├─────'}
                </div>

                {/* Node info */}
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="font-mono text-xs font-semibold text-slate-300">
                    {mem.incidentId}
                  </span>
                  <SeverityBadge severity={mem.severity} size="xs" />
                  <span className="text-xs text-slate-300 truncate font-medium">
                    {mem.title}
                  </span>
                  <span className="hidden md:inline-block text-[11px] text-slate-500 font-mono">
                    ({mem.service})
                  </span>
                </div>

                {/* Similarity meter & tier */}
                <div className="flex items-center gap-2.5 flex-shrink-0">
                  <div className="hidden sm:block w-16 h-1.5 bg-brand-base rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${tierColor}`}
                  >
                    {tier} {pct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

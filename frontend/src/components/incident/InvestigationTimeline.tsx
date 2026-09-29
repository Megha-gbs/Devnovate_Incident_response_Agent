'use client';

import React from 'react';
import type { Timeline_Entry } from '@/types';

interface InvestigationTimelineProps {
  timeline: Timeline_Entry[];
}

const actorStyle: Record<
  Timeline_Entry['actor'],
  { color: string; bg: string; border: string; label: string; icon: string }
> = {
  system: {
    color: 'text-slate-400',
    bg: 'bg-slate-800/40',
    border: 'border-slate-700/60',
    label: 'SYS',
    icon: '⚙',
  },
  user: {
    color: 'text-indigo-400',
    bg: 'bg-indigo-950/40',
    border: 'border-indigo-500/30',
    label: 'USR',
    icon: '👤',
  },
  ai: {
    color: 'text-cyan-400',
    bg: 'bg-cyan-950/40',
    border: 'border-cyan-500/30',
    label: 'AI',
    icon: '⚡',
  },
};

export default function InvestigationTimeline({ timeline }: InvestigationTimelineProps) {
  const sorted = [...timeline].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  if (sorted.length === 0) return null;

  return (
    <section
      aria-labelledby="timeline-heading"
      className="ops-card p-5 sm:p-6 border-brand-border/80 bg-brand-surface relative overflow-hidden"
    >
      <div className="flex items-center justify-between gap-3 mb-6 pb-3 border-b border-brand-border/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono text-indigo-400 font-bold">05</span>
            <h2 id="timeline-heading" className="text-base font-bold text-slate-100">
              Investigation Timeline
            </h2>
          </div>
          <p className="text-xs text-brand-muted mt-0.5">
            Chronological audit trail of diagnostic actions, memory queries, and findings.
          </p>
        </div>
        <span className="text-xs font-mono text-brand-muted">
          {sorted.length} {sorted.length === 1 ? 'event' : 'events'} logged
        </span>
      </div>

      <ol aria-label="Investigation timeline" className="relative space-y-0 pl-1">
        {sorted.map((entry, i) => {
          const { color, bg, border, label, icon } =
            actorStyle[entry.actor] || actorStyle.system;
          const time = new Date(entry.timestamp).toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });
          const isLast = i === sorted.length - 1;

          // Check if event has a status tag (WORKED / FAILED / STARTED)
          const isWorked = entry.event.includes('WORKED');
          const isFailed = entry.event.includes('FAILED');
          const isStarted = entry.event.includes('STARTED');

          return (
            <li key={entry.id} className="flex gap-4 pb-6 relative group">
              {/* Vertical Spine */}
              <div className="flex flex-col items-center w-6 flex-shrink-0">
                <span
                  className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center text-[8px] z-10 transition-transform duration-200 group-hover:scale-125 ${
                    isWorked
                      ? 'border-emerald-400 bg-emerald-950'
                      : isFailed
                      ? 'border-rose-400 bg-rose-950'
                      : isStarted
                      ? 'border-cyan-400 bg-cyan-950'
                      : 'border-indigo-400 bg-indigo-950'
                  }`}
                  aria-hidden="true"
                />
                {!isLast && (
                  <div
                    className="w-px flex-1 bg-gradient-to-b from-brand-border via-brand-border to-brand-border/40 mt-1"
                    aria-hidden="true"
                  />
                )}
              </div>

              {/* Event Content */}
              <div className="flex-1 min-w-0 pb-1 -mt-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <time
                    dateTime={entry.timestamp}
                    className="text-xs font-mono text-slate-400 font-semibold tabular-nums"
                  >
                    {time}
                  </time>
                  <span
                    className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${color} ${bg} ${border} tracking-wider`}
                  >
                    {icon} {label}
                  </span>

                  {isWorked && (
                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      WORKED
                    </span>
                  )}
                  {isFailed && (
                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">
                      FAILED
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-[13px] text-slate-200 leading-snug font-medium">
                  {entry.event}
                </p>

                {entry.detail && (
                  <div className="mt-2 p-2.5 rounded-md bg-brand-surface-2/60 border border-brand-border/60 text-xs font-mono text-slate-300 leading-relaxed">
                    {entry.detail}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

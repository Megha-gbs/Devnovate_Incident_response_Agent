'use client';

import { useRouter } from 'next/navigation';
import type { Incident } from '@/types';
import SeverityBadge from './SeverityBadge';
import StatusBadge from './StatusBadge';

interface IncidentCardProps {
  incident: Incident;
  variant?: 'card' | 'row';
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

export default function IncidentCard({ incident, variant = 'row' }: IncidentCardProps) {
  const router = useRouter();

  const isInvestigating =
    incident.status === 'active' && !!incident.investigation;

  const displayStatus = isInvestigating ? 'investigating' : incident.status;

  if (variant === 'row') {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => router.push(`/incidents/${incident.id}`)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            router.push(`/incidents/${incident.id}`);
          }
        }}
        className="group relative flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-xl bg-[#0e1629] hover:bg-[#131e36] border border-[#1e2d4d] hover:border-brand-accent/50 hover:shadow-brand-md transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-accent"
        aria-label={`Open incident ${incident.id}: ${incident.title}`}
      >
        {/* Left: ID, Title, Service, Timestamps */}
        <div className="flex items-start md:items-center gap-3.5 min-w-0 flex-1">
          <div className="flex-shrink-0 flex items-center justify-center w-18 px-2.5 py-1.5 rounded-lg bg-[#070a12] border border-[#1e2d4d] group-hover:border-brand-accent/40 transition-colors">
            <span className="font-mono text-xs font-bold text-brand-cyan tracking-wider">
              {incident.id}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="text-sm font-bold text-white group-hover:text-brand-cyan transition-colors truncate">
                {incident.title}
              </h3>
              {incident.investigation && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-brand-cyan bg-[#083344] px-2 py-0.5 rounded border border-brand-cyan/30">
                  <span className="text-[11px]">🧠</span>
                  <span>{incident.investigation.memory.length} memories</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-[#64748b]">
              <span className="text-[#94a3b8] font-medium flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-[#475569]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                </svg>
                {incident.service}
              </span>
              <span>·</span>
              <span className="font-mono text-[#64748b]">{relativeTime(incident.timestamp)}</span>
            </div>
          </div>
        </div>

        {/* Right: Badges & CTA */}
        <div className="flex items-center justify-between md:justify-end gap-3 flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#1a2947]">
          <div className="flex items-center gap-2">
            <SeverityBadge severity={incident.severity} size="sm" />
            <StatusBadge status={displayStatus} size="sm" />
          </div>

          <div className="p-1 rounded-lg text-[#475569] group-hover:text-brand-cyan group-hover:translate-x-0.5 transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  // Card Variant
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/incidents/${incident.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          router.push(`/incidents/${incident.id}`);
        }
      }}
      className="ops-card p-5 hover:border-brand-accent/50 hover:shadow-brand-md transition-all duration-200 cursor-pointer flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-brand-accent"
      aria-label={`Open incident ${incident.id}: ${incident.title}`}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="font-mono text-xs font-bold text-brand-cyan bg-[#070a12] px-2.5 py-1 rounded-md border border-[#1e2d4d]">
            {incident.id}
          </span>
          <SeverityBadge severity={incident.severity} size="xs" />
        </div>

        <h3 className="text-sm font-bold text-white mb-1.5 hover:text-brand-cyan transition-colors line-clamp-2">
          {incident.title}
        </h3>
        <p className="text-xs text-[#94a3b8] mb-4 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#475569]" />
          {incident.service}
        </p>
      </div>

      <div className="pt-3 border-t border-[#1a2947] flex items-center justify-between gap-2">
        <StatusBadge status={displayStatus} size="xs" />
        <span className="text-[11px] font-mono text-[#64748b]">
          {relativeTime(incident.timestamp)}
        </span>
      </div>
    </div>
  );
}


'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useIncidents } from '@/hooks/useIncidents';
import { setMockMode } from '@/lib/api/client';
import StatCard from './StatCard';
import IncidentCard from '@/components/incidents/IncidentCard';

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse" aria-label="Loading dashboard...">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-2">
        <div className="skeleton h-8 w-64 rounded-lg" />
        <div className="skeleton h-4 w-96 rounded-md" />
      </div>

      {/* KPI Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="ops-card p-5 space-y-4">
            <div className="skeleton h-4 w-28 rounded" />
            <div className="skeleton h-9 w-16 rounded-md" />
            <div className="skeleton h-3 w-32 rounded" />
          </div>
        ))}
      </div>

      {/* Telemetry Bar Skeleton */}
      <div className="ops-card p-5 space-y-3">
        <div className="skeleton h-4 w-48 rounded" />
        <div className="skeleton h-3 w-full rounded" />
      </div>

      {/* Table Skeleton */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="ops-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="skeleton h-8 w-20 rounded-md" />
              <div className="space-y-2">
                <div className="skeleton h-4 w-56 rounded" />
                <div className="skeleton h-3 w-32 rounded" />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="skeleton h-6 w-20 rounded-full" />
              <div className="skeleton h-6 w-24 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardClient() {
  const { incidents, loading, error, retry, isMock } = useIncidents();
  const [filter, setFilter] = useState<'all' | 'critical' | 'investigating' | 'resolved'>('all');
  const [tableSearch, setTableSearch] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center ops-card border-red-800/40" role="alert">
        <div className="w-14 h-14 rounded-2xl bg-red-950/80 border border-red-800/60 flex items-center justify-center mb-4 text-red-400 shadow-brand-md">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        {error.status > 0 && (
          <span className="font-mono text-xs text-red-400 font-semibold bg-red-950/60 px-2.5 py-1 rounded-md border border-red-800/50 mb-2">
            HTTP {error.status}
          </span>
        )}
        <h2 className="text-lg font-bold text-white mb-2">Unable to Load Incidents</h2>
        <p className="text-sm text-[#94a3b8] max-w-md mb-6 leading-relaxed">
          {error.message}
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={retry}
            className="btn-primary text-xs"
            aria-label="Retry loading incidents"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Try Again
          </button>
          {!isMock && (
            <button
              onClick={() => setMockMode(true)}
              className="btn-secondary text-xs"
              title="Switch to isolated mock data to preview without active backend"
            >
              Switch to Mock Data
            </button>
          )}
        </div>
      </div>
    );
  }

  const activeIncidents = incidents.filter((i) => i.status === 'active');
  const resolvedIncidents = incidents.filter((i) => i.status === 'resolved');
  const criticalIncidents = incidents.filter((i) => i.severity === 'P1' && i.status === 'active');
  const investigatingIncidents = incidents.filter((i) => i.status === 'active' && !!i.investigation);

  // Severity Distribution counts
  const p1Count = incidents.filter((i) => i.severity === 'P1').length;
  const p2Count = incidents.filter((i) => i.severity === 'P2').length;
  const p3Count = incidents.filter((i) => i.severity === 'P3').length;
  const p4Count = incidents.filter((i) => i.severity === 'P4').length;
  const total = incidents.length || 1;

  // Filter and sort incidents
  const filtered = incidents.filter((inc) => {
    if (filter === 'critical') return inc.severity === 'P1' && inc.status === 'active';
    if (filter === 'investigating') return inc.status === 'active' && !!inc.investigation;
    if (filter === 'resolved') return inc.status === 'resolved';
    return true;
  }).filter((inc) => {
    if (!tableSearch.trim()) return true;
    const q = tableSearch.toLowerCase();
    return (
      inc.title.toLowerCase().includes(q) ||
      inc.id.toLowerCase().includes(q) ||
      inc.service.toLowerCase().includes(q)
    );
  });

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  return (
    <div className="space-y-8" aria-live="polite">
      {/* Header section with operational status */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#1e2d4d]/60">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ops-pulse-dot" />
            <span className="text-xs font-bold font-mono tracking-widest uppercase text-brand-cyan">
              SRE CONTROL CENTER
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Incident Intelligence
          </h1>
          <p className="text-xs md:text-sm text-[#94a3b8] mt-1">
            Monitor active incidents and investigate using organizational memory.
            {isMock && (
              <span className="ml-2 inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-800/50">
                Mock Environment
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/incidents/new"
            className="btn-primary text-xs md:text-sm font-semibold px-4 py-2.5 shadow-brand-accent"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create Incident
          </Link>
        </div>
      </header>

      {/* KPI Section with Strong Visual Hierarchy */}
      <section aria-label="Incident summary statistics">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="ACTIVE INCIDENTS"
            value={activeIncidents.length}
            accent="active"
            sublabel="Open incidents requiring action"
            badge="Live"
          />
          <StatCard
            label="CRITICAL"
            value={criticalIncidents.length}
            accent="critical"
            sublabel="P1 critical severity events"
            badge="Immediate"
          />
          <StatCard
            label="INVESTIGATING"
            value={investigatingIncidents.length}
            accent="investigating"
            sublabel="AI memory analysis in progress"
            badge="AI Assisted"
          />
          <StatCard
            label="RESOLVED"
            value={resolvedIncidents.length}
            accent="resolved"
            sublabel="Historical incidents archived"
            badge="Retained"
          />
        </div>
      </section>

      {/* Meaningful SRE Telemetry Bar */}
      <section className="ops-card p-5 space-y-4" aria-label="Operational telemetry">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <svg className="w-4 h-4 text-brand-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
              </svg>
              Severity Telemetry &amp; Memory Utilization
            </h2>
            <p className="text-xs text-[#64748b] mt-0.5">
              Live proportion of operational severity levels across monitored clusters
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-red-400">
              <span className="w-2 h-2 rounded-full bg-red-500" /> P1: {p1Count}
            </span>
            <span className="flex items-center gap-1.5 text-orange-400">
              <span className="w-2 h-2 rounded-full bg-orange-500" /> P2: {p2Count}
            </span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> P3: {p3Count}
            </span>
            <span className="flex items-center gap-1.5 text-sky-400">
              <span className="w-2 h-2 rounded-full bg-sky-400" /> P4: {p4Count}
            </span>
          </div>
        </div>

        {/* Severity Progress Distribution Bar */}
        <div className="h-2.5 w-full bg-[#080d1a] rounded-full overflow-hidden flex border border-[#1e2d4d]">
          {p1Count > 0 && (
            <div
              style={{ width: `${(p1Count / total) * 100}%` }}
              className="bg-red-500 transition-all duration-500"
              title={`P1: ${p1Count}`}
            />
          )}
          {p2Count > 0 && (
            <div
              style={{ width: `${(p2Count / total) * 100}%` }}
              className="bg-orange-500 transition-all duration-500"
              title={`P2: ${p2Count}`}
            />
          )}
          {p3Count > 0 && (
            <div
              style={{ width: `${(p3Count / total) * 100}%` }}
              className="bg-amber-500 transition-all duration-500"
              title={`P3: ${p3Count}`}
            />
          )}
          {p4Count > 0 && (
            <div
              style={{ width: `${(p4Count / total) * 100}%` }}
              className="bg-sky-400 transition-all duration-500"
              title={`P4: ${p4Count}`}
            />
          )}
        </div>
      </section>

      {/* Incident List Section */}
      <section aria-label="Incident directory table" className="space-y-4">
        {/* Table Controls: Filter pills, Search, View Mode */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'all', label: 'All Incidents', count: incidents.length },
              { id: 'critical', label: 'Critical P1', count: criticalIncidents.length },
              { id: 'investigating', label: 'Investigating', count: investigatingIncidents.length },
              { id: 'resolved', label: 'Resolved', count: resolvedIncidents.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as typeof filter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  filter === tab.id
                    ? 'bg-brand-accent text-white shadow-brand-sm'
                    : 'bg-[#0d1527] text-[#94a3b8] hover:text-white border border-[#1e2d4d]'
                }`}
              >
                {tab.label}
                <span className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] ${
                  filter === tab.id ? 'bg-white/20 text-white' : 'bg-[#141f38] text-[#64748b]'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Filter table..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="ops-input py-1.5 pl-8 pr-3 text-xs w-48 focus:w-60 transition-all"
              />
              <svg
                className="w-3.5 h-3.5 text-[#64748b] absolute left-2.5 top-1/2 -translate-y-1/2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <div className="flex items-center bg-[#0d1527] p-0.5 rounded-lg border border-[#1e2d4d]">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md ${
                  viewMode === 'table' ? 'bg-[#141f38] text-white' : 'text-[#64748b] hover:text-white'
                }`}
                title="List view"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md ${
                  viewMode === 'grid' ? 'bg-[#141f38] text-white' : 'text-[#64748b] hover:text-white'
                }`}
                title="Grid view"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Content View */}
        {sorted.length === 0 ? (
          <div className="ops-card p-12 text-center" role="status">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#101b33] border border-[#1e2d4d] flex items-center justify-center text-brand-cyan mb-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              No matching incidents found
            </h3>
            <p className="text-xs text-[#64748b] max-w-sm mx-auto mb-5">
              {tableSearch
                ? `No incidents matched query "${tableSearch}". Try clearing your search.`
                : "You're all clear. No incidents currently match this filter criteria."}
            </p>
            {tableSearch ? (
              <button
                onClick={() => setTableSearch('')}
                className="btn-secondary text-xs"
              >
                Clear Search Filter
              </button>
            ) : (
              <Link href="/incidents/new" className="btn-primary text-xs">
                + Create Incident
              </Link>
            )}
          </div>
        ) : viewMode === 'table' ? (
          <div className="space-y-2">
            {sorted.map((incident) => (
              <IncidentCard key={incident.id} incident={incident} variant="row" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sorted.map((incident) => (
              <IncidentCard key={incident.id} incident={incident} variant="card" />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}


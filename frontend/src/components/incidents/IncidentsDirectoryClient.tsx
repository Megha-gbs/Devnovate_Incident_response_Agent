'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useIncidents } from '@/hooks/useIncidents';
import IncidentCard from './IncidentCard';
import type { Severity } from '@/types';

export default function IncidentsDirectoryClient() {
  const { incidents, loading, error, retry } = useIncidents();
  const [severityFilter, setSeverityFilter] = useState<Severity | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'active' | 'resolved'>('ALL');
  const [serviceFilter, setServiceFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="skeleton h-8 w-60 rounded-md" />
        <div className="skeleton h-12 w-full rounded-xl" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="ops-card p-4 h-20" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ops-card p-8 text-center space-y-4 max-w-lg mx-auto my-12">
        <div className="w-12 h-12 rounded-full bg-red-950/80 text-red-400 mx-auto flex items-center justify-center">
          !
        </div>
        <h2 className="text-lg font-bold text-white">Failed to Load Incident Directory</h2>
        <p className="text-xs text-[#94a3b8]">{error.message}</p>
        <button onClick={retry} className="btn-primary text-xs">
          Retry
        </button>
      </div>
    );
  }

  // Collect distinct services
  const distinctServices = Array.from(new Set(incidents.map((i) => i.service)));

  const filtered = incidents.filter((inc) => {
    if (severityFilter !== 'ALL' && inc.severity !== severityFilter) return false;
    if (statusFilter !== 'ALL' && inc.status !== statusFilter) return false;
    if (serviceFilter !== 'ALL' && inc.service !== serviceFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        inc.title.toLowerCase().includes(q) ||
        inc.id.toLowerCase().includes(q) ||
        inc.service.toLowerCase().includes(q) ||
        inc.symptoms.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Directory Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1e2d4d]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-brand-cyan tracking-wider uppercase">
              Incident Registry
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Incident Directory
          </h1>
          <p className="text-xs text-[#94a3b8] mt-1">
            Historical and active operational events across all monitored services.
          </p>
        </div>

        <Link href="/incidents/new" className="btn-primary text-xs font-semibold px-4 py-2 self-start sm:self-auto">
          + New Incident
        </Link>
      </header>

      {/* Multi-Criteria Filters Bar */}
      <div className="ops-card p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <svg
              className="w-4 h-4 text-[#64748b] absolute left-3 top-1/2 -translate-y-1/2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search across ID, title, service, symptoms..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ops-input pl-9 text-xs"
            />
          </div>

          {/* Service Dropdown */}
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="ops-input text-xs w-full md:w-44 bg-[#0d1527]"
            aria-label="Filter by affected service"
          >
            <option value="ALL">All Services</option>
            {distinctServices.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Status Select */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="ops-input text-xs w-full md:w-36 bg-[#0d1527]"
            aria-label="Filter by status"
          >
            <option value="ALL">All Statuses</option>
            <option value="active">Active</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        {/* Severity Quick Filters */}
        <div className="flex items-center gap-2 pt-2 border-t border-[#1a2947] flex-wrap">
          <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider mr-1">
            Severity:
          </span>
          {(['ALL', 'P1', 'P2', 'P3', 'P4'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-all ${
                severityFilter === sev
                  ? 'bg-brand-accent text-white shadow-brand-sm'
                  : 'bg-[#0d1527] text-[#94a3b8] hover:text-white border border-[#1e2d4d]'
              }`}
            >
              {sev}
            </button>
          ))}
          {(severityFilter !== 'ALL' || statusFilter !== 'ALL' || serviceFilter !== 'ALL' || search) && (
            <button
              onClick={() => {
                setSeverityFilter('ALL');
                setStatusFilter('ALL');
                setServiceFilter('ALL');
                setSearch('');
              }}
              className="ml-auto text-xs text-brand-cyan hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Directory List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-[#64748b] px-1 font-medium">
          <span>Showing {filtered.length} of {incidents.length} incidents</span>
        </div>

        {filtered.length === 0 ? (
          <div className="ops-card p-12 text-center" role="status">
            <p className="text-sm font-semibold text-white mb-1">No incidents found</p>
            <p className="text-xs text-[#64748b] mb-4">No incidents match your selected criteria.</p>
            <button
              onClick={() => {
                setSeverityFilter('ALL');
                setStatusFilter('ALL');
                setServiceFilter('ALL');
                setSearch('');
              }}
              className="btn-secondary text-xs"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((inc) => (
              <IncidentCard key={inc.id} incident={inc} variant="row" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

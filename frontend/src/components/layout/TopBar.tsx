'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { isMockMode, setMockMode } from '@/lib/api/client';
import { mockIncidents } from '@/lib/mock';

interface TopBarProps {
  onMenuToggle: () => void;
  isMock?: boolean;
}

function getPageContext(pathname: string): { title: string; subtitle?: string } {
  if (pathname === '/') return { title: 'Incident Intelligence', subtitle: 'Command Dashboard' };
  if (pathname === '/incidents') return { title: 'Incident Directory', subtitle: 'All Events' };
  if (pathname === '/incidents/new') return { title: 'Create Incident', subtitle: 'New Investigation' };
  if (pathname.startsWith('/incidents/')) {
    const id = pathname.split('/')[2];
    return { title: `Incident #${id}`, subtitle: 'Active SRE Workspace' };
  }
  return { title: 'OPSMIND', subtitle: 'Incident Intelligence' };
}

export default function TopBar({ onMenuToggle }: TopBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { title, subtitle } = getPageContext(pathname);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mockActive, setMockActive] = useState(true);

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMockActive(isMockMode());
    const handleModeChange = () => setMockActive(isMockMode());
    window.addEventListener('opsmind:mode_changed', handleModeChange);
    return () => window.removeEventListener('opsmind:mode_changed', handleModeChange);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut Ctrl+K / Cmd+K for search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        const input = document.getElementById('topbar-search-input');
        input?.focus();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const searchResults = searchQuery.trim()
    ? mockIncidents.filter(
        (i) =>
          i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          i.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          i.service.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : [];

  const notifications = [
    {
      id: 'notif-1',
      title: 'Memory matched for INC-024',
      time: '12m ago',
      detail: '3 historical incidents with 92% similarity identified',
      type: 'ai',
    },
    {
      id: 'notif-2',
      title: 'P1 Incident Created: Payment API 502',
      time: '14m ago',
      detail: 'Elevated error rates detected across checkout pods',
      type: 'critical',
    },
    {
      id: 'notif-3',
      title: 'INC-021 Knowledge Retained',
      time: '4h ago',
      detail: 'Redis cache eviction patterns saved to organizational memory',
      type: 'memory',
    },
  ];

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-[#0a0f1d]/90 backdrop-blur-md border-b border-[#1e2d4d]">
      {/* Left: Mobile hamburger + Breadcrumb Context */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg text-[#64748b] hover:text-white hover:bg-[#141f38] transition-colors focus:ring-2 focus:ring-brand-accent"
          aria-label="Open sidebar navigation"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>

        <div className="flex items-center gap-2.5">
          <Link href="/" className="lg:hidden flex items-center gap-2 group mr-1" aria-label="OPSMIND Home">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-brand-accent to-brand-cyan flex items-center justify-center p-1.5 shadow-brand-sm">
              <span className="text-white text-xs font-black">OM</span>
            </div>
          </Link>

          <div>
            <div className="flex items-center gap-2 text-xs text-[#64748b]">
              <span className="font-semibold tracking-wider uppercase text-brand-cyan">OPSMIND</span>
              <span className="text-[#334155]">/</span>
              <span className="text-[#94a3b8] font-medium">{subtitle}</span>
            </div>
            <h1 className="text-sm md:text-base font-bold text-white tracking-tight leading-tight">
              {title}
            </h1>
          </div>
        </div>
      </div>

      {/* Right: Search, Status, Mode, Notifications, + New Incident */}
      <div className="flex items-center gap-2.5 md:gap-3">
        {/* Global Search Bar */}
        <div className="relative" ref={searchRef}>
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              id="topbar-search-input"
              type="text"
              placeholder="Search incidents (Ctrl+K)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              className="w-36 sm:w-56 md:w-64 bg-[#0d1527] border border-[#1e2d4d] focus:border-brand-accent focus:bg-[#101b33] rounded-lg pl-9 pr-8 py-1.5 text-xs text-[#e2e8f0] placeholder-[#475569] transition-all focus:outline-none focus:ring-1 focus:ring-brand-accent"
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-white"
                aria-label="Clear search"
              >
                ✕
              </button>
            ) : (
              <span className="hidden sm:inline absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[#475569] bg-[#141f38] px-1 py-0.5 rounded border border-[#1e2d4d]">
                ⌘K
              </span>
            )}
          </div>

          {/* Search Results Dropdown */}
          {searchOpen && searchQuery.trim() && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 ops-card p-2 shadow-brand-lg z-50 animate-in fade-in slide-in-from-top-1">
              <div className="px-2.5 py-1.5 text-[10px] font-bold text-[#64748b] uppercase tracking-wider border-b border-[#1e2d4d] mb-1">
                Incidents Matching &ldquo;{searchQuery}&rdquo; ({searchResults.length})
              </div>
              {searchResults.length === 0 ? (
                <div className="p-4 text-center text-xs text-[#64748b]">
                  No matching incidents found for this query.
                </div>
              ) : (
                <div className="space-y-1 max-h-72 overflow-y-auto">
                  {searchResults.map((inc) => (
                    <button
                      key={inc.id}
                      onClick={() => {
                        router.push(`/incidents/${inc.id}`);
                        setSearchOpen(false);
                        setSearchQuery('');
                      }}
                      className="w-full text-left p-2 rounded-md hover:bg-[#141f38] transition-colors flex items-start gap-2.5 group"
                    >
                      <span className="font-mono text-[10px] text-brand-cyan bg-[#083344] px-1.5 py-0.5 rounded border border-brand-cyan/20">
                        {inc.id}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white group-hover:text-brand-cyan truncate">
                          {inc.title}
                        </p>
                        <p className="text-[10px] text-[#64748b] mt-0.5">
                          {inc.service} · {inc.severity} · {inc.status}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Operational System Indicator */}
        <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#0d1527] border border-[#1e2d4d] text-[11px] text-[#94a3b8]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-medium">Ops Active</span>
        </div>

        {/* Mode Indicator & Switcher */}
        <button
          onClick={() => setMockMode(!mockActive)}
          className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all border ${
            mockActive
              ? 'bg-amber-950/60 text-amber-400 border-amber-800/50 hover:bg-amber-900/60'
              : 'bg-emerald-950/60 text-emerald-400 border-emerald-800/50 hover:bg-emerald-900/60'
          }`}
          title="Click to toggle between Mock Data and Live API Mode"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${mockActive ? 'bg-amber-400' : 'bg-emerald-400'}`} />
          {mockActive ? 'Mock Mode' : 'Live API'}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 rounded-lg text-[#94a3b8] hover:text-white bg-[#0d1527] hover:bg-[#141f38] border border-[#1e2d4d] transition-colors"
            aria-label="View system notifications"
            aria-expanded={notifOpen}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-brand-cyan" />
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-88 ops-card p-3 shadow-brand-lg z-50">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1e2d4d]">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Incident Intelligence Stream
                </span>
                <span className="text-[10px] text-brand-cyan font-mono">3 new</span>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className="p-2.5 rounded-lg bg-[#0d1527] border border-[#1a2947] hover:border-brand-accent/40 transition-colors">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-xs font-semibold text-white leading-tight">{n.title}</p>
                      <span className="text-[10px] text-[#64748b] flex-shrink-0">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-[#94a3b8] leading-relaxed">{n.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Primary CTA: + New Incident */}
        <Link
          href="/incidents/new"
          className="btn-primary text-xs font-semibold px-3 sm:px-4 py-2"
          aria-label="Create new incident"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span className="hidden sm:inline">New Incident</span>
          <span className="sm:hidden">New</span>
        </Link>
      </div>
    </header>
  );
}


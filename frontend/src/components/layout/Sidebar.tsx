'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const navItems = [
  {
    label: 'Dashboard',
    href: '/',
    exactMatch: true,
    badge: 'Realtime',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    label: 'Incidents',
    href: '/incidents',
    exactMatch: false,
    badge: 'Ops',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
  },
];

const futureItems = [
  {
    label: 'Memory Matrix',
    desc: 'Organizational Vector Store',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
  },
  {
    label: 'Analytics & Trends',
    desc: 'MTTR & Recurrence Rates',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    label: 'Settings',
    desc: 'Integrations & Webhooks',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

function OpsMindBrandMark() {
  return (
    <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-accent via-indigo-500 to-brand-cyan shadow-brand-accent p-0.5">
      <div className="w-full h-full bg-[#070a12] rounded-[10px] flex items-center justify-center">
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="url(#logo-grad)" strokeWidth="1.75" />
          <circle cx="7" cy="12" r="2.25" fill="#4f46e5" />
          <circle cx="17" cy="12" r="2.25" fill="#06b6d4" />
          <circle cx="12" cy="7" r="1.75" fill="#818cf8" />
          <path d="M7 12L17 12" stroke="#818cf8" strokeWidth="1.25" strokeDasharray="2 2" />
          <path d="M7 12L12 7L17 12" stroke="#06b6d4" strokeWidth="1.25" opacity="0.8" />
          <defs>
            <linearGradient id="logo-grad" x1="3" y1="3" x2="21" y2="21">
              <stop stopColor="#4f46e5" />
              <stop offset="1" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  const sidebarContent = (
    <aside
      className="flex flex-col h-full w-64 bg-[#0a0f1d] border-r border-[#1e2d4d] select-none"
      aria-label="Main navigation"
    >
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#1e2d4d]">
        <OpsMindBrandMark />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-white font-extrabold text-sm tracking-wider uppercase font-mono">
              OPSMIND
            </span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-brand-cyan bg-[#083344] px-1.5 py-0.2 rounded border border-brand-cyan/30">
              AI
            </span>
          </div>
          <p className="text-[#64748b] text-[11px] font-medium tracking-tight truncate">
            Incident Intelligence
          </p>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto" aria-label="Primary navigation">
        <div>
          <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-[#475569]">
            Operations
          </p>
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = item.exactMatch
                ? pathname === item.href
                : pathname === item.href || (item.href === '/incidents' && pathname.startsWith('/incidents'));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-gradient-to-r from-brand-accent/25 to-brand-accent/5 text-white border border-brand-accent/40 shadow-brand-sm'
                      : 'text-[#94a3b8] hover:text-white hover:bg-[#141f38] border border-transparent'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span
                    className={`transition-colors ${
                      isActive ? 'text-brand-cyan' : 'text-[#64748b] group-hover:text-white'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="flex-1">{item.label}</span>
                  {isActive ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan ops-pulse-dot" aria-hidden="true" />
                  ) : (
                    <span className="text-[10px] text-[#475569] font-mono group-hover:text-[#64748b]">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Future Modules — Clearly "Coming Soon" */}
        <div className="pt-2">
          <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-[#475569]">
            Knowledge &amp; Intelligence
          </p>
          <div className="space-y-1">
            {futureItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs text-[#475569] hover:bg-[#0e1629]/50 cursor-not-allowed group transition-colors"
                title={`${item.label} (${item.desc}) — Coming Soon in v1.3`}
              >
                <span className="text-[#334155]">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#64748b] truncate">{item.label}</p>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider bg-[#101b33] text-[#475569] px-1.5 py-0.5 rounded border border-[#1e2d4d]">
                  Soon
                </span>
              </div>
            ))}
          </div>
        </div>
      </nav>

      {/* Organizational Memory Status Footer */}
      <div className="p-3 mx-3 mb-3 rounded-lg bg-[#0d1527] border border-[#1e2d4d]">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse" />
          <span className="text-[11px] font-bold text-white uppercase tracking-wider">
            Org Memory Engine
          </span>
        </div>
        <p className="text-[10px] text-[#94a3b8] leading-tight">
          3 historical incidents indexed with full resolution vectors.
        </p>
        <div className="mt-2.5 pt-2 border-t border-[#1a2947] flex items-center justify-between text-[10px] text-[#64748b]">
          <span>OPSMIND v1.2.0</span>
          <span className="text-emerald-400 font-medium">Ready</span>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop permanent sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">{sidebarContent}</div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation drawer">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={onClose} aria-hidden="true" />
          <div className="relative z-50 flex h-full">
            {sidebarContent}
            <button
              onClick={onClose}
              className="absolute top-4 right-3 p-1.5 rounded-lg bg-[#141f38] text-[#94a3b8] hover:text-white border border-[#1e2d4d] transition-colors"
              aria-label="Close navigation"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}


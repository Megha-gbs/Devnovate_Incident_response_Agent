interface StatCardProps {
  label: string;
  value: number | string;
  accent?: 'active' | 'critical' | 'investigating' | 'resolved';
  sublabel?: string;
  trend?: string;
  badge?: string;
}

const variants = {
  active: {
    container: 'border-indigo-800/40 bg-gradient-to-b from-[#111a33] to-[#0b1021]',
    glow: 'hover:shadow-[0_0_20px_rgba(99,102,241,0.2)]',
    valueText: 'text-white',
    badgeClass: 'bg-indigo-950/80 text-indigo-300 border-indigo-700/50',
    indicator: 'bg-indigo-400',
    icon: (
      <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
  critical: {
    container: 'border-red-800/50 bg-gradient-to-b from-[#240e14] to-[#0f0914]',
    glow: 'hover:shadow-[0_0_20px_rgba(239,68,68,0.25)]',
    valueText: 'text-red-400',
    badgeClass: 'bg-red-950/80 text-red-300 border-red-700/60',
    indicator: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]',
    icon: (
      <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
  },
  investigating: {
    container: 'border-cyan-800/40 bg-gradient-to-b from-[#0b2031] to-[#071321]',
    glow: 'hover:shadow-[0_0_20px_rgba(6,182,212,0.2)]',
    valueText: 'text-cyan-300',
    badgeClass: 'bg-cyan-950/80 text-cyan-300 border-cyan-700/50',
    indicator: 'bg-cyan-400',
    icon: (
      <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
  },
  resolved: {
    container: 'border-emerald-800/40 bg-gradient-to-b from-[#0b241c] to-[#061511]',
    glow: 'hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]',
    valueText: 'text-emerald-400',
    badgeClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/50',
    indicator: 'bg-emerald-400',
    icon: (
      <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
};

export default function StatCard({
  label,
  value,
  accent = 'active',
  sublabel,
  trend,
  badge,
}: StatCardProps) {
  const v = variants[accent] ?? variants.active;

  return (
    <div
      className={`relative p-5 rounded-xl border transition-all duration-200 ${v.container} ${v.glow}`}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-[#070a12]/60 border border-white/5">
            {v.icon}
          </span>
          <p className="text-xs font-bold uppercase tracking-wider text-[#94a3b8]">
            {label}
          </p>
        </div>
        {badge && (
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${v.badgeClass}`}>
            {badge}
          </span>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <p className={`text-3xl font-extrabold font-mono tracking-tight ${v.valueText}`}>
          {value}
        </p>
        {trend && (
          <span className="text-[11px] font-medium text-[#64748b] font-mono">
            {trend}
          </span>
        )}
      </div>

      {sublabel && (
        <p className="text-xs text-[#64748b] mt-2 font-medium flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${v.indicator}`} />
          {sublabel}
        </p>
      )}
    </div>
  );
}


import type { Severity } from '@/types';

interface SeverityBadgeProps {
  severity: Severity;
  size?: 'xs' | 'sm' | 'md';
}

const severityConfig: Record<
  Severity,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  P1: {
    label: 'CRITICAL',
    bg: 'bg-red-950/70',
    text: 'text-red-400',
    border: 'border-red-800/60',
    dot: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]',
  },
  P2: {
    label: 'HIGH',
    bg: 'bg-orange-950/70',
    text: 'text-orange-400',
    border: 'border-orange-800/60',
    dot: 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]',
  },
  P3: {
    label: 'MEDIUM',
    bg: 'bg-amber-950/70',
    text: 'text-amber-400',
    border: 'border-amber-800/60',
    dot: 'bg-amber-500',
  },
  P4: {
    label: 'LOW',
    bg: 'bg-sky-950/70',
    text: 'text-sky-400',
    border: 'border-sky-800/60',
    dot: 'bg-sky-400',
  },
};

export default function SeverityBadge({ severity, size = 'sm' }: SeverityBadgeProps) {
  const conf = severityConfig[severity] ?? severityConfig.P3;

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-[10px]',
    sm: 'px-2.5 py-1 text-[11px]',
    md: 'px-3 py-1 text-xs',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider font-mono rounded-full border ${conf.bg} ${conf.text} ${conf.border} ${sizeClasses}`}
      aria-label={`Severity: ${severity} — ${conf.label}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${conf.dot}`} aria-hidden="true" />
      <span>{severity}</span>
      <span className="opacity-60 text-[9px]">·</span>
      <span className="font-sans font-semibold tracking-normal lowercase capitalize">{conf.label.toLowerCase()}</span>
    </span>
  );
}


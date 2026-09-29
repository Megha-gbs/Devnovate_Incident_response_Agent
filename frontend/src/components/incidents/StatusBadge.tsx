type IncidentStatus = 'active' | 'investigating' | 'resolved' | 'failed' | 'pending';

interface StatusBadgeProps {
  status: IncidentStatus | string;
  size?: 'xs' | 'sm' | 'md';
}

const statusConfig: Record<
  string,
  { label: string; bg: string; text: string; border: string; dot: string; pulse?: boolean }
> = {
  investigating: {
    label: 'Investigating',
    bg: 'bg-indigo-950/70',
    text: 'text-indigo-300',
    border: 'border-indigo-700/60',
    dot: 'bg-indigo-400',
    pulse: true,
  },
  active: {
    label: 'Active',
    bg: 'bg-indigo-950/70',
    text: 'text-indigo-300',
    border: 'border-indigo-700/60',
    dot: 'bg-indigo-400',
    pulse: true,
  },
  resolved: {
    label: 'Resolved',
    bg: 'bg-emerald-950/70',
    text: 'text-emerald-300',
    border: 'border-emerald-700/60',
    dot: 'bg-emerald-400',
    pulse: false,
  },
  failed: {
    label: 'Failed',
    bg: 'bg-red-950/70',
    text: 'text-red-300',
    border: 'border-red-700/60',
    dot: 'bg-red-400',
    pulse: false,
  },
  pending: {
    label: 'Pending',
    bg: 'bg-slate-900/80',
    text: 'text-slate-400',
    border: 'border-slate-700/50',
    dot: 'bg-slate-500',
    pulse: false,
  },
};

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const conf = statusConfig[status.toLowerCase()] ?? statusConfig.active;

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-[10px]',
    sm: 'px-2.5 py-1 text-[11px]',
    md: 'px-3 py-1 text-xs',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border ${conf.bg} ${conf.text} ${conf.border} ${sizeClasses}`}
      aria-label={`Status: ${conf.label}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${conf.dot} ${
          conf.pulse ? 'animate-pulse' : ''
        }`}
        aria-hidden="true"
      />
      {conf.label}
    </span>
  );
}


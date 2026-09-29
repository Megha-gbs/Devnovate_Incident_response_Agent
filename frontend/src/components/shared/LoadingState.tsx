interface LoadingStateProps {
  variant?: 'skeleton' | 'spinner';
  shape?: 'card' | 'list' | 'page' | 'panel';
  label?: string;
}

function SkeletonCard() {
  return (
    <div className="card p-4 space-y-3" aria-hidden="true">
      <div className="skeleton h-4 w-3/4 rounded" />
      <div className="skeleton h-3 w-1/2 rounded" />
      <div className="skeleton h-3 w-2/3 rounded" />
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-2" aria-hidden="true">
      {[1, 2, 3].map((i) => (
        <div key={i} className="card p-4 flex items-center gap-4">
          <div className="skeleton h-3 w-3 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-2/3 rounded" />
            <div className="skeleton h-3 w-1/3 rounded" />
          </div>
          <div className="skeleton h-6 w-16 rounded" />
        </div>
      ))}
    </div>
  );
}

function SkeletonPage() {
  return (
    <div className="space-y-6" aria-hidden="true">
      {/* Header skeleton */}
      <div className="card p-6 space-y-3">
        <div className="skeleton h-6 w-1/3 rounded" />
        <div className="skeleton h-4 w-1/2 rounded" />
        <div className="flex gap-2 pt-1">
          <div className="skeleton h-6 w-16 rounded-full" />
          <div className="skeleton h-6 w-20 rounded-full" />
        </div>
      </div>
      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="space-y-4">
          <SkeletonCard />
        </div>
      </div>
    </div>
  );
}

function SkeletonPanel() {
  return (
    <div className="panel p-4 space-y-3" aria-hidden="true">
      <div className="skeleton h-4 w-1/2 rounded" />
      <div className="skeleton h-3 w-3/4 rounded" />
      <div className="skeleton h-3 w-2/3 rounded" />
      <div className="skeleton h-3 w-1/2 rounded" />
    </div>
  );
}

function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-3">
      <div
        className="w-8 h-8 border-2 border-brand-border border-t-brand-accent rounded-full animate-spin"
        aria-hidden="true"
      />
      {label && <p className="text-sm text-gray-400 animate-pulse">{label}</p>}
    </div>
  );
}

export default function LoadingState({
  variant = 'skeleton',
  shape = 'card',
  label,
}: LoadingStateProps) {
  const ariaLabel = label ?? 'Loading…';

  if (variant === 'spinner') {
    return (
      <div role="status" aria-label={ariaLabel}>
        <Spinner label={label} />
        <span className="sr-only">{ariaLabel}</span>
      </div>
    );
  }

  const skeleton =
    shape === 'list' ? <SkeletonList /> :
    shape === 'page' ? <SkeletonPage /> :
    shape === 'panel' ? <SkeletonPanel /> :
    <SkeletonCard />;

  return (
    <div role="status" aria-label={ariaLabel}>
      {skeleton}
      <span className="sr-only">{ariaLabel}</span>
    </div>
  );
}

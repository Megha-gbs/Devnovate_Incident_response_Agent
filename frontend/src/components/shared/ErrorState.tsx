'use client';

import React from 'react';

interface ErrorStateProps {
  message: string;
  statusCode?: number;
  onRetry?: () => void;
  fullPage?: boolean;
}

export default function ErrorState({
  message,
  statusCode,
  onRetry,
  fullPage = false,
}: ErrorStateProps) {
  const wrapper = fullPage
    ? 'flex flex-col items-center justify-center min-h-[60vh] py-16 px-4 text-center'
    : 'flex flex-col items-center justify-center py-12 px-4 text-center ops-card border-rose-500/30 bg-rose-950/10 my-4';

  return (
    <div className={wrapper} role="alert" aria-live="assertive">
      <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mb-4 mx-auto" aria-hidden="true">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      </div>

      {statusCode && (
        <span className="text-[11px] font-mono uppercase tracking-wider text-rose-400/80 mb-1 block">
          Telemetry Code {statusCode}
        </span>
      )}

      <h3 className="text-base font-bold text-slate-100 mb-1.5">
        Investigation Service Issue
      </h3>

      <p className="text-xs sm:text-sm text-brand-muted mb-5 max-w-md mx-auto leading-relaxed">
        {message}
      </p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="btn-secondary text-xs sm:text-sm py-2 px-4 flex items-center gap-2 border-slate-600 hover:border-slate-400"
          aria-label="Retry the failed operation"
        >
          <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Retry Operation</span>
        </button>
      )}
    </div>
  );
}

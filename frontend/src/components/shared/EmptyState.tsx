'use client';

import React from 'react';
import Link from 'next/link';

interface EmptyStateProps {
  message: string;
  detail?: string;
  ctaLabel?: string;
  ctaHref?: string;
  icon?: React.ReactNode;
}

export default function EmptyState({
  message,
  detail,
  ctaLabel,
  ctaHref,
  icon,
}: EmptyStateProps) {
  return (
    <div
      className="ops-card p-8 sm:p-12 flex flex-col items-center justify-center text-center my-6 border-dashed border-brand-border/80 bg-brand-surface/40"
      role="status"
    >
      <div className="w-14 h-14 rounded-2xl bg-brand-surface-2 border border-brand-border flex items-center justify-center mb-4 text-cyan-400 shadow-inner" aria-hidden="true">
        {icon ?? (
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
          </svg>
        )}
      </div>

      <h3 className="text-base font-bold text-slate-100 mb-1.5">{message}</h3>
      {detail && (
        <p className="text-xs sm:text-sm text-brand-muted mb-5 max-w-md mx-auto leading-relaxed">
          {detail}
        </p>
      )}

      {ctaHref && ctaLabel && (
        <Link
          href={ctaHref}
          className="btn-primary text-xs sm:text-sm py-2 px-4 shadow-lg shadow-indigo-950 flex items-center gap-2"
        >
          <span>{ctaLabel}</span>
          <span aria-hidden="true">&rarr;</span>
        </Link>
      )}
    </div>
  );
}

'use client';

import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onDismiss: () => void;
  /** Auto-dismiss after ms. Default 5000. Set to 0 to disable. */
  duration?: number;
}

const styles = {
  success: {
    container: 'bg-brand-surface-2/95 border-emerald-500/40 text-emerald-200 shadow-emerald-950/50',
    icon: (
      <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  error: {
    container: 'bg-brand-surface-2/95 border-rose-500/40 text-rose-200 shadow-rose-950/50',
    icon: (
      <svg className="w-5 h-5 text-rose-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
    ),
  },
  info: {
    container: 'bg-brand-surface-2/95 border-cyan-500/40 text-cyan-200 shadow-cyan-950/50',
    icon: (
      <svg className="w-5 h-5 text-cyan-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
      </svg>
    ),
  },
};

export default function Toast({ message, type, onDismiss, duration = 5000 }: ToastProps) {
  useEffect(() => {
    if (duration === 0) return;
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  const { container, icon } = styles[type];
  const isError = type === 'error';

  return (
    <div
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      aria-atomic="true"
      className={`fixed bottom-6 right-6 z-50 flex items-start gap-3 max-w-md w-full px-4 py-3.5 rounded-xl border backdrop-blur-md shadow-2xl transition-all animate-fade-in ${container}`}
    >
      {icon}
      <p className="flex-1 text-xs sm:text-sm font-medium leading-relaxed">{message}</p>
      <button
        onClick={onDismiss}
        className="flex-shrink-0 p-1 rounded-md text-slate-400 hover:text-slate-200 transition-colors"
        aria-label="Dismiss notification"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

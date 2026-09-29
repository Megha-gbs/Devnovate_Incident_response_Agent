'use client';

import React, { useState } from 'react';

interface SymptomListProps {
  symptoms: string;
  logs: string;
}

export default function SymptomList({ symptoms, logs }: SymptomListProps) {
  const [logsExpanded, setLogsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const symptomLines = symptoms
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  async function copyLogs() {
    try {
      await navigator.clipboard.writeText(logs);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  }

  return (
    <section
      aria-labelledby="symptoms-heading"
      className="ops-card p-5 border-brand-border/80 bg-brand-surface relative mb-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Symptoms Column */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <h2
              id="symptoms-heading"
              className="text-xs font-mono uppercase tracking-wider font-bold text-slate-300"
            >
              Reported Symptoms
            </h2>
          </div>

          {symptomLines.length > 0 ? (
            <ul className="space-y-2" aria-label="Symptom list">
              {symptomLines.map((line, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 p-2 rounded-lg bg-rose-950/15 border border-rose-500/20 text-xs text-slate-200"
                >
                  <span className="text-rose-400 font-bold mt-0.5">&bull;</span>
                  <span className="leading-relaxed">{line}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-brand-muted italic">No symptoms recorded.</p>
          )}
        </div>

        {/* Logs Column */}
        <div className="lg:col-span-7 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <h2 className="text-xs font-mono uppercase tracking-wider font-bold text-slate-300">
                Diagnostic Logs
              </h2>
            </div>

            {logs && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={copyLogs}
                  className="px-2.5 py-1 text-[11px] font-mono font-medium rounded border border-brand-border bg-brand-base text-slate-300 hover:text-cyan-400 transition-colors flex items-center gap-1.5"
                  aria-label="Copy logs"
                >
                  {copied ? (
                    <>
                      <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>Copy</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setLogsExpanded((v) => !v)}
                  className="px-2.5 py-1 text-[11px] font-mono font-medium rounded border border-brand-border bg-brand-base text-slate-300 hover:text-cyan-400 transition-colors"
                  aria-label={logsExpanded ? 'Collapse logs' : 'Expand logs'}
                >
                  {logsExpanded ? 'Collapse' : 'Expand'}
                </button>
              </div>
            )}
          </div>

          {logs ? (
            <div className="relative rounded-lg border border-brand-border/80 bg-brand-base overflow-hidden">
              <pre
                className={`p-3 text-[11px] font-mono text-slate-300 leading-relaxed overflow-x-auto transition-all duration-300 ${
                  logsExpanded ? 'max-h-[500px] overflow-y-auto' : 'max-h-[140px] overflow-y-hidden'
                }`}
                aria-label="Incident logs"
              >
                <code>{logs}</code>
              </pre>

              {!logsExpanded && (
                <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-brand-base to-transparent flex items-end justify-center pb-1">
                  <button
                    type="button"
                    onClick={() => setLogsExpanded(true)}
                    className="text-[10px] font-mono font-semibold text-cyan-400 hover:text-cyan-300 bg-brand-surface/90 px-2 py-0.5 rounded border border-cyan-500/30"
                  >
                    Show full log ↓
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-brand-muted italic p-3 rounded bg-brand-base/50">
              No logs attached to this incident.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

'use client';

import React from 'react';
import type { Incident } from '@/types';
import { useInvestigation } from '@/hooks/useInvestigation';
import MemoryPanel from './MemoryPanel';
import HypothesisCard from './HypothesisCard';
import InvestigationStepsPanel from './InvestigationStepsPanel';
import InvestigationTimeline from './InvestigationTimeline';

interface AIInvestigationSectionProps {
  incident: Incident;
  investigation?: import('@/types').Investigation | null;
  analyzing?: boolean;
  error?: import('@/types').ApiError | null;
  onAnalyze?: () => Promise<void>;
  onUpdateStep?: (
    stepId: string,
    status: import('@/types').InvestigationStep['status'],
    notes?: string,
  ) => Promise<void>;
  onIncidentUpdate?: React.Dispatch<React.SetStateAction<Incident | null>>;
}

export default function AIInvestigationSection({
  incident,
  investigation: propInvestigation,
  analyzing: propAnalyzing,
  error: propError,
  onAnalyze: propOnAnalyze,
  onUpdateStep: propOnUpdateStep,
}: AIInvestigationSectionProps) {
  const hookResult = useInvestigation(
    incident.id,
    incident.investigation,
  );

  const investigation = propInvestigation !== undefined ? propInvestigation : hookResult.investigation;
  const analyzing = propAnalyzing !== undefined ? propAnalyzing : hookResult.analyzing;
  const error = propError !== undefined ? propError : hookResult.error;
  const analyze = propOnAnalyze ?? hookResult.analyze;
  const handleUpdateStep = propOnUpdateStep ?? hookResult.updateStepStatus;

  const isComplete = investigation?.status === 'complete';
  const createdAt = investigation?.createdAt
    ? new Date(investigation.createdAt).toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  // Synthesize executive operational insight summary
  const summaryInsight =
    investigation?.summary ||
    (incident.service === 'Payment API'
      ? 'Payment API failures appear strongly correlated with elevated database connection usage. Historical incidents (INC-008, INC-014) suggest investigating connection pool saturation, missing connection releases, and recent deployment changes.'
      : `${incident.service} degradation displays telemetry patterns consistent with organizational memory. Recommended diagnostic sequence prioritizes connection verification and configuration diffs.`);

  return (
    <div className="space-y-6">
      {/* Investigation Control / Status Card */}
      <section
        aria-labelledby="ai-section-heading"
        className="ops-card p-5 sm:p-6 border-indigo-500/30 bg-gradient-to-b from-brand-surface to-brand-surface-2 relative overflow-hidden"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Status indicator orb */}
            <div className="relative">
              <span
                className={`w-3.5 h-3.5 rounded-full block ${
                  analyzing
                    ? 'bg-cyan-400 animate-ping'
                    : isComplete
                    ? 'bg-emerald-400 shadow-sm shadow-emerald-400'
                    : error
                    ? 'bg-rose-400'
                    : 'bg-indigo-400'
                }`}
              />
              <span
                className={`w-3.5 h-3.5 rounded-full block absolute top-0 left-0 ${
                  analyzing
                    ? 'bg-cyan-400'
                    : isComplete
                    ? 'bg-emerald-400'
                    : error
                    ? 'bg-rose-400'
                    : 'bg-indigo-400'
                }`}
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="ai-section-heading"
                  className="text-base sm:text-lg font-bold text-slate-100 tracking-tight"
                >
                  AI Investigation
                </h2>
                {isComplete && (
                  <span className="px-2 py-0.5 text-[11px] font-mono font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                    Analysis Complete
                  </span>
                )}
                {analyzing && (
                  <span className="px-2 py-0.5 text-[11px] font-mono font-semibold rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 animate-pulse">
                    Analyzing...
                  </span>
                )}
                {error && (
                  <span className="px-2 py-0.5 text-[11px] font-mono font-semibold rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">
                    Unavailable
                  </span>
                )}
              </div>
              <p className="text-xs text-brand-muted mt-0.5">
                {isComplete
                  ? `Completed at ${createdAt} · Vector memory correlated`
                  : analyzing
                  ? 'Searching organizational memory & correlating telemetry…'
                  : 'AI-assisted root cause analysis using cross-incident organizational memory'}
              </p>
            </div>
          </div>

          {/* Action Button */}
          {!analyzing && (
            <div>
              <button
                type="button"
                onClick={analyze}
                className="btn-primary text-xs sm:text-sm py-2 px-4 shadow-lg shadow-indigo-950 flex items-center gap-2"
                aria-label={isComplete ? 'Re-run AI Analysis' : 'Run AI Investigation'}
              >
                <svg
                  className="w-4 h-4 text-cyan-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                <span>{isComplete ? 'Re-run Analysis' : 'Analyze Incident'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Searching Memory Radar State */}
        {analyzing && (
          <div
            className="mt-6 p-6 rounded-xl border border-cyan-500/30 bg-cyan-950/10 flex flex-col items-center justify-center text-center relative overflow-hidden"
            role="status"
            aria-live="polite"
          >
            <div className="w-14 h-14 rounded-full border-2 border-brand-border border-t-cyan-400 animate-spin mb-4" />
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <span>Searching organizational memory</span>
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce delay-150" />
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce delay-300" />
              </span>
            </h3>
            <p className="text-xs text-brand-muted mt-1 max-w-sm">
              Extracting symptom embeddings, querying historical incident knowledge base, and generating targeted diagnostic hypotheses…
            </p>
          </div>
        )}

        {/* Error Notification */}
        {error && !analyzing && (
          <div
            className="mt-4 p-4 rounded-lg bg-rose-950/20 border border-rose-500/30 flex items-center justify-between gap-4"
            role="alert"
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-rose-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-xs font-bold text-rose-300">Analysis unavailable</p>
                <p className="text-xs text-rose-200/80">{error.message}</p>
              </div>
            </div>
            <button
              onClick={analyze}
              className="btn-secondary text-xs py-1 px-3 border-rose-500/40 text-rose-300 hover:bg-rose-500/10"
            >
              Retry Analysis
            </button>
          </div>
        )}

        {/* Operational Insight AI Summary */}
        {isComplete && investigation && (
          <div className="mt-5 p-4 rounded-xl bg-brand-surface-2/80 border border-indigo-500/30 shadow-sm relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-indigo-400" />
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-indigo-400">
                Operational Intelligence Synthesis
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
              {summaryInsight}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] font-mono text-brand-muted pt-2 border-t border-brand-border/40">
              <span>Memory Vectors: <strong className="text-cyan-400">{investigation.memory.length}</strong></span>
              <span>Hypotheses: <strong className="text-indigo-400">{investigation.hypotheses.length}</strong></span>
              <span>Recommended Steps: <strong className="text-emerald-400">{investigation.steps.length}</strong></span>
            </div>
          </div>
        )}
      </section>

      {/* When complete, show the organized sections */}
      {isComplete && investigation && (
        <>
          {/* 1. Memory Used (Centerpiece) */}
          <MemoryPanel
            memory={investigation.memory}
            currentIncidentId={incident.id}
            currentTitle={incident.title}
            currentService={incident.service}
          />

          {/* 2. Hypotheses */}
          {investigation.hypotheses.length > 0 && (
            <section
              aria-labelledby="hypotheses-heading"
              className="ops-card p-5 sm:p-6 border-brand-border/80 bg-brand-surface"
            >
              <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-brand-border/60">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-indigo-400 font-bold">02</span>
                    <h2 id="hypotheses-heading" className="text-base font-bold text-slate-100">
                      Hypotheses
                    </h2>
                  </div>
                  <p className="text-xs text-brand-muted mt-0.5">
                    Ranked by estimated likelihood. Correlated with historical symptom clusters.
                  </p>
                </div>
                <span className="text-xs font-mono text-brand-muted">
                  {investigation.hypotheses.length} ranked
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {[...investigation.hypotheses]
                  .sort((a, b) => b.confidence - a.confidence)
                  .map((hyp, i) => (
                    <HypothesisCard key={hyp.id} hypothesis={hyp} rank={i + 1} />
                  ))}
              </div>
            </section>
          )}

          {/* 3. Recommended Investigation Steps */}
          <InvestigationStepsPanel
            steps={investigation.steps}
            incidentId={incident.id}
            onUpdateStep={handleUpdateStep}
          />

          {/* 4. Vertical Timeline */}
          <InvestigationTimeline timeline={investigation.timeline} />
        </>
      )}
    </div>
  );
}

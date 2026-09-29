'use client';

import { useState, useId } from 'react';
import { useRouter } from 'next/navigation';
import { createIncident } from '@/lib/api/incidents';
import { ApiError } from '@/types';
import type { Severity } from '@/types';

interface FormFields {
  title: string;
  service: string;
  severity: Severity | '';
  symptoms: string;
  logs: string;
  timestamp: string;
}

interface FormErrors {
  title?: string;
  service?: string;
  severity?: string;
  symptoms?: string;
  logs?: string;
}

function nowLocalDatetime(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

const commonServices = [
  'Payment API',
  'Database Cluster',
  'Auth Service',
  'Redis Cache',
  'Checkout Gateway',
  'Ingestion Pipeline',
];

const incidentTemplates = [
  {
    name: 'Payment 502 Cascade',
    title: 'Payment API returning 502 Bad Gateway',
    service: 'Payment API',
    severity: 'P1' as Severity,
    symptoms: '502 Bad Gateway on /v1/charges\nLatency increased from 80ms to >5000ms\nDB connection pool at 98% utilization',
    logs: `[2024-01-15T17:18:02Z] ERROR payment-service: upstream connect error - db connection pool exhausted
[2024-01-15T17:18:05Z] WARN  payment-service: response time 5234ms exceeds SLA threshold (200ms)
[2024-01-15T17:18:08Z] CRITICAL payment-service: circuit breaker OPEN (50% failure threshold)`,
  },
  {
    name: 'DB Replica Lag Spike',
    title: 'Read replica lag exceeding 45 seconds',
    service: 'Database Cluster',
    severity: 'P2' as Severity,
    symptoms: 'Replication lag monitor alerting > 30s\nRead endpoints returning stale user balances\nWrite replication buffer saturated',
    logs: `[2024-01-15T16:52:14Z] WARN db-replica-01: replication lag 31.4s (threshold: 30s)
[2024-01-15T16:56:01Z] ERROR db-replica-01: replication lag 45.2s - high write burst`,
  },
];

export default function CreateIncidentForm() {
  const router = useRouter();
  const id = useId();

  const [fields, setFields] = useState<FormFields>({
    title: '',
    service: '',
    severity: '',
    symptoms: '',
    logs: '',
    timestamp: nowLocalDatetime(),
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  function applyTemplate(tpl: typeof incidentTemplates[0]) {
    setFields({
      title: tpl.title,
      service: tpl.service,
      severity: tpl.severity,
      symptoms: tpl.symptoms,
      logs: tpl.logs,
      timestamp: nowLocalDatetime(),
    });
    setErrors({});
  }

  function validate(): FormErrors {
    const e: FormErrors = {};
    if (!fields.title.trim()) e.title = 'Incident title is required.';
    if (!fields.service.trim()) e.service = 'Service is required.';
    if (!fields.severity) e.severity = 'Severity is required.';
    if (!fields.symptoms.trim()) e.symptoms = 'At least one symptom is required.';
    if (!fields.logs.trim()) e.logs = 'Log content is required.';
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      const firstKey = Object.keys(errs)[0];
      document.getElementById(`${id}-${firstKey}`)?.focus();
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const incident = await createIncident({
        title: fields.title.trim(),
        service: fields.service.trim(),
        severity: fields.severity as Severity,
        symptoms: fields.symptoms.trim(),
        logs: fields.logs.trim(),
        timestamp: new Date(fields.timestamp).toISOString(),
      });
      router.push(`/incidents/${incident.id}`);
    } catch (err) {
      setApiError(
        err instanceof ApiError
          ? err.message
          : 'Unable to create incident. Verify the service is accessible.',
      );
      setSubmitting(false);
    }
  }

  const severityOptions: { value: Severity; label: string; desc: string; color: string }[] = [
    { value: 'P1', label: 'P1 · Critical', desc: 'Total outage or catastrophic degradation', color: 'border-red-500 text-red-400 bg-red-950/40' },
    { value: 'P2', label: 'P2 · High', desc: 'Major feature unavailable or degraded', color: 'border-orange-500 text-orange-400 bg-orange-950/40' },
    { value: 'P3', label: 'P3 · Medium', desc: 'Moderate impact with available workaround', color: 'border-amber-500 text-amber-400 bg-amber-950/40' },
    { value: 'P4', label: 'P4 · Low', desc: 'Minor issue or non-critical anomaly', color: 'border-sky-500 text-sky-400 bg-sky-950/40' },
  ];

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6" aria-label="Create incident form">
      {/* Template Quick Loader */}
      <div className="p-3.5 rounded-lg bg-[#0a0f1d] border border-[#1e2d4d] flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#64748b] uppercase tracking-wider">
            Quick Fill:
          </span>
          <span className="text-xs text-[#94a3b8]">Load incident scenario</span>
        </div>
        <div className="flex items-center gap-2">
          {incidentTemplates.map((t) => (
            <button
              key={t.name}
              type="button"
              onClick={() => applyTemplate(t)}
              className="text-xs font-medium text-brand-cyan hover:text-white bg-[#0e1629] hover:bg-[#141f38] px-2.5 py-1 rounded-md border border-brand-cyan/30 transition-colors"
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {/* API error banner */}
      {apiError && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-start gap-3 p-4 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-sm shadow-brand-md"
        >
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <div className="flex-1">
            <p className="font-bold text-red-200">Incident Creation Failed</p>
            <p className="text-xs text-red-400 mt-0.5">{apiError}</p>
          </div>
          <button
            type="button"
            onClick={() => setApiError(null)}
            className="text-red-400 hover:text-white p-1"
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}

      {/* Incident Title */}
      <div>
        <label htmlFor={`${id}-title`} className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-1.5">
          Incident Title <span className="text-red-400" aria-label="required">*</span>
        </label>
        <input
          id={`${id}-title`}
          type="text"
          placeholder="e.g. Payment API returning 502"
          value={fields.title}
          onChange={(e) => {
            setFields((f) => ({ ...f, title: e.target.value }));
            if (errors.title) setErrors((er) => ({ ...er, title: undefined }));
          }}
          className={`ops-input text-sm ${errors.title ? 'ops-input-error' : ''}`}
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? `${id}-title-error` : `${id}-title-hint`}
        />
        <div className="flex items-center justify-between mt-1 text-[11px] text-[#64748b]">
          <span id={`${id}-title-hint`}>Succinct, actionable title describing the observed failure</span>
          <span>{fields.title.length}/100</span>
        </div>
        {errors.title && (
          <p id={`${id}-title-error`} className="mt-1 text-xs text-red-400 font-medium" role="alert">
            {errors.title}
          </p>
        )}
      </div>

      {/* Service & Severity 2-column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Service */}
        <div>
          <label htmlFor={`${id}-service`} className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-1.5">
            Affected Service <span className="text-red-400" aria-label="required">*</span>
          </label>
          <input
            id={`${id}-service`}
            type="text"
            placeholder="e.g. Payment API"
            value={fields.service}
            onChange={(e) => {
              setFields((f) => ({ ...f, service: e.target.value }));
              if (errors.service) setErrors((er) => ({ ...er, service: undefined }));
            }}
            className={`ops-input text-sm ${errors.service ? 'ops-input-error' : ''}`}
            aria-invalid={!!errors.service}
            aria-describedby={errors.service ? `${id}-service-error` : undefined}
          />
          {/* Quick Service Suggestions */}
          <div className="flex items-center gap-1.5 flex-wrap mt-2">
            {commonServices.slice(0, 4).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setFields((f) => ({ ...f, service: s }));
                  if (errors.service) setErrors((er) => ({ ...er, service: undefined }));
                }}
                className="text-[10px] font-mono text-[#64748b] hover:text-white bg-[#0e1629] px-2 py-0.5 rounded border border-[#1e2d4d]"
              >
                + {s}
              </button>
            ))}
          </div>
          {errors.service && (
            <p id={`${id}-service-error`} className="mt-1 text-xs text-red-400 font-medium" role="alert">
              {errors.service}
            </p>
          )}
        </div>

        {/* Severity */}
        <div>
          <label htmlFor={`${id}-severity`} className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-1.5">
            Severity Level <span className="text-red-400" aria-label="required">*</span>
          </label>
          <select
            id={`${id}-severity`}
            value={fields.severity}
            onChange={(e) => {
              setFields((f) => ({ ...f, severity: e.target.value as Severity }));
              if (errors.severity) setErrors((er) => ({ ...er, severity: undefined }));
            }}
            className={`ops-input text-sm bg-[#0d1527] ${errors.severity ? 'ops-input-error' : ''}`}
            aria-invalid={!!errors.severity}
            aria-describedby={errors.severity ? `${id}-severity-error` : undefined}
          >
            <option value="" disabled>Select severity tier…</option>
            {severityOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label} — {opt.desc}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[11px] text-[#64748b]">
            Determines notification fan-out and AI investigation prioritization
          </p>
          {errors.severity && (
            <p id={`${id}-severity-error`} className="mt-1 text-xs text-red-400 font-medium" role="alert">
              {errors.severity}
            </p>
          )}
        </div>
      </div>

      {/* Symptoms */}
      <div>
        <label htmlFor={`${id}-symptoms`} className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-1.5">
          Observable Symptoms <span className="text-red-400" aria-label="required">*</span>
        </label>
        <textarea
          id={`${id}-symptoms`}
          rows={4}
          placeholder={"502 Bad Gateway on all payment endpoints\nLatency increased from 80ms to >5000ms\nDB connections at 98% capacity"}
          value={fields.symptoms}
          onChange={(e) => {
            setFields((f) => ({ ...f, symptoms: e.target.value }));
            if (errors.symptoms) setErrors((er) => ({ ...er, symptoms: undefined }));
          }}
          className={`ops-input text-xs font-mono resize-y ${errors.symptoms ? 'ops-input-error' : ''}`}
          aria-invalid={!!errors.symptoms}
          aria-describedby={errors.symptoms ? `${id}-symptoms-error` : `${id}-symptoms-hint`}
        />
        <p id={`${id}-symptoms-hint`} className="mt-1 text-[11px] text-[#64748b]">
          Provide observable failure modes. OpsMind uses symptoms to search organizational memory vectors.
        </p>
        {errors.symptoms && (
          <p id={`${id}-symptoms-error`} className="mt-1 text-xs text-red-400 font-medium" role="alert">
            {errors.symptoms}
          </p>
        )}
      </div>

      {/* Developer Terminal-Style Logs */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor={`${id}-logs`} className="text-xs font-bold uppercase tracking-wider text-[#94a3b8]">
            Diagnostic Logs / Trace Data <span className="text-red-400" aria-label="required">*</span>
          </label>
          <span className="text-[11px] font-mono text-[#64748b]">
            {fields.logs ? `${fields.logs.split('\n').length} lines` : '0 lines'}
          </span>
        </div>

        <div className="terminal-box overflow-hidden border border-[#1e2d4d] rounded-xl shadow-brand-card">
          {/* Terminal Console Titlebar */}
          <div className="flex items-center justify-between px-3.5 py-2 bg-[#090d18] border-b border-[#1a2742]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              <span className="ml-2 text-[10px] font-mono text-[#64748b]">telemetry-stream.log</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setFields((f) => ({
                  ...f,
                  logs: `[${new Date().toISOString()}] ERROR payment-service: 502 Bad Gateway - pool exhausted\n[${new Date().toISOString()}] WARN  db-cluster: connections at 98% capacity`,
                }));
              }}
              className="text-[10px] text-brand-cyan hover:underline"
            >
              Insert Sample Log
            </button>
          </div>

          <textarea
            id={`${id}-logs`}
            rows={7}
            placeholder="[2024-01-15T17:18:02Z] ERROR payment-service: upstream connect error: db connection pool exhausted..."
            value={fields.logs}
            onChange={(e) => {
              setFields((f) => ({ ...f, logs: e.target.value }));
              if (errors.logs) setErrors((er) => ({ ...er, logs: undefined }));
            }}
            className={`w-full bg-[#060911] text-[#cbd5e1] p-3.5 font-mono text-xs focus:outline-none resize-y leading-relaxed ${
              errors.logs ? 'border-b border-red-500' : ''
            }`}
            aria-invalid={!!errors.logs}
            aria-describedby={errors.logs ? `${id}-logs-error` : undefined}
          />
        </div>
        {errors.logs && (
          <p id={`${id}-logs-error`} className="mt-1 text-xs text-red-400 font-medium" role="alert">
            {errors.logs}
          </p>
        )}
      </div>

      {/* Timestamp */}
      <div className="p-3.5 rounded-lg bg-[#0a0f1d] border border-[#1e2d4d] flex items-center justify-between gap-4 flex-wrap">
        <div>
          <label htmlFor={`${id}-timestamp`} className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-0.5">
            Initial Detection Timestamp
          </label>
          <span className="text-[11px] text-[#64748b]">
            Defaults to current local time; adjust if backfilling
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            id={`${id}-timestamp`}
            type="datetime-local"
            value={fields.timestamp}
            onChange={(e) => setFields((f) => ({ ...f, timestamp: e.target.value }))}
            className="ops-input text-xs w-auto font-mono py-1.5"
          />
          <button
            type="button"
            onClick={() => setFields((f) => ({ ...f, timestamp: nowLocalDatetime() }))}
            className="text-xs text-brand-cyan hover:text-white bg-[#101b33] px-2.5 py-1.5 rounded-md border border-[#1e2d4d]"
          >
            Now
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1e2d4d]">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-secondary text-xs"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary text-xs font-semibold px-5 py-2.5"
          aria-busy={submitting}
        >
          {submitting ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
              Initiating Investigation…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Create Incident &amp; Start Investigation
            </>
          )}
        </button>
      </div>
    </form>
  );
}


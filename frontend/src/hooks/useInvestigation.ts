'use client';

import { useState, useCallback, useEffect } from 'react';
import { analyzeIncident, updateStep } from '@/lib/api/analysis';
import { isMockMode } from '@/lib/api/client';
import { mockInvestigation } from '@/lib/mock';
import type { Investigation, InvestigationStep, Timeline_Entry } from '@/types';
import { ApiError } from '@/types';

interface UseInvestigationResult {
  investigation: Investigation | null;
  analyzing: boolean;
  error: ApiError | null;
  analyze: () => Promise<void>;
  updateStepStatus: (
    stepId: string,
    status: InvestigationStep['status'],
    notes?: string,
  ) => Promise<void>;
  setInvestigation: React.Dispatch<React.SetStateAction<Investigation | null>>;
}

export function useInvestigation(
  incidentId: string,
  initialInvestigation?: Investigation,
): UseInvestigationResult {
  const [investigation, setInvestigation] = useState<Investigation | null>(
    initialInvestigation ?? null,
  );
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const mock = isMockMode();

  // Sync investigation whenever parent finishes loading incident details
  useEffect(() => {
    if (initialInvestigation) {
      setInvestigation(initialInvestigation);
    }
  }, [initialInvestigation]);

  const analyze = useCallback(async () => {
    setAnalyzing(true);
    setError(null);

    // Simulate realistic analysis delay in mock mode
    if (mock) {
      await new Promise((r) => setTimeout(r, 1600));
      setInvestigation({ ...mockInvestigation, incidentId });
      setAnalyzing(false);
      return;
    }

    try {
      const result = await analyzeIncident(incidentId);
      setInvestigation(result);
    } catch (err) {
      if (err instanceof ApiError && err.status === 0) {
        // Backend unreachable — fall back to mock
        await new Promise((r) => setTimeout(r, 1000));
        setInvestigation({ ...mockInvestigation, incidentId });
      } else {
        setError(
          err instanceof ApiError
            ? err
            : new ApiError(0, 'Unable to analyze this incident.', `/incidents/${incidentId}/analyze`),
        );
      }
    } finally {
      setAnalyzing(false);
    }
  }, [incidentId, mock]);

  const updateStepStatus = useCallback(
    async (
      stepId: string,
      status: InvestigationStep['status'],
      notes?: string,
    ) => {
      if (!investigation) return;

      const previousSteps = investigation.steps;
      const previousTimeline = investigation.timeline;
      const targetStep = investigation.steps.find((s) => s.id === stepId);
      const actionName = targetStep?.action ?? 'Investigation step';
      const statusLabel =
        status === 'done' ? 'WORKED' : status === 'skipped' ? 'FAILED' : 'STARTED';

      const newTimelineEntry: Timeline_Entry = {
        id: `tl-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actor: 'user',
        event: `${actionName} (${statusLabel})`,
        detail: notes || undefined,
      };

      // Optimistic update
      setInvestigation((inv) =>
        inv
          ? {
              ...inv,
              steps: inv.steps.map((s) =>
                s.id === stepId ? { ...s, status, notes: notes ?? s.notes } : s,
              ),
              timeline: [...inv.timeline, newTimelineEntry],
            }
          : inv,
      );

      if (mock) return; // In mock mode, optimistic update is final

      try {
        await updateStep(incidentId, { stepId, status, notes });
      } catch (err) {
        // Revert on failure
        setInvestigation((inv) =>
          inv ? { ...inv, steps: previousSteps, timeline: previousTimeline } : inv,
        );
        setError(
          err instanceof ApiError
            ? err
            : new ApiError(0, 'Unable to save investigation step.', `/incidents/${incidentId}/steps`),
        );
      }
    },
    [incidentId, investigation, mock],
  );

  return { investigation, analyzing, error, analyze, updateStepStatus, setInvestigation };
}

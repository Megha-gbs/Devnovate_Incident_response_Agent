import { baseRequest, isMockMode } from './client';
import { mockInvestigation } from '@/lib/mock';
import type { Investigation, InvestigationStep, UpdateStepPayload } from '@/types';

/**
 * Trigger AI analysis for an incident.
 * POST /incidents/:id/analyze
 */
export async function analyzeIncident(incidentId: string): Promise<Investigation> {
  if (isMockMode()) {
    return {
      ...mockInvestigation,
      incidentId,
    };
  }
  return baseRequest<Investigation>(`/incidents/${incidentId}/analyze`, {
    method: 'POST',
  });
}

/**
 * Update the status of an investigation step.
 * POST /incidents/:incidentId/steps
 */
export async function updateStep(
  incidentId: string,
  payload: UpdateStepPayload,
): Promise<InvestigationStep> {
  if (isMockMode()) {
    const existing = mockInvestigation.steps.find((s) => s.id === payload.stepId);
    if (existing) {
      existing.status = payload.status;
      if (payload.notes) existing.notes = payload.notes;
      return { ...existing };
    }
    return {
      id: payload.stepId,
      order: 1,
      action: 'Investigation step',
      rationale: 'Operational investigation workflow',
      status: payload.status,
      notes: payload.notes,
    };
  }
  return baseRequest<InvestigationStep>(`/incidents/${incidentId}/steps`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

import { baseRequest } from './client';
import type { Investigation, InvestigationStep, UpdateStepPayload } from '@/types';

/**
 * Trigger AI analysis for an incident.
 * POST /incidents/:id/analyze
 */
export async function analyzeIncident(incidentId: string): Promise<Investigation> {
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
  return baseRequest<InvestigationStep>(`/incidents/${incidentId}/steps`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

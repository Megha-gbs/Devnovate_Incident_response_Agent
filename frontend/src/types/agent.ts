import type { Severity } from './incident';

export class ApiError extends Error {
  status: number;
  endpoint: string;

  constructor(status: number, message: string, endpoint: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.endpoint = endpoint;
  }
}

export interface CreateIncidentPayload {
  title: string;
  service: string;
  severity: Severity;
  symptoms: string;
  logs: string;
  timestamp: string; // ISO 8601
}

export interface UpdateStepPayload {
  stepId: string;
  status: 'pending' | 'in_progress' | 'done' | 'skipped';
  notes?: string;
}

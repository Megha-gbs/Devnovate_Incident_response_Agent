import type { Memory } from './memory';

export interface Investigation {
  id: string;
  incidentId: string;
  hypotheses: Hypothesis[];
  steps: InvestigationStep[];
  timeline: Timeline_Entry[];
  memory: Memory[];
  status: 'pending' | 'running' | 'complete' | 'error';
  createdAt: string;
  summary?: string;
}

export interface Hypothesis {
  id: string;
  description: string;
  confidence: number; // 0.0 – 1.0
  supporting_evidence: string[];
}

export interface InvestigationStep {
  id: string;
  action: string;
  rationale: string;
  status: 'pending' | 'in_progress' | 'done' | 'skipped';
  order: number;
  notes?: string;
}

export interface Timeline_Entry {
  id: string;
  timestamp: string; // ISO 8601
  actor: 'system' | 'user' | 'ai';
  event: string;
  detail?: string;
}

import type { Severity } from './incident';

export interface Memory {
  id: string;
  incidentId: string;
  title: string;
  service: string;
  severity: Severity;
  similarityScore: number; // 0.0 – 1.0
  relevanceExplanation: string;
  resolvedAt: string; // ISO 8601
  resolution: string;
  rootCause?: string;
}

export type SimilarityTier = 'HIGH' | 'MEDIUM' | 'LOW';

export function getSimilarityTier(score: number): SimilarityTier {
  if (score >= 0.85) return 'HIGH';
  if (score >= 0.60) return 'MEDIUM';
  return 'LOW';
}

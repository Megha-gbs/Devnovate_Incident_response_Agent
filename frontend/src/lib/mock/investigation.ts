import type { Investigation } from '@/types';
import { mockMemories } from './memory';

export const mockInvestigation: Investigation = {
  id: 'INV-024-01',
  incidentId: 'INC-024',
  status: 'complete',
  createdAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(), // 8 min ago
  memory: mockMemories,
  hypotheses: [
    {
      id: 'HYP-001',
      description: 'Database connection pool exhaustion',
      confidence: 0.82,
      supporting_evidence: [
        'DB connections at 98% capacity (98/100)',
        'INC-008 shows identical pattern — pool saturation caused 502 cascade',
        'Connection acquisition timeouts in logs (30000ms)',
        'Circuit breaker opened at 50% failure threshold',
      ],
    },
    {
      id: 'HYP-002',
      description: 'Connection leak introduced by recent deployment',
      confidence: 0.67,
      supporting_evidence: [
        'INC-019 shows connections not released after async exceptions',
        'Pool utilization grew gradually before spike',
        'INC-014 linked timeout cascade to connection starvation',
      ],
    },
    {
      id: 'HYP-003',
      description: 'Payment service dependency timeout cascade',
      confidence: 0.41,
      supporting_evidence: [
        'Latency increased from 80ms to >5000ms',
        'INC-014 shows similar latency pattern from upstream timeout',
      ],
    },
  ],
  steps: [
    {
      id: 'STEP-001',
      action: 'Check DB connection pool utilization metrics',
      rationale:
        'INC-008 showed the same 98% pool saturation. Verify current pool size, active connections, and wait queue depth.',
      status: 'pending',
      order: 1,
    },
    {
      id: 'STEP-002',
      action: 'Inspect connection release metrics and recent deployments',
      rationale:
        'INC-019 was caused by connections not being released in async error handlers. Check if a deployment preceded the incident.',
      status: 'pending',
      order: 2,
    },
    {
      id: 'STEP-003',
      action: 'Review circuit breaker state and downstream timeouts',
      rationale:
        'INC-014 was resolved by reducing downstream timeouts. Verify circuit breaker configuration and upstream service health.',
      status: 'pending',
      order: 3,
    },
  ],
  timeline: [
    {
      id: 'TL-001',
      timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
      actor: 'system',
      event: 'Incident created',
      detail: 'INC-024 created with severity P1',
    },
    {
      id: 'TL-002',
      timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      actor: 'user',
      event: 'AI analysis triggered',
    },
    {
      id: 'TL-003',
      timestamp: new Date(Date.now() - 9 * 60 * 1000).toISOString(),
      actor: 'ai',
      event: 'Searching organizational memory',
      detail: 'Querying historical incidents for similarity matches',
    },
    {
      id: 'TL-004',
      timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
      actor: 'ai',
      event: 'Historical memories retrieved',
      detail: '3 similar incidents found (INC-008 HIGH, INC-014 MEDIUM, INC-019 LOW)',
    },
    {
      id: 'TL-005',
      timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
      actor: 'ai',
      event: 'AI investigation complete',
      detail: '3 hypotheses generated, 3 recommended investigation steps',
    },
  ],
};

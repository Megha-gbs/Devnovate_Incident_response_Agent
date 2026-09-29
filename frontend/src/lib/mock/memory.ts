import type { Memory } from '@/types';

export const mockMemories: Memory[] = [
  {
    id: 'MEM-008',
    incidentId: 'INC-008',
    title: 'DB connection pool exhausted',
    service: 'Payment API',
    severity: 'P1',
    similarityScore: 0.92,
    relevanceExplanation:
      'Current symptoms show the same DB connection saturation pattern — 98% pool utilization with cascading 502 errors — matching this incident almost exactly.',
    resolvedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days ago
    rootCause: 'Connection pool capacity exceeded after sudden traffic spike and missing connection.close() invocation.',
    resolution:
      'Increased connection pool max size from 100 to 250. Identified and fixed a missing `connection.close()` call in the payment processing loop. Deployed connection leak patch and monitored for 2 hours before clearing.',
  },
  {
    id: 'MEM-014',
    incidentId: 'INC-014',
    title: 'Payment service timeout cascade',
    service: 'Payment API',
    severity: 'P2',
    similarityScore: 0.71,
    relevanceExplanation:
      'Payment API timeouts in this incident were traced to a dependency timeout that starved the connection pool, similar to the current latency pattern.',
    resolvedAt: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000).toISOString(), // 23 days ago
    rootCause: 'Downstream payment provider gateway latency spike causing pool starvation.',
    resolution:
      'Reduced downstream service timeout from 30s to 5s. Added circuit breaker with 50% failure threshold. Scaled payment service replicas from 3 to 6.',
  },
  {
    id: 'MEM-019',
    incidentId: 'INC-019',
    title: 'Connection leak after deployment',
    service: 'Payment API',
    severity: 'P2',
    similarityScore: 0.45,
    relevanceExplanation:
      'A code deployment introduced a connection leak that gradually exhausted the pool over several hours, worth checking if a recent deployment preceded the current incident.',
    resolvedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), // 12 days ago
    rootCause: 'Async error handler in v2.4.1 was not awaited, leaving connections unreleased on unhandled rejection.',
    resolution:
      'Rolled back deployment v2.4.1. Root cause: async error handler was not awaited, leaving connections unreleased on exception. Fixed in v2.4.2.',
  },
];

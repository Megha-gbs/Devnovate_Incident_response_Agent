import type { Post_Mortem } from '@/types';

export const mockPostMortem: Post_Mortem = {
  incidentId: 'INC-021',
  rootCause:
    'Redis memory limit was set too low (8GB) relative to the growth in cached data volume following a feature flag rollout that increased session payload sizes by ~3x.',
  impact:
    'Cache hit rate dropped from 89% to 12% for approximately 35 minutes. Downstream services (auth, product catalog) experienced 3–8x increased database load. No data loss. SLO breach: availability 99.71% vs 99.9% target.',
  timeline:
    '13:10 — Memory alert triggered at 94.8%\n13:12 — Cache hit rate dropped to 12%, DB load spike\n13:15 — On-call engineer paged\n13:25 — Root cause identified (memory limit)\n13:40 — maxmemory increased to 12GB\n13:45 — Cache stabilized, hit rate recovering\n14:05 — Incident resolved, hit rate at 87%',
  actionItems: [
    'Set Redis memory alert threshold to 80% (currently 90%)',
    'Add automated scaling policy for Redis memory based on eviction rate',
    'Audit feature flag rollouts for payload size impact before production',
    'Document Redis capacity planning process in runbook',
  ],
  authoredAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
};

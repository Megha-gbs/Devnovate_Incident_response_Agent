import type { Knowledge_Entry } from '@/types';

export const mockKnowledgeEntry: Knowledge_Entry = {
  incidentId: 'INC-021',
  insight:
    'Redis memory limit was set too low relative to session payload growth from feature flag rollout. Increasing maxmemory and setting eviction alerts at 80% resolved cache eviction storms. Always audit payload sizes before feature rollouts that affect cached data.',
  tags: ['redis', 'cache', 'memory', 'eviction', 'feature-flag', 'capacity-planning'],
  retainedAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
};

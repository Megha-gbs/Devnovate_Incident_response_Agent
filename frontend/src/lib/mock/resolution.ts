import type { Resolution } from '@/types';

export const mockResolution: Resolution = {
  incidentId: 'INC-021',
  summary:
    'Increased Redis maxmemory from 8GB to 12GB and adjusted the eviction policy to allkeys-lru with a higher memory threshold alert at 80%. Cache hit rate recovered to 87% within 30 minutes.',
  resolvedBy: 'ops-team',
  resolvedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
};

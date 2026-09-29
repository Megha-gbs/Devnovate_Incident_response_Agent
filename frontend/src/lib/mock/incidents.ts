import type { Incident } from '@/types';

export const mockIncidents: Incident[] = [
  {
    id: 'INC-024',
    title: 'Payment API returning 502',
    service: 'Payment API',
    severity: 'P1',
    status: 'active',
    timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(), // 12 min ago
    symptoms:
      '502 Bad Gateway errors on all payment endpoints\nLatency increased from ~80ms to >5000ms\nDB connections at 98% capacity\nError rate spiked to 43% in the last 10 minutes',
    logs: `[2024-01-15T17:18:02Z] ERROR payment-service: upstream connect error or disconnect/reset before headers. reset reason: connection failure
[2024-01-15T17:18:03Z] ERROR payment-service: 502 Bad Gateway - db connection pool exhausted (98/100 connections active)
[2024-01-15T17:18:05Z] WARN  payment-service: response time 5234ms exceeds threshold (200ms)
[2024-01-15T17:18:06Z] ERROR payment-service: failed to acquire connection from pool: timeout after 30000ms
[2024-01-15T17:18:08Z] ERROR payment-service: health check failed - database unreachable
[2024-01-15T17:18:10Z] CRITICAL payment-service: circuit breaker OPEN - too many failures (threshold: 50%)
[2024-01-15T17:18:12Z] ERROR payment-service: 502 Bad Gateway x47 in last 60s`,
  },
  {
    id: 'INC-023',
    title: 'Database replica lag spike',
    service: 'Database',
    severity: 'P2',
    status: 'active',
    timestamp: new Date(Date.now() - 38 * 60 * 1000).toISOString(), // 38 min ago
    symptoms:
      'Read replica lag exceeding 45 seconds\nRead-heavy endpoints experiencing stale data\nMonitoring alert: replica_lag_seconds > 30',
    logs: `[2024-01-15T16:52:14Z] WARN  db-replica-01: replication lag 31.4s (threshold: 30s)
[2024-01-15T16:54:22Z] WARN  db-replica-01: replication lag 42.7s
[2024-01-15T16:56:01Z] ERROR db-replica-01: replication lag 45.2s - read queries may return stale data
[2024-01-15T16:58:30Z] INFO  db-primary: high write throughput detected (12k writes/min, normal: 4k/min)`,
  },
  {
    id: 'INC-021',
    title: 'Redis cache eviction storm',
    service: 'Cache',
    severity: 'P3',
    status: 'resolved',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    symptoms:
      'Redis memory usage at 95%\nCache hit rate dropped from 89% to 12%\nIncreased load on downstream services',
    logs: `[2024-01-15T13:10:05Z] WARN  redis-primary: memory usage 94.8% (maxmemory: 8GB)
[2024-01-15T13:10:12Z] WARN  redis-primary: eviction policy active (allkeys-lru) - evicting keys
[2024-01-15T13:12:44Z] ERROR redis-primary: cache hit rate 12% (threshold: 70%)
[2024-01-15T13:45:00Z] INFO  redis-primary: maxmemory increased to 12GB - cache stabilizing`,
  },
];

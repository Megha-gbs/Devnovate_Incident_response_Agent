"""In-memory simulated infrastructure used by investigation and remediation tools.

This is what makes the demo work without real clusters. Each scenario has
services, logs, metrics, deployments, and dependencies. Remediation tools
mutate this world so verification can observe recovery.
"""

from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timedelta, timezone
from typing import Any

NOW = datetime(2026, 9, 28, 12, 10, 0, tzinfo=timezone.utc)


def _ts(minutes_ago: int, seconds: int = 0) -> str:
    return (NOW - timedelta(minutes=minutes_ago, seconds=seconds)).isoformat()


def _log(minutes_ago: int, service: str, level: str, message: str, **fields: Any) -> dict:
    return {
        "timestamp": _ts(minutes_ago),
        "service": service,
        "level": level,
        "message": message,
        **fields,
    }


SCENARIOS: dict[str, dict[str, Any]] = {
    "payment-api-outage": {
        "id": "payment-api-outage",
        "name": "Payment API outage",
        "title": "Payment API error rate > 40%",
        "description": (
            "Checkout is failing. payment-api is returning HTTP 503 for a large "
            "share of requests. Alert fired from the API gateway."
        ),
        "severity": "CRITICAL",
        "priority": "P1",
        "category": "availability",
        "affected_service": "payment-api",
        "affected_resources": ["payment-api", "payments-db", "checkout-web"],
        "alert": {
            "name": "PaymentAPIHighErrorRate",
            "message": "Payment API error rate > 40% for 5 minutes",
            "source": "prometheus-alertmanager",
            "severity": "CRITICAL",
            "service": "payment-api",
        },
        "world": {
            "services": {
                "payment-api": {
                    "status": "degraded",
                    "version": "1.18.2",
                    "replicas": 3,
                    "error_rate": 0.47,
                    "p99_latency_ms": 2400,
                    "cpu_pct": 41,
                    "memory_pct": 62,
                    "depends_on": ["payments-db", "redis-cache"],
                },
                "payments-db": {
                    "status": "degraded",
                    "version": "15.4",
                    "replicas": 1,
                    "error_rate": 0.12,
                    "p99_latency_ms": 1800,
                    "cpu_pct": 88,
                    "memory_pct": 74,
                    "connection_pool": {"active": 100, "max": 100, "waiting": 86},
                    "depends_on": [],
                },
                "redis-cache": {
                    "status": "healthy",
                    "version": "7.2",
                    "replicas": 1,
                    "error_rate": 0.0,
                    "p99_latency_ms": 4,
                    "cpu_pct": 12,
                    "memory_pct": 33,
                    "depends_on": [],
                },
                "checkout-web": {
                    "status": "degraded",
                    "version": "4.2.0",
                    "replicas": 4,
                    "error_rate": 0.39,
                    "p99_latency_ms": 3100,
                    "cpu_pct": 22,
                    "memory_pct": 40,
                    "depends_on": ["payment-api"],
                },
            },
            "deployments": {
                "payment-api": {
                    "current": "1.18.2",
                    "previous": "1.18.1",
                    "deployed_at": _ts(180),
                    "status": "success",
                }
            },
            "history": [
                {
                    "incident_id": "INC-HIST01",
                    "title": "payments-db connection saturation",
                    "resolved": True,
                    "root_cause": "Connection pool maxed after traffic spike",
                }
            ],
            "logs": [
                _log(6, "payment-api", "ERROR", "POST /v1/charges returned 503", request_id="req-8812"),
                _log(6, "payment-api", "ERROR", "Unable to obtain database connection", code="DB_POOL_TIMEOUT"),
                _log(5, "payment-api", "ERROR", "POST /v1/charges returned 503", request_id="req-8819"),
                _log(5, "payments-db", "WARN", "connection slots exhausted", active=100, max=100),
                _log(4, "payment-api", "ERROR", "database connection timed out after 3000ms", code="DB_POOL_TIMEOUT"),
                _log(4, "checkout-web", "ERROR", "payment-api 503 on checkout submit", user="cust-4421"),
                _log(3, "payment-api", "ERROR", "POST /v1/charges returned 503", request_id="req-8901"),
                _log(3, "payments-db", "ERROR", "too many connections", pid="postgres"),
                _log(2, "payment-api", "ERROR", "circuit breaker opened for payments-db"),
                _log(2, "payment-api", "ERROR", "POST /v1/refunds returned 503"),
                _log(1, "gateway", "WARN", "error rate for payment-api is 47%"),
                _log(1, "payments-db", "WARN", "86 clients waiting for a connection"),
                _log(0, "payment-api", "ERROR", "health check failing: dependency payments-db degraded"),
            ],
        },
        "expected_hypothesis": (
            "payment-api is failing because the payments-db connection pool is exhausted, "
            "causing 503 responses. This is a hypothesis based on repeated DB_POOL_TIMEOUT logs."
        ),
        "recommended_action": {
            "action_type": "increase_db_pool",
            "target": "payments-db",
            "reason": "Logs show connection slots exhausted (100/100) with 86 waiters.",
            "expected_result": "New connections succeed and payment-api 503 rate drops.",
        },
    },
    "db-connection-exhaustion": {
        "id": "db-connection-exhaustion",
        "name": "Database connection exhaustion",
        "title": "orders-api cannot acquire Postgres connections",
        "description": "orders-api latency and errors climbing; database reports max connections reached.",
        "severity": "HIGH",
        "priority": "P1",
        "category": "database",
        "affected_service": "orders-api",
        "affected_resources": ["orders-api", "orders-db"],
        "alert": {
            "name": "PostgresConnectionsExhausted",
            "message": "orders-db active connections = max_connections",
            "source": "postgres-exporter",
            "severity": "HIGH",
            "service": "orders-db",
        },
        "world": {
            "services": {
                "orders-api": {
                    "status": "degraded",
                    "version": "2.4.1",
                    "replicas": 6,
                    "error_rate": 0.28,
                    "p99_latency_ms": 1900,
                    "cpu_pct": 35,
                    "memory_pct": 48,
                    "depends_on": ["orders-db"],
                },
                "orders-db": {
                    "status": "degraded",
                    "version": "14.9",
                    "replicas": 1,
                    "error_rate": 0.05,
                    "p99_latency_ms": 900,
                    "cpu_pct": 70,
                    "memory_pct": 66,
                    "connection_pool": {"active": 200, "max": 200, "waiting": 40},
                    "depends_on": [],
                },
            },
            "deployments": {
                "orders-api": {
                    "current": "2.4.1",
                    "previous": "2.3.8",
                    "deployed_at": _ts(40),
                    "status": "success",
                    "notes": "Replica count increased from 3 to 6 40 minutes ago",
                }
            },
            "history": [],
            "logs": [
                _log(8, "orders-api", "ERROR", "could not get connection from pool after 5s"),
                _log(7, "orders-db", "FATAL", "remaining connection slots are reserved"),
                _log(5, "orders-api", "WARN", "thread pool waiting on datasource"),
                _log(3, "orders-api", "ERROR", "GET /orders timed out"),
                _log(1, "deploy-bot", "INFO", "scaled orders-api from 3 to 6 replicas"),
            ],
        },
        "recommended_action": {
            "action_type": "increase_db_pool",
            "target": "orders-db",
            "reason": "API replica scale-out exhausted DB max_connections.",
            "expected_result": "Connection wait queue drains and API errors fall.",
        },
    },
    "high-cpu": {
        "id": "high-cpu",
        "name": "High CPU service",
        "title": "search-api CPU > 95% for 10 minutes",
        "description": "search-api is saturating CPU; p99 latency has crossed SLO.",
        "severity": "HIGH",
        "priority": "P2",
        "category": "performance",
        "affected_service": "search-api",
        "affected_resources": ["search-api"],
        "alert": {
            "name": "SearchAPICPUHigh",
            "message": "CPU utilization > 95% for 10m",
            "source": "prometheus-alertmanager",
            "severity": "HIGH",
            "service": "search-api",
        },
        "world": {
            "services": {
                "search-api": {
                    "status": "degraded",
                    "version": "3.1.0",
                    "replicas": 2,
                    "error_rate": 0.04,
                    "p99_latency_ms": 1600,
                    "cpu_pct": 97,
                    "memory_pct": 55,
                    "depends_on": ["opensearch"],
                },
                "opensearch": {
                    "status": "healthy",
                    "version": "2.11",
                    "replicas": 3,
                    "error_rate": 0.0,
                    "p99_latency_ms": 80,
                    "cpu_pct": 40,
                    "memory_pct": 61,
                    "depends_on": [],
                },
            },
            "deployments": {
                "search-api": {
                    "current": "3.1.0",
                    "previous": "3.0.4",
                    "deployed_at": _ts(90),
                    "status": "success",
                }
            },
            "history": [],
            "logs": [
                _log(9, "search-api", "WARN", "event loop lag 840ms"),
                _log(6, "search-api", "INFO", "hot path: tokenize+rank taking 1.1s"),
                _log(3, "search-api", "WARN", "CPU throttling detected"),
                _log(1, "k8s", "WARN", "search-api pods at CPU limit"),
            ],
        },
        "recommended_action": {
            "action_type": "scale_service",
            "target": "search-api",
            "reason": "CPU is saturated on only 2 replicas; horizontal scale is the lowest-risk mitigation.",
            "expected_result": "CPU per replica drops and latency returns under SLO.",
        },
    },
    "memory-leak": {
        "id": "memory-leak",
        "name": "Memory leak",
        "title": "notifications-worker memory climbing toward OOM",
        "description": "Worker RSS grows linearly after deploy 1.9.0; restarts temporarily help.",
        "severity": "HIGH",
        "priority": "P2",
        "category": "reliability",
        "affected_service": "notifications-worker",
        "affected_resources": ["notifications-worker"],
        "alert": {
            "name": "WorkerMemoryLeakSuspect",
            "message": "RSS grown 1.2GB in 45 minutes",
            "source": "prometheus-alertmanager",
            "severity": "HIGH",
            "service": "notifications-worker",
        },
        "world": {
            "services": {
                "notifications-worker": {
                    "status": "degraded",
                    "version": "1.9.0",
                    "replicas": 3,
                    "error_rate": 0.08,
                    "p99_latency_ms": 400,
                    "cpu_pct": 30,
                    "memory_pct": 93,
                    "depends_on": ["redis-cache"],
                }
            },
            "deployments": {
                "notifications-worker": {
                    "current": "1.9.0",
                    "previous": "1.8.4",
                    "deployed_at": _ts(50),
                    "status": "success",
                }
            },
            "history": [],
            "logs": [
                _log(40, "notifications-worker", "INFO", "deployed version 1.9.0"),
                _log(20, "notifications-worker", "WARN", "heap usage 78%"),
                _log(8, "notifications-worker", "WARN", "heap usage 91%"),
                _log(2, "notifications-worker", "ERROR", "GC overhead limit approaching"),
                _log(1, "k8s", "WARN", "memory working set near limit"),
            ],
        },
        "recommended_action": {
            "action_type": "rollback_deployment",
            "target": "notifications-worker",
            "reason": "Memory growth started immediately after 1.9.0. Rollback is safer than restart loops.",
            "expected_result": "RSS returns to baseline of 1.8.4.",
        },
    },
    "auth-failure-spike": {
        "id": "auth-failure-spike",
        "name": "Authentication failure spike",
        "title": "auth-service 401 rate 12x baseline",
        "description": "Login failures spiked; could be bad deploy, expired cert, or credential stuffing.",
        "severity": "HIGH",
        "priority": "P1",
        "category": "security",
        "affected_service": "auth-service",
        "affected_resources": ["auth-service", "login-web"],
        "alert": {
            "name": "AuthFailureSpike",
            "message": "401 responses 12x baseline in 5 minutes",
            "source": "siem",
            "severity": "HIGH",
            "service": "auth-service",
        },
        "world": {
            "services": {
                "auth-service": {
                    "status": "degraded",
                    "version": "5.0.3",
                    "replicas": 4,
                    "error_rate": 0.55,
                    "p99_latency_ms": 220,
                    "cpu_pct": 44,
                    "memory_pct": 50,
                    "depends_on": ["users-db"],
                }
            },
            "deployments": {
                "auth-service": {
                    "current": "5.0.3",
                    "previous": "5.0.2",
                    "deployed_at": _ts(1440),
                    "status": "success",
                }
            },
            "history": [],
            "logs": [
                _log(5, "auth-service", "WARN", "invalid_client_secret for partner-gateway"),
                _log(4, "auth-service", "ERROR", "JWT signature mismatch kid=legacy-2024"),
                _log(3, "auth-service", "WARN", "401 POST /oauth/token count=840"),
                _log(2, "secrets-manager", "INFO", "auth-service client secret rotated 8 minutes ago"),
                _log(1, "auth-service", "ERROR", "partner-gateway still presenting previous secret"),
            ],
        },
        "recommended_action": {
            "action_type": "rotate_credentials",
            "target": "partner-gateway",
            "reason": "Observed JWT/secret mismatch after a rotation; partner still uses the old secret.",
            "expected_result": "Partner retries with the new secret and 401 rate returns to baseline.",
        },
    },
    "suspicious-logins": {
        "id": "suspicious-logins",
        "name": "Suspicious login activity",
        "title": "Impossible travel + brute force against admin accounts",
        "description": "Multiple admin accounts seeing failed logins from unusual geos.",
        "severity": "CRITICAL",
        "priority": "P1",
        "category": "security",
        "affected_service": "auth-service",
        "affected_resources": ["auth-service", "admin-portal"],
        "alert": {
            "name": "SuspiciousAdminLogins",
            "message": "Brute-force pattern against admin users from 14 IPs",
            "source": "siem",
            "severity": "CRITICAL",
            "service": "auth-service",
        },
        "world": {
            "services": {
                "auth-service": {
                    "status": "healthy",
                    "version": "5.0.3",
                    "replicas": 4,
                    "error_rate": 0.02,
                    "p99_latency_ms": 180,
                    "cpu_pct": 28,
                    "memory_pct": 47,
                    "depends_on": ["users-db"],
                }
            },
            "deployments": {
                "auth-service": {
                    "current": "5.0.3",
                    "previous": "5.0.2",
                    "deployed_at": _ts(1440),
                    "status": "success",
                }
            },
            "history": [],
            "logs": [
                _log(10, "auth-service", "WARN", "failed login user=admin", ip="203.0.113.44", country="RU"),
                _log(9, "auth-service", "WARN", "failed login user=admin", ip="203.0.113.44"),
                _log(8, "auth-service", "WARN", "failed login user=root-ops", ip="198.51.100.12"),
                _log(6, "auth-service", "WARN", "failed login user=admin", ip="203.0.113.44"),
                _log(4, "auth-service", "ERROR", "account lockout threshold reached user=admin"),
                _log(2, "waf", "WARN", "rate-limit candidate ip=203.0.113.44"),
            ],
        },
        "recommended_action": {
            "action_type": "block_ip",
            "target": "203.0.113.44",
            "reason": "Repeated failed admin logins from a single IP; block is high-risk and needs approval.",
            "expected_result": "Brute-force attempts from that IP stop.",
        },
    },
    "api-latency-spike": {
        "id": "api-latency-spike",
        "name": "API latency spike",
        "title": "catalog-api p99 > 2s",
        "description": "catalog-api latency SLO burn. Cache miss ratio also high.",
        "severity": "MEDIUM",
        "priority": "P2",
        "category": "performance",
        "affected_service": "catalog-api",
        "affected_resources": ["catalog-api", "redis-cache"],
        "alert": {
            "name": "CatalogLatencySLO",
            "message": "p99 latency 2.4s (budget 400ms)",
            "source": "prometheus-alertmanager",
            "severity": "MEDIUM",
            "service": "catalog-api",
        },
        "world": {
            "services": {
                "catalog-api": {
                    "status": "degraded",
                    "version": "6.2.1",
                    "replicas": 5,
                    "error_rate": 0.01,
                    "p99_latency_ms": 2400,
                    "cpu_pct": 48,
                    "memory_pct": 57,
                    "depends_on": ["redis-cache", "catalog-db"],
                },
                "redis-cache": {
                    "status": "degraded",
                    "version": "7.2",
                    "replicas": 1,
                    "error_rate": 0.0,
                    "p99_latency_ms": 12,
                    "cpu_pct": 8,
                    "memory_pct": 96,
                    "depends_on": [],
                    "evictions_per_min": 1800,
                },
            },
            "deployments": {
                "catalog-api": {
                    "current": "6.2.1",
                    "previous": "6.2.0",
                    "deployed_at": _ts(300),
                    "status": "success",
                }
            },
            "history": [],
            "logs": [
                _log(7, "catalog-api", "WARN", "cache miss ratio 0.81"),
                _log(5, "redis-cache", "WARN", "evicted 1800 keys/min maxmemory-policy allkeys-lru"),
                _log(3, "catalog-api", "INFO", "falling back to catalog-db for /products"),
                _log(1, "catalog-db", "WARN", "slow query 1.6s SELECT products"),
            ],
        },
        "recommended_action": {
            "action_type": "clear_cache",
            "target": "redis-cache",
            "reason": "High eviction rate suggests a bad working set; clearing and warming may restore hit ratio. Also consider scaling Redis memory.",
            "expected_result": "Cache hit ratio recovers and p99 drops.",
        },
    },
    "deployment-failure": {
        "id": "deployment-failure",
        "name": "Deployment failure",
        "title": "billing-api 1.4.0 rollout failing health checks",
        "description": "Canary pods for billing-api 1.4.0 never became ready. Error rate on canary is 90%.",
        "severity": "HIGH",
        "priority": "P1",
        "category": "change-failure",
        "affected_service": "billing-api",
        "affected_resources": ["billing-api"],
        "alert": {
            "name": "CanaryUnhealthy",
            "message": "billing-api canary 1.4.0 failed readiness",
            "source": "argocd",
            "severity": "HIGH",
            "service": "billing-api",
        },
        "world": {
            "services": {
                "billing-api": {
                    "status": "degraded",
                    "version": "1.4.0-canary",
                    "replicas": 4,
                    "error_rate": 0.22,
                    "p99_latency_ms": 900,
                    "cpu_pct": 33,
                    "memory_pct": 51,
                    "depends_on": ["billing-db"],
                }
            },
            "deployments": {
                "billing-api": {
                    "current": "1.4.0-canary",
                    "previous": "1.3.9",
                    "deployed_at": _ts(12),
                    "status": "failed",
                    "notes": "Readiness probe /ready returns 500 on canary",
                }
            },
            "history": [],
            "logs": [
                _log(12, "argocd", "INFO", "started rollout billing-api 1.4.0"),
                _log(10, "billing-api", "ERROR", "missing env STRIPE_WEBHOOK_SECRET"),
                _log(8, "billing-api", "ERROR", "readiness failed: configuration invalid"),
                _log(5, "argocd", "ERROR", "canary analysis failed: error-rate 0.90"),
                _log(2, "k8s", "WARN", "rollback recommended by analysis"),
            ],
        },
        "recommended_action": {
            "action_type": "rollback_deployment",
            "target": "billing-api",
            "reason": "Failed canary with missing configuration. Rollback to last known good 1.3.9.",
            "expected_result": "Stable version serves 100% traffic and error rate normalizes.",
        },
    },
}


class SimulationWorld:
    """Mutable copy of a scenario's infrastructure snapshot."""

    def __init__(self, scenario_id: str, world: dict[str, Any]) -> None:
        self.scenario_id = scenario_id
        self.services: dict[str, Any] = world.get("services", {})
        self.deployments: dict[str, Any] = world.get("deployments", {})
        self.history: list[dict[str, Any]] = world.get("history", [])
        self.logs: list[dict[str, Any]] = world.get("logs", [])
        self.recovered: bool = False

    def search_logs(self, query: str = "", service: str | None = None, limit: int = 50) -> list[dict]:
        query_l = query.lower()
        results = []
        for row in self.logs:
            if service and row.get("service") != service:
                continue
            blob = " ".join(str(v) for v in row.values()).lower()
            if query_l and query_l not in blob:
                continue
            results.append(row)
            if len(results) >= limit:
                break
        return results

    def get_service_status(self, service: str | None = None) -> dict[str, Any]:
        if service:
            data = self.services.get(service)
            if not data:
                return {"found": False, "service": service}
            return {"found": True, "service": service, **data}
        return {"found": True, "services": deepcopy(self.services)}

    def get_metrics(self, service: str) -> dict[str, Any]:
        data = self.services.get(service)
        if not data:
            return {"found": False, "service": service}
        metrics = {
            "service": service,
            "cpu_pct": data.get("cpu_pct"),
            "memory_pct": data.get("memory_pct"),
            "error_rate": data.get("error_rate"),
            "p99_latency_ms": data.get("p99_latency_ms"),
            "replicas": data.get("replicas"),
        }
        if "connection_pool" in data:
            metrics["connection_pool"] = data["connection_pool"]
        return {"found": True, **metrics}

    def get_deployment(self, service: str) -> dict[str, Any]:
        data = self.deployments.get(service)
        if not data:
            return {"found": False, "service": service}
        return {"found": True, "service": service, **data}

    def get_history(self) -> list[dict[str, Any]]:
        return list(self.history)

    def mark_recovered(self, service: str) -> None:
        self.recovered = True
        if service in self.services:
            svc = self.services[service]
            svc["status"] = "healthy"
            svc["error_rate"] = 0.01
            svc["p99_latency_ms"] = min(int(svc.get("p99_latency_ms") or 200), 250)
            svc["cpu_pct"] = min(int(svc.get("cpu_pct") or 40), 45)
            svc["memory_pct"] = min(int(svc.get("memory_pct") or 50), 55)
            if "connection_pool" in svc:
                pool = svc["connection_pool"]
                pool["active"] = min(20, pool.get("max", 100))
                pool["waiting"] = 0
                pool["max"] = max(pool.get("max", 100), 200)
        self.logs.append(
            _log(
                0,
                service,
                "INFO",
                "service recovered after approved remediation",
                recovered=True,
            )
        )

    def restart_service(self, service: str) -> dict[str, Any]:
        if service not in self.services:
            return {"ok": False, "error": f"Unknown service '{service}'"}
        self.mark_recovered(service)
        return {"ok": True, "action": "restart_service", "target": service, "recovered": True}

    def rollback_deployment(self, service: str) -> dict[str, Any]:
        if service not in self.deployments:
            return {"ok": False, "error": f"No deployment record for '{service}'"}
        previous = self.deployments[service]["previous"]
        self.deployments[service]["current"] = previous
        self.deployments[service]["status"] = "rolled_back"
        if service in self.services:
            self.services[service]["version"] = previous
        self.mark_recovered(service)
        return {
            "ok": True,
            "action": "rollback_deployment",
            "target": service,
            "version": previous,
            "recovered": True,
        }

    def scale_service(self, service: str, replicas: int = 4) -> dict[str, Any]:
        if service not in self.services:
            return {"ok": False, "error": f"Unknown service '{service}'"}
        self.services[service]["replicas"] = replicas
        self.mark_recovered(service)
        return {"ok": True, "action": "scale_service", "target": service, "replicas": replicas}

    def increase_db_pool(self, service: str) -> dict[str, Any]:
        target = service
        if target not in self.services:
            return {"ok": False, "error": f"Unknown service '{service}'"}
        svc = self.services[target]
        pool = svc.setdefault("connection_pool", {"active": 0, "max": 100, "waiting": 0})
        pool["max"] = max(int(pool.get("max", 100)) * 2, 200)
        pool["waiting"] = 0
        pool["active"] = min(30, pool["max"])
        self.mark_recovered(target)
        # Also recover dependents that were failing due to DB
        for name, other in self.services.items():
            if target in (other.get("depends_on") or []):
                self.mark_recovered(name)
        return {"ok": True, "action": "increase_db_pool", "target": target, "pool": pool}

    def block_ip(self, ip: str) -> dict[str, Any]:
        self.recovered = True
        self.logs.append(_log(0, "waf", "INFO", f"blocked IP {ip}", recovered=True))
        return {"ok": True, "action": "block_ip", "target": ip}

    def clear_cache(self, service: str) -> dict[str, Any]:
        if service in self.services:
            self.mark_recovered(service)
        for name, svc in self.services.items():
            if service in (svc.get("depends_on") or []):
                self.mark_recovered(name)
        return {"ok": True, "action": "clear_cache", "target": service}

    def recycle_workers(self, service: str) -> dict[str, Any]:
        if service not in self.services:
            return {"ok": False, "error": f"Unknown service '{service}'"}
        self.mark_recovered(service)
        return {"ok": True, "action": "recycle_workers", "target": service}

    def rotate_credentials(self, target: str) -> dict[str, Any]:
        self.recovered = True
        if "auth-service" in self.services:
            self.mark_recovered("auth-service")
        return {"ok": True, "action": "rotate_credentials", "target": target}


class SimulationStore:
    def __init__(self) -> None:
        self._worlds: dict[str, SimulationWorld] = {}

    def list_scenarios(self) -> list[dict[str, Any]]:
        items = []
        for sid, spec in SCENARIOS.items():
            items.append(
                {
                    "id": sid,
                    "name": spec["name"],
                    "title": spec["title"],
                    "severity": spec["severity"],
                    "affected_service": spec["affected_service"],
                }
            )
        return items

    def get_scenario(self, scenario_id: str) -> dict[str, Any]:
        spec = SCENARIOS.get(scenario_id)
        if not spec:
            raise KeyError(scenario_id)
        return spec

    def attach(self, incident_id: str, scenario_id: str) -> SimulationWorld:
        spec = self.get_scenario(scenario_id)
        world = SimulationWorld(scenario_id, deepcopy(spec["world"]))
        self._worlds[incident_id] = world
        return world

    def for_incident(self, incident_id: str) -> SimulationWorld | None:
        return self._worlds.get(incident_id)

    def world_or_default(self, incident_id: str, scenario_id: str | None) -> SimulationWorld:
        existing = self._worlds.get(incident_id)
        if existing:
            return existing
        sid = scenario_id or "payment-api-outage"
        if sid not in SCENARIOS:
            sid = "payment-api-outage"
        return self.attach(incident_id, sid)


simulation_store = SimulationStore()

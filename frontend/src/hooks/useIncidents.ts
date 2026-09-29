'use client';

import { useState, useEffect, useCallback } from 'react';
import { getIncidents } from '@/lib/api/incidents';
import { isMockMode } from '@/lib/api/client';
import { mockIncidents } from '@/lib/mock';
import type { Incident } from '@/types';
import { ApiError } from '@/types';

interface UseIncidentsResult {
  incidents: Incident[];
  loading: boolean;
  error: ApiError | null;
  retry: () => void;
  isMock: boolean;
}

export function useIncidents(): UseIncidentsResult {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [mockActive, setMockActive] = useState<boolean>(true);

  // Sync mock state safely after mount
  useEffect(() => {
    setMockActive(isMockMode());

    const handleModeChange = () => {
      setMockActive(isMockMode());
      setRetryCount((c) => c + 1);
    };

    window.addEventListener('opsmind:mode_changed', handleModeChange);
    return () => window.removeEventListener('opsmind:mode_changed', handleModeChange);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchIncidents() {
      setLoading(true);
      setError(null);

      // Explicit mock mode — isolated mock fixtures
      if (mockActive) {
        if (!cancelled) {
          setIncidents(mockIncidents);
          setLoading(false);
        }
        return;
      }

      // Real API mode — do not silently mix mock data
      try {
        const data = await getIncidents();
        if (!cancelled) setIncidents(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err
              : new ApiError(0, 'Unable to load incidents from server.', '/incidents'),
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchIncidents();
    return () => {
      cancelled = true;
    };
  }, [retryCount, mockActive]);

  const retry = useCallback(() => setRetryCount((c) => c + 1), []);

  return { incidents, loading, error, retry, isMock: mockActive };
}


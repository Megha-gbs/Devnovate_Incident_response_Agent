'use client';

import { useState, useEffect, useCallback } from 'react';
import { getIncident } from '@/lib/api/incidents';
import { isMockMode } from '@/lib/api/client';
import { mockIncidents, mockInvestigation } from '@/lib/mock';
import type { Incident } from '@/types';
import { ApiError } from '@/types';

interface UseIncidentResult {
  incident: Incident | null;
  loading: boolean;
  error: ApiError | null;
  retry: () => void;
  setIncident: React.Dispatch<React.SetStateAction<Incident | null>>;
  isMock: boolean;
}

export function useIncident(id: string): UseIncidentResult {
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [mockActive, setMockActive] = useState<boolean>(true);

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

    async function fetchIncident() {
      setLoading(true);
      setError(null);

      // Explicit mock mode
      if (mockActive) {
        if (!cancelled) {
          const found = mockIncidents.find((i) => i.id === id) ?? null;
          const withInvestigation = found
            ? found.id === mockInvestigation.incidentId
              ? { ...found, investigation: mockInvestigation }
              : found
            : null;
          setIncident(withInvestigation);
          setLoading(false);
        }
        return;
      }

      // Real API mode
      try {
        const data = await getIncident(id);
        if (!cancelled) setIncident(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err
              : new ApiError(0, `Unable to load incident ${id}.`, `/incidents/${id}`),
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchIncident();
    return () => {
      cancelled = true;
    };
  }, [id, retryCount, mockActive]);

  const retry = useCallback(() => setRetryCount((c) => c + 1), []);

  return { incident, loading, error, retry, setIncident, isMock: mockActive };
}


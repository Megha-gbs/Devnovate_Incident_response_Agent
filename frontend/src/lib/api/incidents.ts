import { baseRequest } from './client';
import type {
  Incident,
  Resolution,
  Post_Mortem,
  Knowledge_Entry,
  CreateIncidentPayload,
} from '@/types';

// Normalizer ensuring compatibility with both FastAPI backend schemas and internal Next.js endpoints
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeIncident(raw: any): Incident {
  if (!raw || typeof raw !== 'object') return raw;
  return {
    id: raw.id || raw.incident_id || 'INC-UNKNOWN',
    title: raw.title || 'Untitled Incident',
    service: raw.service || raw.affected_service || 'Core Service',
    severity: (raw.severity?.toUpperCase() || 'P2'),
    status: (raw.status?.toUpperCase() === 'RESOLVED' || raw.status === 'resolved') ? 'resolved' : 'active',
    symptoms: raw.symptoms || raw.description || 'Symptoms recorded by system',
    logs: raw.logs || (raw.evidence ? JSON.stringify(raw.evidence, null, 2) : ''),
    timestamp: raw.timestamp || raw.created_at || new Date().toISOString(),
    investigation: raw.investigation,
    resolution: raw.resolution,
    postMortem: raw.postMortem || raw.post_mortem,
    knowledgeEntry: raw.knowledgeEntry || raw.knowledge_entry,
  };
}

/**
 * Fetch all incidents.
 * GET /incidents
 */
export async function getIncidents(): Promise<Incident[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawList = await baseRequest<any[]>('/incidents');
  if (Array.isArray(rawList)) {
    return rawList.map(normalizeIncident);
  }
  return [];
}

/**
 * Fetch a single incident by ID.
 * GET /incidents/:id
 */
export async function getIncident(id: string): Promise<Incident> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await baseRequest<any>(`/incidents/${id}`);
  return normalizeIncident(raw);
}

/**
 * Create a new incident.
 * POST /incidents
 */
export async function createIncident(payload: CreateIncidentPayload): Promise<Incident> {
  const body = {
    ...payload,
    affected_service: payload.service,
    description: payload.symptoms,
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await baseRequest<any>('/incidents', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return normalizeIncident(raw);
}

/**
 * Resolve an incident.
 * POST /incidents/:id/resolve
 */
export async function resolveIncident(
  id: string,
  resolution: Omit<Resolution, 'incidentId' | 'resolvedAt'>,
): Promise<Incident> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await baseRequest<any>(`/incidents/${id}/resolve`, {
    method: 'POST',
    body: JSON.stringify(resolution),
  });
  return normalizeIncident(raw);
}

/**
 * Create a post-mortem for a resolved incident.
 * POST /incidents/:id/postmortem
 */
export async function createPostMortem(
  id: string,
  postMortem: Omit<Post_Mortem, 'incidentId' | 'authoredAt'>,
): Promise<Post_Mortem> {
  return baseRequest<Post_Mortem>(`/incidents/${id}/postmortem`, {
    method: 'POST',
    body: JSON.stringify(postMortem),
  });
}

/**
 * Retain knowledge for an incident.
 * POST /incidents/:id/retain
 */
export async function retainKnowledge(
  id: string,
  payload: { insight: string; tags: string[] },
): Promise<Knowledge_Entry> {
  return baseRequest<Knowledge_Entry>(`/incidents/${id}/retain`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

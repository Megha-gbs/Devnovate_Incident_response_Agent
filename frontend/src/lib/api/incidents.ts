import { baseRequest, isMockMode } from './client';
import { mockIncidents } from '@/lib/mock';
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
  if (isMockMode()) {
    return [...mockIncidents];
  }
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
  if (isMockMode()) {
    const found = mockIncidents.find((i) => i.id === id);
    if (found) return found;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await baseRequest<any>(`/incidents/${id}`);
  return normalizeIncident(raw);
}

/**
 * Create a new incident.
 * POST /incidents
 */
export async function createIncident(payload: CreateIncidentPayload): Promise<Incident> {
  if (isMockMode()) {
    const nextNumber = mockIncidents.length + 25;
    const newInc: Incident = {
      id: `INC-0${nextNumber}`,
      title: payload.title,
      service: payload.service,
      severity: payload.severity,
      symptoms: payload.symptoms,
      logs: payload.logs,
      timestamp: payload.timestamp || new Date().toISOString(),
      status: 'active',
    };
    mockIncidents.unshift(newInc);
    return newInc;
  }

  const body = {
    title: payload.title,
    service: payload.service,
    affected_service: payload.service,
    affectedService: payload.service,
    severity: payload.severity,
    symptoms: payload.symptoms,
    description: payload.symptoms,
    logs: payload.logs,
    diagnostic_logs: payload.logs,
    diagnosticLogs: payload.logs,
    timestamp: payload.timestamp,
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
  resolution: Omit<Resolution, 'incidentId' | 'resolvedAt'> & {
    root_cause?: string;
    rootCause?: string;
    resolution?: string;
    remediation?: string;
    resolved_by?: string;
  },
): Promise<Incident> {
  if (isMockMode()) {
    const resolvedAt = new Date().toISOString();
    const resObj: Resolution = {
      incidentId: id,
      summary: resolution.summary,
      resolvedBy: resolution.resolvedBy || resolution.resolved_by || 'Lead SRE',
      resolvedAt,
      rootCause: resolution.rootCause || resolution.root_cause || '',
      root_cause: resolution.root_cause || resolution.rootCause || '',
      resolution: resolution.resolution || resolution.remediation || resolution.summary,
      remediation: resolution.remediation || resolution.resolution || resolution.summary,
    };
    const found = mockIncidents.find((i) => i.id === id);
    if (found) {
      found.status = 'resolved';
      found.resolution = resObj;
      return { ...found };
    }
    const fallback: Incident = {
      id,
      title: 'Resolved Incident',
      service: 'System',
      severity: 'P2',
      status: 'resolved',
      symptoms: 'Reported symptoms',
      logs: '',
      timestamp: resolvedAt,
      resolution: resObj,
    };
    mockIncidents.unshift(fallback);
    return fallback;
  }

  const body = {
    summary: resolution.summary,
    root_cause: resolution.root_cause || resolution.rootCause,
    rootCause: resolution.rootCause || resolution.root_cause,
    resolution: resolution.resolution || resolution.remediation || resolution.summary,
    remediation: resolution.remediation || resolution.resolution || resolution.summary,
    resolved_by: resolution.resolved_by || resolution.resolvedBy,
    resolvedBy: resolution.resolvedBy || resolution.resolved_by,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await baseRequest<any>(`/incidents/${id}/resolve`, {
    method: 'POST',
    body: JSON.stringify(body),
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
  if (isMockMode()) {
    return {
      incidentId: id,
      rootCause: postMortem.rootCause,
      impact: postMortem.impact,
      timeline: postMortem.timeline,
      actionItems: postMortem.actionItems,
      authoredAt: new Date().toISOString(),
    };
  }
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
  if (isMockMode()) {
    return {
      incidentId: id,
      insight: payload.insight,
      tags: payload.tags,
      retainedAt: new Date().toISOString(),
    };
  }
  return baseRequest<Knowledge_Entry>(`/incidents/${id}/retain`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

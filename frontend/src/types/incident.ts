export type Severity = 'P1' | 'P2' | 'P3' | 'P4';

export interface Incident {
  id: string;
  title: string;
  service: string;
  severity: Severity;
  symptoms: string;
  logs: string;
  timestamp: string; // ISO 8601
  status: 'active' | 'resolved';
  investigation?: import('./investigation').Investigation;
  resolution?: Resolution;
  postMortem?: Post_Mortem;
  knowledgeEntry?: Knowledge_Entry;
}

export interface Resolution {
  incidentId: string;
  summary: string;
  resolvedBy: string;
  resolvedAt: string;
}

export interface Post_Mortem {
  incidentId: string;
  rootCause: string;
  impact: string;
  timeline: string;
  actionItems: string[];
  authoredAt: string;
}

export interface Knowledge_Entry {
  incidentId: string;
  insight: string;
  tags: string[];
  retainedAt: string;
}

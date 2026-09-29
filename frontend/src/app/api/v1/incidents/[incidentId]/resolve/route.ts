import { NextResponse } from 'next/server';
import { mockIncidents } from '@/lib/mock';
import type { Incident, Resolution } from '@/types';

export async function POST(
  request: Request,
  { params }: { params: { incidentId: string } },
) {
  try {
    const { incidentId } = params;
    const body = await request.json();

    const resolution: Resolution = {
      incidentId,
      summary: body.summary,
      resolvedBy: body.resolvedBy || 'on-call-sre',
      resolvedAt: new Date().toISOString(),
    };

    const incident = mockIncidents.find((i) => i.id === incidentId) || {
      id: incidentId,
      title: 'Active Incident',
      service: 'Core Platform',
      severity: 'P1',
      symptoms: 'Reported symptoms',
      logs: 'Reported logs',
      timestamp: new Date().toISOString(),
      status: 'active' as const,
    };

    const resolvedIncident: Incident = {
      ...incident,
      status: 'resolved',
      resolution,
    };

    return NextResponse.json(resolvedIncident);
  } catch {
    return NextResponse.json({ detail: 'Invalid resolution payload.' }, { status: 400 });
  }
}

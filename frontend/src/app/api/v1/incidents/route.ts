import { NextResponse } from 'next/server';
import { mockIncidents } from '@/lib/mock';
import type { Incident, CreateIncidentPayload } from '@/types';

// In-memory incidents store for the session when running via Next.js API
const inMemoryIncidents: Incident[] = [...mockIncidents];

export async function GET() {
  return NextResponse.json(inMemoryIncidents);
}

export async function POST(request: Request) {
  try {
    const payload: CreateIncidentPayload = await request.json();

    if (!payload.title || !payload.service || !payload.severity) {
      return NextResponse.json(
        { detail: 'Missing required incident fields: title, service, and severity are required.' },
        { status: 422 },
      );
    }

    const nextNumber = inMemoryIncidents.length + 25;
    const newIncident: Incident = {
      id: `INC-0${nextNumber}`,
      title: payload.title,
      service: payload.service,
      severity: payload.severity,
      symptoms: payload.symptoms || 'Symptoms recorded by on-call engineer',
      logs: payload.logs || 'No additional log lines attached',
      timestamp: payload.timestamp || new Date().toISOString(),
      status: 'active',
    };

    inMemoryIncidents.unshift(newIncident);

    return NextResponse.json(newIncident, { status: 201 });
  } catch {
    return NextResponse.json(
      { detail: 'Invalid JSON request payload.' },
      { status: 400 },
    );
  }
}

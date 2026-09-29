import { NextResponse } from 'next/server';
import type { UpdateStepPayload, InvestigationStep } from '@/types';

export async function POST(
  request: Request,
  { params }: { params: { incidentId: string } },
) {
  try {
    const { incidentId } = params;
    const payload: UpdateStepPayload = await request.json();
    const updatedStep: InvestigationStep = {
      id: payload.stepId,
      action: `Step for ${incidentId}`,
      rationale: 'Updated via operational investigation workflow',
      status: payload.status,
      order: 1,
      notes: payload.notes,
    };
    return NextResponse.json(updatedStep);
  } catch {
    return NextResponse.json({ detail: 'Invalid step update payload.' }, { status: 400 });
  }
}

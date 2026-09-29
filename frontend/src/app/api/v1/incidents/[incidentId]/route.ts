import { NextResponse } from 'next/server';
import { mockIncidents, mockInvestigation } from '@/lib/mock';

export async function GET(
  request: Request,
  { params }: { params: { incidentId: string } },
) {
  const { incidentId } = params;
  const found = mockIncidents.find((i) => i.id === incidentId);

  if (!found) {
    return NextResponse.json(
      { detail: `Incident with ID ${incidentId} was not found.` },
      { status: 404 },
    );
  }

  const withInvestigation =
    found.id === mockInvestigation.incidentId
      ? { ...found, investigation: mockInvestigation }
      : found;

  return NextResponse.json(withInvestigation);
}

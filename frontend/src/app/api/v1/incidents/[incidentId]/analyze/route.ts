import { NextResponse } from 'next/server';
import { mockInvestigation } from '@/lib/mock';

export async function POST(
  request: Request,
  { params }: { params: { incidentId: string } },
) {
  const { incidentId } = params;

  return NextResponse.json({
    ...mockInvestigation,
    id: `INV-${incidentId}-${Date.now().toString().slice(-4)}`,
    incidentId,
    createdAt: new Date().toISOString(),
  });
}

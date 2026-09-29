import { NextResponse } from 'next/server';
import type { Knowledge_Entry } from '@/types';

export async function POST(
  request: Request,
  { params }: { params: { incidentId: string } },
) {
  try {
    const { incidentId } = params;
    const body = await request.json();

    const knowledgeEntry: Knowledge_Entry = {
      incidentId,
      insight: body.insight,
      tags: body.tags || [],
      retainedAt: new Date().toISOString(),
    };

    return NextResponse.json(knowledgeEntry);
  } catch {
    return NextResponse.json({ detail: 'Invalid retain knowledge payload.' }, { status: 400 });
  }
}

import { NextResponse } from 'next/server';
import type { Post_Mortem } from '@/types';

export async function POST(
  request: Request,
  { params }: { params: { incidentId: string } },
) {
  try {
    const { incidentId } = params;
    const body = await request.json();

    const postMortem: Post_Mortem = {
      incidentId,
      rootCause: body.rootCause,
      impact: body.impact,
      timeline: body.timeline,
      actionItems: body.actionItems || [],
      authoredAt: new Date().toISOString(),
    };

    return NextResponse.json(postMortem);
  } catch {
    return NextResponse.json({ detail: 'Invalid post-mortem payload.' }, { status: 400 });
  }
}

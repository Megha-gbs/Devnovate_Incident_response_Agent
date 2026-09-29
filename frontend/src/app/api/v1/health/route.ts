import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'opsmind-incident-intelligence',
    version: '1.2.0',
    timestamp: new Date().toISOString(),
  });
}

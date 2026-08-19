import { runIngestion } from '@robot-jobs-board/ingestion';
import { NextResponse } from 'next/server';
import { cronAuthorized } from '@/lib/admin';

export const maxDuration = 800;
export const dynamic = 'force-dynamic';

async function handle(request: Request) {
  if (!cronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const metrics = await runIngestion();
  return NextResponse.json({ ok: true, metrics });
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}

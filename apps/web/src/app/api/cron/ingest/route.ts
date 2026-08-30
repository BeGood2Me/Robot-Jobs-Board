import { NextResponse } from 'next/server';
import { cronAuthorized } from '@/lib/admin';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

const REPO = process.env.INGEST_GITHUB_REPO ?? 'BeGood2Me/Robot-Jobs-Board';
const WORKFLOW = process.env.INGEST_GITHUB_WORKFLOW ?? 'ingest.yml';

/**
 * Vercel Cron (Hobby: once/day) triggers the GitHub Actions ingest workflow.
 * GitHub's own `schedule` cron is best-effort and can silently drop runs.
 */
async function handle(request: Request) {
  if (!cronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = process.env.INGEST_DISPATCH_TOKEN;
  if (!token) {
    return NextResponse.json(
      {
        error: 'INGEST_DISPATCH_TOKEN is not set',
        hint: 'Add a GitHub PAT (repo + workflow) as INGEST_DISPATCH_TOKEN on Vercel.',
      },
      { status: 500 },
    );
  }

  const url = `https://api.github.com/repos/${REPO}/actions/workflows/${WORKFLOW}/dispatches`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ref: 'main' }),
  });

  if (!res.ok) {
    const body = await res.text();
    return NextResponse.json(
      { error: 'Failed to dispatch GitHub workflow', status: res.status, body },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    dispatched: true,
    repo: REPO,
    workflow: WORKFLOW,
  });
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}

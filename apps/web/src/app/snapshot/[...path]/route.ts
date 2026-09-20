import { readStaticSnapshotFile } from '@/lib/snapshot/load';
import { PUBLIC_REVALIDATE_SECONDS } from '@/lib/site';

export const revalidate = 3600;

type Params = { path: string[] };

export async function GET(
  _request: Request,
  context: { params: Promise<Params> },
) {
  const { path } = await context.params;
  const name = path.join('/');
  if (name.includes('..') || name.startsWith('jobs/')) {
    return new Response('Not found', { status: 404 });
  }

  if (name.endsWith('.json.gz') || name === 'board.json.gz' || name === 'bodies.json.gz') {
    // Binary snapshots are loaded server-side from Neon; keep public HTTP for MCP/tools.
    const { getSnapshotBinary } = await import('@/lib/snapshot/load');
    const bytes = await getSnapshotBinary(name);
    if (!bytes) return new Response('Not found', { status: 404 });
    return new Response(new Uint8Array(bytes), {
      headers: {
        'Content-Type': 'application/gzip',
        'Cache-Control': `public, s-maxage=${PUBLIC_REVALIDATE_SECONDS}, stale-while-revalidate=86400`,
      },
    });
  }

  const text = await readStaticSnapshotFile(name);
  if (!text) return new Response('Not found', { status: 404 });
  const type = name.endsWith('.xml')
    ? 'application/xml; charset=utf-8'
    : 'application/json; charset=utf-8';
  return new Response(text, {
    headers: {
      'Content-Type': type,
      'Cache-Control': `public, s-maxage=${PUBLIC_REVALIDATE_SECONDS}, stale-while-revalidate=86400`,
    },
  });
}

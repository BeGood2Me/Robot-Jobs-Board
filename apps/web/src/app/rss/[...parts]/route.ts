import { resolveFeedByInternalParts } from '@/lib/rss/registry';
import { serveFeedXml } from '@/lib/rss/serve';

export const revalidate = 86400;

export async function GET(_request: Request, { params }: { params: Promise<{ parts: string[] }> }) {
  const { parts } = await params;
  const resolved = await resolveFeedByInternalParts(parts);

  if (resolved === 'no_snapshot') {
    return new Response('Feed unavailable — snapshot not loaded yet.', { status: 503 });
  }
  if (resolved === 'not_found') {
    return new Response('Feed not found.', { status: 404 });
  }

  return serveFeedXml(resolved);
}
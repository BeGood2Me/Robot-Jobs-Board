import { PUBLIC_REVALIDATE_SECONDS } from '@/lib/site';
import { readStaticSnapshotFile } from './load';

export function snapshotXmlHeaders() {
  return {
    'Content-Type': 'application/xml; charset=utf-8',
    'Cache-Control': `public, s-maxage=${PUBLIC_REVALIDATE_SECONDS}, stale-while-revalidate=86400`,
  };
}

export function readSnapshotSitemap(name: string): string | null {
  return readStaticSnapshotFile(name);
}

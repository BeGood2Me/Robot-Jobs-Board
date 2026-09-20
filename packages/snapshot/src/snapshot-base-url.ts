const DEFAULT_CDN =
  'https://raw.githubusercontent.com/BeGood2Me/Robot-Jobs-Board/snapshot-data/snapshot';

/** Where board.json.gz / bodies.json.gz / sitemaps are loaded (GitHub — not Neon). */
export function resolveSnapshotBaseUrl(options?: { port?: string }): string {
  const fromEnv =
    process.env.SNAPSHOT_BASE_URL?.trim() || process.env.NEXT_PUBLIC_SNAPSHOT_BASE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  if (process.env.NODE_ENV === 'development') {
    const port = options?.port ?? process.env.PORT ?? '3000';
    return `http://localhost:${port}/snapshot`;
  }

  return DEFAULT_CDN;
}

export const DEFAULT_SNAPSHOT_CDN = DEFAULT_CDN;

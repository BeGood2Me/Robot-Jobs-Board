import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { loadEnvConfig } from '@next/env';
import type { NextConfig } from 'next';

function monorepoRoot() {
  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    if (existsSync(resolve(dir, 'pnpm-workspace.yaml'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return resolve(process.cwd(), '../..');
}

loadEnvConfig(monorepoRoot());

const nextConfig: NextConfig = {
  agentRules: false,
  env: {
    // Bake in so SSG never falls back to Neon when free-tier transfer is exhausted.
    SNAPSHOT_ONLY: process.env.SNAPSHOT_ONLY ?? '1',
  },
  transpilePackages: [
    '@robot-jobs-board/db',
    '@robot-jobs-board/config',
    '@robot-jobs-board/ingestion',
    '@robot-jobs-board/taxonomy',
    '@robot-jobs-board/snapshot',
    '@robot-jobs-board/mcp',
  ],
  // Keep ~2.5k per-job gzip bodies out of serverless traces (served as static CDN files).
  outputFileTracingExcludes: {
    '*': ['./public/snapshot/jobs/**/*'],
  },
  serverExternalPackages: ['@prisma/client', 'prisma'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'boards.greenhouse.io' },
      { protocol: 'https', hostname: 'job-boards.greenhouse.io' },
    ],
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'robotjobsboard.com' }],
        destination: 'https://www.robotjobsboard.com/:path*',
        permanent: true,
      },
      // CDN redirect — avoids a force-dynamic Node function for legacy /jobs URLs.
      { source: '/jobs', destination: '/', permanent: true },
      { source: '/blog', destination: '/guides', permanent: true },
      { source: '/blog/:slug', destination: '/guides/:slug', permanent: true },
      { source: '/skills/:slug-jobs', destination: '/?tag=:slug', permanent: true },
    ];
  },
};

export default nextConfig;

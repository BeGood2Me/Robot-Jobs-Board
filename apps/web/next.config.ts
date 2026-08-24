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
  // Vercel serverless bundles exclude public/ by default; include snapshot for SSR reads.
  outputFileTracingIncludes: {
    '/*': ['./public/snapshot/**/*'],
  },
  transpilePackages: [
    '@robot-jobs-board/db',
    '@robot-jobs-board/config',
    '@robot-jobs-board/ingestion',
    '@robot-jobs-board/taxonomy',
    '@robot-jobs-board/snapshot',
  ],
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
      { source: '/blog', destination: '/guides', permanent: true },
      { source: '/blog/:slug', destination: '/guides/:slug', permanent: true },
      { source: '/skills/:slug-jobs', destination: '/?tag=:slug', permanent: true },
    ];
  },
};

export default nextConfig;

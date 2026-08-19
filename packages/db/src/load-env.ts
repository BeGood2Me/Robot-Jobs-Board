import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { config as loadDotenv } from 'dotenv';

function monorepoRoot() {
  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    if (existsSync(resolve(dir, 'pnpm-workspace.yaml'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return process.cwd();
}

export function loadDatabaseEnv() {
  if (process.env.DATABASE_URL) return;
  const roots = new Set([process.cwd(), monorepoRoot(), resolve(process.cwd(), '../..'), resolve(process.cwd(), '..')]);
  for (const root of roots) {
    for (const file of ['.env.local', '.env']) {
      const path = resolve(root, file);
      if (!existsSync(path)) continue;
      loadDotenv({ path, override: false });
      if (process.env.DATABASE_URL) return;
    }
  }
}

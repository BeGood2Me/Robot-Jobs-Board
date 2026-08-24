import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { defaultSnapshotOutDir } from './export';

const repoRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../..');

describe('defaultSnapshotOutDir', () => {
  it('resolves from packages/snapshot (pnpm filter cwd)', () => {
    expect(defaultSnapshotOutDir(resolve(repoRoot, 'packages/snapshot'))).toBe(
      resolve(repoRoot, 'apps/web/public/snapshot'),
    );
  });

  it('resolves from repo root', () => {
    expect(defaultSnapshotOutDir(repoRoot)).toBe(resolve(repoRoot, 'apps/web/public/snapshot'));
  });

  it('resolves from apps/web', () => {
    expect(defaultSnapshotOutDir(resolve(repoRoot, 'apps/web'))).toBe(
      resolve(repoRoot, 'apps/web/public/snapshot'),
    );
  });
});

import { createHash } from 'node:crypto';

/** Deterministic id so feed-only snapshots stay stable across exports. */
export function stableEntityId(prefix: string, key: string): string {
  const hex = createHash('sha256').update(`${prefix}\0${key}`).digest('hex');
  return `c${hex.slice(0, 24)}`;
}

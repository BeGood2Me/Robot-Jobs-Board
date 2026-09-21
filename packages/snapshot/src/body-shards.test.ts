import { describe, expect, it } from 'vitest';
import { BODIES_SHARD_COUNT, bodyShardIndex, bodyShardPath } from './types';

describe('body shards', () => {
  it('keeps shard index stable and in range', () => {
    const id = 'cf436a536d7a5bf08f5d02822';
    const a = bodyShardIndex(id);
    const b = bodyShardIndex(id);
    expect(a).toBe(b);
    expect(a).toBeGreaterThanOrEqual(0);
    expect(a).toBeLessThan(BODIES_SHARD_COUNT);
    expect(bodyShardPath(id)).toBe(`bodies/shards/${a}.json.gz`);
  });

  it('spreads sample ids across multiple shards', () => {
    const ids = [
      'cf436a536d7a5bf08f5d02822',
      'cdbc264382e75d1d14d864ac0',
      'c6d0b853d3fc3f598d8485858',
      'c2354578b2792ea90dcddcdf2',
      'cc89e571e35872747891d16be',
      'c11565e2387db08a9d2d66606',
    ];
    const shards = new Set(ids.map((id) => bodyShardIndex(id)));
    expect(shards.size).toBeGreaterThan(1);
  });
});

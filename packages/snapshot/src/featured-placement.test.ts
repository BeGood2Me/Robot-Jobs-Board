import { describe, expect, it } from 'vitest';
import { capHomepagePaidFeatured } from './featured-placement';
import type { SnapshotJob } from './types';

function job(id: string): SnapshotJob {
  return {
    id,
    slug: id,
    title: 'Role',
    url: 'https://example.com',
    locationRaw: null,
    country: null,
    region: null,
    city: null,
    isRemote: false,
    workplaceType: 'ONSITE',
    employmentType: 'FULL_TIME',
    department: null,
    compensationText: null,
    postedAt: '2026-01-01T00:00:00.000Z',
    expiresAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    isHidden: false,
    isActive: true,
    sourceSystem: 'greenhouse',
    externalId: id,
    companyId: 'co1',
    company: { name: 'Co', slug: 'co', website: null, logoUrl: null, sourceIdentifier: null },
    robotDomains: [],
    techTags: [],
    seniorities: [],
    featuredUntil: '2099-01-01T00:00:00.000Z',
    featuredAt: '2026-01-01T00:00:00.000Z',
    featuredSource: 'paid',
  };
}

describe('homepage featured cap', () => {
  it('limits paid homepage pins to 5', () => {
    const rows = Array.from({ length: 8 }, (_, i) => job(`h${i}`));
    const capped = capHomepagePaidFeatured(rows);
    expect(capped).toHaveLength(5);
  });
});
import { describe, expect, it } from 'vitest';
import { sortJobsNewest } from './filter';
import { manualFeaturedJobs } from './manual-featured';
import type { SnapshotJob } from './types';

function featuredJob(id: string, source: SnapshotJob['featuredSource']): SnapshotJob {
  return {
    id,
    slug: id,
    title: id,
    url: 'https://example.com',
    locationRaw: null,
    country: null,
    region: null,
    city: null,
    isRemote: true,
    workplaceType: 'REMOTE',
    employmentType: 'FULL_TIME',
    department: null,
    compensationText: null,
    postedAt: '2026-01-01T00:00:00.000Z',
    expiresAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    isHidden: false,
    isActive: true,
    sourceSystem: 'direct',
    externalId: id,
    companyId: 'c1',
    company: {
      name: 'Co',
      slug: 'co',
      website: null,
      logoUrl: null,
      sourceIdentifier: null,
    },
    robotDomains: [],
    techTags: [],
    seniorities: [],
    featuredUntil: '2099-01-01T00:00:00.000Z',
    featuredAt: '2026-01-01T00:00:00.000Z',
    featuredSource: source,
  };
}

describe('sortJobsNewest featured precedence', () => {
  it('lists paid Featured above partner manual Featured', () => {
    const partner = featuredJob('partner', 'partner');
    const paid = featuredJob('paid', null);
    const rest = featuredJob('rest', null);
    rest.featuredUntil = null;

    const sorted = sortJobsNewest([partner, paid, rest]);
    expect(sorted[0]?.id).toBe('paid');
    expect(sorted[1]?.id).toBe('partner');
    expect(sorted[2]?.id).toBe('rest');
  });
});

describe('manualFeaturedJobs', () => {
  it('includes micro1 referral apply URL', () => {
    const [job] = manualFeaturedJobs();
    expect(job?.url).toContain('referralCode=3943c7a5-1466-416f-81e0-f148afc37813');
    expect(job?.featuredSource).toBe('partner');
  });
});

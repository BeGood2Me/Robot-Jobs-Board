import { describe, expect, it } from 'vitest';
import { buildGoneJobs } from './export-from-feeds';
import type { PublicBoardSnapshot, SnapshotJob } from './types';

function job(partial: Partial<SnapshotJob> & Pick<SnapshotJob, 'id' | 'slug' | 'title'>): SnapshotJob {
  return {
    url: 'https://example.com',
    locationRaw: 'Berlin, Germany',
    country: 'Germany',
    region: null,
    city: 'Berlin',
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
    externalId: partial.id,
    companyId: 'co-1',
    company: {
      name: 'NEURA Robotics',
      slug: 'neura-robotics',
      website: null,
      logoUrl: null,
      sourceIdentifier: 'neura',
    },
    robotDomains: [],
    techTags: [],
    seniorities: [],
    ...partial,
  };
}

describe('buildGoneJobs', () => {
  it('does not mark retained company jobs as gone after a feed failure', () => {
    const previous: PublicBoardSnapshot = {
      version: 1,
      generatedAt: '2026-01-01T00:00:00.000Z',
      siteUrl: 'https://www.robotjobsboard.com',
      jobs: [
        job({ id: 'neura-1', slug: 'role-a', title: 'Role A' }),
        job({
          id: 'other-1',
          slug: 'role-b',
          title: 'Role B',
          company: {
            name: 'Figure',
            slug: 'figure',
            website: null,
            logoUrl: null,
            sourceIdentifier: 'figure',
          },
        }),
      ],
      goneJobs: [],
      companies: [],
      domains: [],
      tags: [],
      seniorities: [],
      countryFacets: [],
      places: { cities: [], countries: [], regions: [] },
    };

    const active = [job({ id: 'other-1', slug: 'role-b', title: 'Role B', company: previous.jobs[1].company })];
    const gone = buildGoneJobs(previous, active, new Set(['neura-robotics']));

    expect(gone.map((item) => item.id)).toEqual([]);
  });

  it('still marks jobs gone when the company feed succeeded without them', () => {
    const previous: PublicBoardSnapshot = {
      version: 1,
      generatedAt: '2026-01-01T00:00:00.000Z',
      siteUrl: 'https://www.robotjobsboard.com',
      jobs: [job({ id: 'neura-1', slug: 'role-a', title: 'Role A' })],
      goneJobs: [],
      companies: [],
      domains: [],
      tags: [],
      seniorities: [],
      countryFacets: [],
      places: { cities: [], countries: [], regions: [] },
    };

    const gone = buildGoneJobs(previous, [], new Set());
    expect(gone.map((item) => item.id)).toEqual(['neura-1']);
  });
});

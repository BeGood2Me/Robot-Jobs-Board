import { describe, expect, it } from 'vitest';
import { matchesJobFilters } from './filter';
import type { SnapshotJob } from './types';

function job(partial: Partial<SnapshotJob> & Pick<SnapshotJob, 'id' | 'title'>): SnapshotJob {
  return {
    slug: 'role',
    url: 'https://example.com',
    locationRaw: 'Remote',
    country: 'United States',
    region: null,
    city: null,
    isRemote: true,
    workplaceType: 'REMOTE',
    employmentType: 'INTERN',
    department: null,
    compensationText: null,
    postedAt: '2026-01-01T00:00:00.000Z',
    expiresAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    isHidden: false,
    isActive: true,
    sourceSystem: 'ashby',
    externalId: partial.id,
    companyId: 'co-1',
    company: {
      name: 'Example',
      slug: 'example',
      website: null,
      logoUrl: null,
      sourceIdentifier: 'example',
    },
    robotDomains: [],
    techTags: [],
    seniorities: [],
    internshipTrack: null,
    ...partial,
  };
}

describe('internshipTrack filters', () => {
  it('matches explicit UG / PG / PhD internship tracks', () => {
    const ug = job({ id: '1', title: 'UG Intern', internshipTrack: 'ug' });
    const phd = job({ id: '2', title: 'PhD Intern', internshipTrack: 'phd' });
    expect(matchesJobFilters(ug, { internshipTracks: ['ug'] })).toBe(true);
    expect(matchesJobFilters(ug, { internshipTracks: ['phd'] })).toBe(false);
    expect(matchesJobFilters(phd, { internshipTracks: ['ug', 'phd'] })).toBe(true);
  });

  it('excludes internships with no classified track', () => {
    const unclear = job({ id: '3', title: 'Software Intern', internshipTrack: null });
    expect(matchesJobFilters(unclear, { internshipTracks: ['ug'] })).toBe(false);
  });
});

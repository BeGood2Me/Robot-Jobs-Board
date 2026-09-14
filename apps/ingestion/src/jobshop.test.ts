import { describe, expect, it } from 'vitest';
import { mapJobShopJobPosting } from './connectors/jobshop';

describe('jobshop connector', () => {
  it('maps JobPosting JSON-LD into a normalized job', () => {
    const job = mapJobShopJobPosting(
      {
        '@type': 'JobPosting',
        title: 'Senior Navigation Engineer (human)',
        description: '<p>Build SLAM and localization for mobile robots.</p>',
        datePosted: '2026-08-14T00:00:00+02:00',
        employmentType: 'full-time',
        url: 'https://jobs.neura-robotics.com/offer/senior-navigation/03d2b7f5-f7bc-4cad-b90e-ecc753a55891',
        identifier: { value: '03d2b7f5-f7bc-4cad-b90e-ecc753a55891' },
        jobLocation: {
          '@type': 'Place',
          address: {
            addressLocality: 'Riederich',
            addressCountry: 'DE',
          },
        },
      },
      'https://jobs.neura-robotics.com/offer/senior-navigation/03d2b7f5-f7bc-4cad-b90e-ecc753a55891',
    );

    expect(job).toMatchObject({
      externalId: '03d2b7f5-f7bc-4cad-b90e-ecc753a55891',
      sourceSystem: 'jobshop',
      title: 'Senior Navigation Engineer',
      country: 'Germany',
      city: 'Riederich',
      employmentType: 'FULL_TIME',
    });
    expect(job.descriptionPlain).toContain('SLAM');
  });
});

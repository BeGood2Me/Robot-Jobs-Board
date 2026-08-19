import { describe, expect, it } from 'vitest';
import { directApplyUrl, greenhouseJobListingUrl } from './apply-url';

describe('directApplyUrl', () => {
  it('rewrites Greenhouse career-board URLs to a single job listing', () => {
    expect(
      directApplyUrl({
        url: 'https://www.zipline.com/open-roles?gh_jid=7888589003',
        sourceSystem: 'greenhouse',
        externalId: '7888589003',
        company: { sourceIdentifier: 'flyzipline' },
      }),
    ).toBe('https://www.zipline.com/open-roles/7888589003');
    expect(
      directApplyUrl({
        url: 'https://job-boards.greenhouse.io/figureai',
        sourceSystem: 'greenhouse',
        externalId: '4705588006',
        company: { sourceIdentifier: 'figureai' },
      }),
    ).toBe(greenhouseJobListingUrl('figureai', '4705588006'));
    expect(
      directApplyUrl({
        url: 'https://boards.greenhouse.io/embed/job_app?for=nuro&token=8114353',
        sourceSystem: 'greenhouse',
        externalId: '8114353',
        company: { sourceIdentifier: 'nuro' },
      }),
    ).toBe(greenhouseJobListingUrl('nuro', '8114353'));
  });

  it('keeps Greenhouse-hosted job listing URLs', () => {
    const url = 'https://boards.greenhouse.io/andurilindustries/jobs/5107130007?gh_jid=5107130007';
    expect(
      directApplyUrl({
        url,
        sourceSystem: 'greenhouse',
        externalId: '5107130007',
        company: { sourceIdentifier: 'andurilindustries' },
      }),
    ).toBe(url);
    const jobBoards = 'https://job-boards.greenhouse.io/figureai/jobs/4705588006';
    expect(
      directApplyUrl({
        url: jobBoards,
        sourceSystem: 'greenhouse',
        externalId: '4705588006',
        company: { sourceIdentifier: 'figureai' },
      }),
    ).toBe(jobBoards);
  });

  it('opens the job posting instead of the application form', () => {
    expect(
      directApplyUrl({
        url: 'https://jobs.ashbyhq.com/1x/d718036a-530c-40cd-bfed-63ce8e64dc75/application',
        sourceSystem: 'ashby',
        externalId: 'd718036a-530c-40cd-bfed-63ce8e64dc75',
        company: { sourceIdentifier: '1x' },
      }),
    ).toBe('https://jobs.ashbyhq.com/1x/d718036a-530c-40cd-bfed-63ce8e64dc75');
    expect(
      directApplyUrl({
        url: 'https://jobs.lever.co/shieldai/ee614940-c594-41da-8432-8a677e21520d/apply',
        sourceSystem: 'lever',
        externalId: 'ee614940-c594-41da-8432-8a677e21520d',
        company: { sourceIdentifier: 'shieldai' },
      }),
    ).toBe('https://jobs.lever.co/shieldai/ee614940-c594-41da-8432-8a677e21520d');
  });
});

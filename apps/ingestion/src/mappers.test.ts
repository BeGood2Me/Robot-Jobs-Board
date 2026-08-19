import { describe, expect, it } from 'vitest';
import { mapAshbyJob } from './connectors/ashby';
import { mapGreenhouseJob } from './connectors/greenhouse';
import { mapLeverJob } from './connectors/lever';
import { mapAggregatorJob } from './connectors/aggregator';
import { mapWorkableJob } from './connectors/workable';
import { mapWorkdayJob } from './connectors/workday';
import type { AshbyJob, GreenhouseJob, LeverPosting } from './connectors/api-types';

const ashbyFixture: AshbyJob = {
  id: 'ash-1',
  title: 'Senior AMR Software Engineer',
  departmentName: 'Autonomy',
  employmentType: 'FullTime',
  locationName: 'Dublin, Ireland',
  locationIsRemote: false,
  jobUrl: 'https://jobs.ashbyhq.com/example/ash-1',
  applyUrl: 'https://jobs.ashbyhq.com/example/ash-1/apply',
  descriptionHtml: '<p>Build ROS 2 navigation for warehouse AMRs in C++.</p>',
  descriptionPlain: 'Build ROS 2 navigation for warehouse AMRs in C++.',
  publishedAt: '2026-08-01T00:00:00.000Z',
  compensation: { compensationTierSummary: '€80k–€110k' },
};

const greenhouseFixture: GreenhouseJob = {
  id: 123,
  title: 'Staff Humanoid Controls Engineer',
  absolute_url: 'https://boards.greenhouse.io/figureai/jobs/123',
  first_published: '2026-07-15T12:00:00-07:00',
  location: { name: 'San Jose, CA' },
  offices: [{ name: 'San Jose' }],
  departments: [{ name: 'Controls' }],
  content: '<div>C++ whole body control on a bipedal humanoid.</div>',
};

const leverFixture: LeverPosting = {
  id: 'lev-9',
  text: 'Aerial Autonomy Engineer',
  description: '<p>PX4 and UAV autonomy.</p>',
  descriptionPlain: 'PX4 and UAV autonomy.',
  hostedUrl: 'https://jobs.lever.co/example/lev-9',
  applyUrl: 'https://jobs.lever.co/example/lev-9/apply',
  createdAt: 1722470400000,
  categories: {
    location: 'Remote, United States',
    department: 'Flight',
    commitment: 'Full-time',
    workplaceType: 'remote',
  },
};

describe('ATS mappers', () => {
  it('maps Ashby fields including compensation', () => {
    const job = mapAshbyJob(ashbyFixture);
    expect(job.externalId).toBe('ash-1');
    expect(job.sourceSystem).toBe('ashby');
    expect(job.city).toBe('Dublin');
    expect(job.country).toBe('Ireland');
    expect(job.compensationText).toBe('€80k–€110k');
    expect(job.employmentType).toBe('FULL_TIME');
  });

  it('maps Ashby location string when locationName is missing', () => {
    const job = mapAshbyJob({
      ...ashbyFixture,
      locationName: null,
      location: 'San Mateo, California, United States',
    });
    expect(job.city).toBe('San Mateo');
    expect(job.country).toBe('United States');
  });

  it('maps Greenhouse offices and HTML content', () => {
    const job = mapGreenhouseJob(greenhouseFixture, 'figureai');
    expect(job.sourceSystem).toBe('greenhouse');
    expect(job.city).toBe('San Jose');
    expect(job.region).toBe('California');
    expect(job.country).toBe('United States');
    expect(job.descriptionPlain).toContain('humanoid');
    expect(job.department).toBe('Controls');
    expect(job.url).toBe('https://boards.greenhouse.io/figureai/jobs/123');
  });

  it('decodes escaped Greenhouse HTML into a readable listing', () => {
    const job = mapGreenhouseJob(
      {
        ...greenhouseFixture,
        content: '&lt;h2&gt;Requirements&lt;/h2&gt;&lt;p&gt;C++ whole body control on a bipedal humanoid.&lt;/p&gt;',
      },
      'figureai',
    );
    expect(job.descriptionHtml).toContain('<h2>Requirements</h2>');
    expect(job.descriptionPlain).toContain('whole body control');
  });

  it('stores a single-job Greenhouse listing URL instead of a career board', () => {
    const job = mapGreenhouseJob(
      { ...greenhouseFixture, absolute_url: 'https://www.zipline.com/open-roles?gh_jid=123' },
      'flyzipline',
    );
    expect(job.url).toBe('https://www.zipline.com/open-roles/123');
  });

  it('maps Greenhouse intern titles without treating international roles as internships', () => {
    expect(mapGreenhouseJob({ ...greenhouseFixture, title: 'Robotics Software Intern' }).employmentType).toBe('INTERN');
    expect(
      mapGreenhouseJob({ ...greenhouseFixture, title: 'Senior Manager, Facilities Operations, International' })
        .employmentType,
    ).toBe('FULL_TIME');
  });

  it('maps Lever pagination fields and remote workplace', () => {
    const job = mapLeverJob(leverFixture);
    expect(job.sourceSystem).toBe('lever');
    expect(job.isRemote).toBe(true);
    expect(job.workplaceType).toBe('REMOTE');
    expect(job.url).toBe('https://jobs.lever.co/example/lev-9');
  });

  it('maps aggregator jobs with source filter fields', () => {
    const job = mapAggregatorJob({
      id: 'agg-1',
      source: 'greenhouse',
      title: 'PLC Engineer',
      description_plain: 'FANUC and PLC work on an assembly line.',
      url: 'https://example.com/jobs/1',
      location: 'Austin, TX',
      remote: false,
      employment_type: 'contract',
      published_at: '2026-08-10T00:00:00.000Z',
    });
    expect(job.sourceSystem).toBe('greenhouse');
    expect(job.employmentType).toBe('CONTRACT');
    expect(job.city).toBe('Austin');
  });

  it('maps Workday detail fields', () => {
    const job = mapWorkdayJob(
      { host: 'bostondynamics.wd1.myworkdayjobs.com', tenant: 'bostondynamics', site: 'Boston_Dynamics' },
      { title: 'Staff Robotics Engineer', externalPath: '/job/Waltham-MA/Staff_R1', locationsText: 'Waltham, MA' },
      {
        jobPostingInfo: {
          title: 'Staff Robotics Engineer',
          jobDescription: '<p>Spot autonomy in C++.</p>',
          location: 'Waltham, MA',
          jobReqId: 'R1',
          timeType: 'Full time',
          externalUrl: 'https://bostondynamics.wd1.myworkdayjobs.com/en-US/Boston_Dynamics/job/Waltham-MA/Staff_R1',
          jobRequisitionLocation: {
            country: { descriptor: 'United States of America', alpha2Code: 'US' },
          },
        },
      },
    );
    expect(job.sourceSystem).toBe('workday');
    expect(job.externalId).toBe('R1');
    expect(job.country).toBe('United States');
    expect(job.descriptionPlain).toContain('Spot');
  });

  it('maps Workable widget and detail fields', () => {
    const job = mapWorkableJob(
      {
        title: 'Architect Robotics',
        shortcode: 'A82425146D',
        employment_type: 'Full-time',
        department: 'R&D',
        url: 'https://apply.workable.com/j/A82425146D',
        application_url: 'https://apply.workable.com/j/A82425146D/apply',
        country: 'France',
        city: 'Wasquehal',
        state: 'Hauts-de-France',
      },
      {
        title: 'Architect Robotics',
        description: '<p>Skypod warehouse AMRs.</p>',
        department: ['R&D'],
        location: { country: 'France', city: 'Wasquehal', region: 'Hauts-de-France' },
      },
    );
    expect(job.sourceSystem).toBe('workable');
    expect(job.country).toBe('France');
    expect(job.city).toBe('Wasquehal');
    expect(job.descriptionPlain).toContain('Skypod');
  });
});

import { describe, expect, it } from 'vitest';
import { summarizeJob } from './format';

describe('summarizeJob', () => {
  it('keeps card fields compact for agents', () => {
    const summary = summarizeJob({
      id: 'abc',
      slug: 'perception-engineer',
      title: 'Perception Engineer',
      descriptionPlain: 'Build robot perception systems. '.repeat(80),
      url: 'https://example.com/apply',
      locationRaw: 'San Francisco, CA',
      country: 'United States',
      isRemote: false,
      workplaceType: 'HYBRID',
      employmentType: 'FULL_TIME',
      postedAt: '2026-09-11T00:00:00.000Z',
      company: { name: 'Example Robotics', slug: 'example' },
      robotDomains: [{ domain: { slug: 'perception', name: 'Perception' } }],
      techTags: [{ techTag: { slug: 'ros', label: 'ROS' } }],
      seniorities: [{ seniority: { slug: 'mid', label: 'Mid level' } }],
    });

    expect(summary).toMatchObject({
      id: 'abc',
      title: 'Perception Engineer',
      company: 'Example Robotics',
      domains: ['perception'],
      tags: ['ros'],
      seniorities: ['mid'],
      applyUrl: 'https://example.com/apply',
    });
    expect(summary).not.toHaveProperty('description');
  });
});

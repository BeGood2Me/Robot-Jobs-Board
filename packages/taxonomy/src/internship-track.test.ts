import { describe, expect, it } from 'vitest';
import { classifyInternshipTrack } from './internship-track';

describe('classifyInternshipTrack', () => {
  it('returns null for non-internships', () => {
    expect(
      classifyInternshipTrack({
        title: 'Senior Robotics Engineer',
        descriptionPlain: 'PhD preferred.',
        employmentType: 'FULL_TIME',
      }),
    ).toBeNull();
  });

  it('detects PhD internships', () => {
    expect(
      classifyInternshipTrack({
        title: 'Research Intern, PhD',
        employmentType: 'INTERN',
      }),
    ).toBe('phd');
    expect(
      classifyInternshipTrack({
        title: 'Robotics Intern',
        descriptionPlain: 'Open to current doctoral students.',
        employmentType: 'INTERN',
      }),
    ).toBe('phd');
  });

  it('detects postgraduate / masters internships', () => {
    expect(
      classifyInternshipTrack({
        title: "Master's Software Intern",
        employmentType: 'FULL_TIME',
      }),
    ).toBe('pg');
    expect(
      classifyInternshipTrack({
        title: 'Robotics Intern',
        descriptionPlain: 'Designed for MSc or graduate students.',
        employmentType: 'INTERN',
      }),
    ).toBe('pg');
  });

  it('detects undergraduate internships', () => {
    expect(
      classifyInternshipTrack({
        title: 'Undergraduate Robotics Intern',
        employmentType: 'INTERN',
      }),
    ).toBe('ug');
    expect(
      classifyInternshipTrack({
        title: 'Summer Intern',
        descriptionPlain: 'Open to bachelor’s students in engineering.',
        employmentType: 'INTERN',
      }),
    ).toBe('ug');
  });

  it('prefers PhD over PG when both appear', () => {
    expect(
      classifyInternshipTrack({
        title: 'Intern',
        descriptionPlain: 'MS or PhD students welcome.',
        employmentType: 'INTERN',
      }),
    ).toBe('phd');
  });

  it('leaves ambiguous graduate internships unclassified', () => {
    expect(
      classifyInternshipTrack({
        title: 'Graduate Software Intern',
        employmentType: 'INTERN',
      }),
    ).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';
import { boardRelevanceScore, capJobsPerCompany, isRobotRole } from './is-robot-role';

describe('isRobotRole', () => {
  it('keeps robotics and technical roles', () => {
    expect(isRobotRole({ title: 'Staff Controls Engineer' })).toBe(true);
    expect(isRobotRole({ title: 'Onsite Support Engineer, Robotics' })).toBe(true);
    expect(isRobotRole({ title: 'Machine Learning Engineer, ADAS' })).toBe(true);
    expect(isRobotRole({ title: 'Vehicle Safety Operator' })).toBe(true);
    expect(isRobotRole({ title: 'Technical Program Manager, Evaluation' })).toBe(true);
    expect(isRobotRole({ title: 'Mechanical Engineer, Humanoid Hands' })).toBe(true);
    expect(isRobotRole({ title: '2027 Early Career Software Engineer' })).toBe(true);
    expect(isRobotRole({ title: 'Winter 2027 Software Engineer Co-op' })).toBe(true);
  });

  it('drops finance, recruiting, and other corporate roles', () => {
    expect(isRobotRole({ title: 'Senior Manager, FP&A', department: 'Finance' })).toBe(false);
    expect(isRobotRole({ title: 'Senior Financial Analyst' })).toBe(false);
    expect(isRobotRole({ title: 'Technical Recruiter, Production' })).toBe(false);
    expect(isRobotRole({ title: 'Legal Counsel - US Government' })).toBe(false);
    expect(isRobotRole({ title: 'Office Manager' })).toBe(false);
    expect(isRobotRole({ title: 'Facilities Technician' })).toBe(false);
    expect(isRobotRole({ title: 'Automation Sales Manager' })).toBe(false);
    expect(isRobotRole({ title: 'Director, Business Development, Air Defense' })).toBe(false);
    expect(isRobotRole({ title: 'Register your interest for Wayve in Germany' })).toBe(false);
  });

  it('drops enterprise IT and supply-chain roles that are not robotics work', () => {
    expect(isRobotRole({ title: 'Senior Salesforce Developer' })).toBe(false);
    expect(isRobotRole({ title: 'Technical Program Manager, ERP Systems' })).toBe(false);
    expect(isRobotRole({ title: 'Staff Product Manager, Salesforce (Government Cloud CRM)' })).toBe(false);
    expect(isRobotRole({ title: 'Senior Product Manager, Growth Platform' })).toBe(false);
    expect(isRobotRole({ title: 'Technical Program Manager, IT' })).toBe(false);
    expect(isRobotRole({ title: 'Product Sourcing Engineer' })).toBe(false);
    expect(isRobotRole({ title: 'Buyer, Hardware Platforms Core Tech' })).toBe(false);
    expect(isRobotRole({ title: 'Learning and Development Program Manager, Quality' })).toBe(false);
  });
});

describe('capJobsPerCompany', () => {
  it('keeps early-career and robotics titles when capping', () => {
    const jobs = [
      { title: 'Office Noise Engineer', postedAt: '2026-01-01T00:00:00.000Z' },
      { title: '2027 Early Career Software Engineer', postedAt: '2026-01-02T00:00:00.000Z' },
      { title: 'Autonomy Software Engineer', postedAt: '2026-01-03T00:00:00.000Z' },
      { title: 'Structural Engineer, Monument', postedAt: '2026-01-04T00:00:00.000Z' },
    ];
    const capped = capJobsPerCompany(jobs, 2);
    expect(capped.map((job) => job.title)).toEqual([
      '2027 Early Career Software Engineer',
      'Autonomy Software Engineer',
    ]);
  });

  it('scores early career above generic engineering', () => {
    expect(boardRelevanceScore({ title: '2027 Software Engineer Intern' })).toBeGreaterThan(
      boardRelevanceScore({ title: 'Mechanical Engineer' }),
    );
    expect(boardRelevanceScore({ title: 'Robotics Software Engineer' })).toBeGreaterThan(
      boardRelevanceScore({ title: 'Mechanical Engineer' }),
    );
  });
});

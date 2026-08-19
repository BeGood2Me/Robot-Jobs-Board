import { describe, expect, it } from 'vitest';
import { isRobotRole } from './is-robot-role';

describe('isRobotRole', () => {
  it('keeps robotics and technical roles', () => {
    expect(isRobotRole({ title: 'Staff Controls Engineer' })).toBe(true);
    expect(isRobotRole({ title: 'Onsite Support Engineer, Robotics' })).toBe(true);
    expect(isRobotRole({ title: 'Machine Learning Engineer, ADAS' })).toBe(true);
    expect(isRobotRole({ title: 'Vehicle Safety Operator' })).toBe(true);
    expect(isRobotRole({ title: 'Technical Program Manager, Evaluation' })).toBe(true);
    expect(isRobotRole({ title: 'Mechanical Engineer, Humanoid Hands' })).toBe(true);
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
});

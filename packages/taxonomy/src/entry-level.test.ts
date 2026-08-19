import { describe, expect, it } from 'vitest';
import { isEntryLevelRole, isInternshipTitle } from './entry-level';

describe('isEntryLevelRole', () => {
  it('includes internships and new grad titles', () => {
    expect(isEntryLevelRole({ title: 'Robotics Software Intern' })).toBe(true);
    expect(isEntryLevelRole({ title: 'Intern, Perception' })).toBe(true);
    expect(isEntryLevelRole({ title: 'International Intern, Software' })).toBe(true);
    expect(isEntryLevelRole({ title: 'New Grad Robotics Engineer' })).toBe(true);
    expect(isEntryLevelRole({ title: 'Junior Robotics Engineer' })).toBe(true);
    expect(isEntryLevelRole({ title: 'Entry Level Test Engineer' })).toBe(true);
    expect(isEntryLevelRole({ title: 'Early Career Software Engineer' })).toBe(true);
    expect(isEntryLevelRole({ title: 'Graduate Engineer' })).toBe(true);
    expect(isEntryLevelRole({ title: 'Robotics Co-op' })).toBe(true);
    expect(isEntryLevelRole({ title: 'Firmware Apprentice' })).toBe(true);
    expect(isEntryLevelRole({ title: 'Associate Robotics Engineer' })).toBe(true);
    expect(isEntryLevelRole({ title: 'Senior Intern, Controls' })).toBe(true);
    expect(isEntryLevelRole({ title: 'Campus intern', employmentType: 'INTERN' })).toBe(true);
    expect(isEntryLevelRole({ title: 'Senior Software Engineer', employmentType: 'INTERN' })).toBe(false);
    expect(isEntryLevelRole({ title: 'Director of Engineering', employmentType: 'INTERN' })).toBe(false);
  });

  it('excludes experienced roles even when a weak word overlaps', () => {
    expect(isEntryLevelRole({ title: 'Senior Software Engineer' })).toBe(false);
    expect(isEntryLevelRole({ title: 'Staff Robotics Engineer' })).toBe(false);
    expect(isEntryLevelRole({ title: 'Principal Perception Engineer' })).toBe(false);
    expect(isEntryLevelRole({ title: 'Director of Engineering' })).toBe(false);
    expect(isEntryLevelRole({ title: 'Director of University Partnerships' })).toBe(false);
    expect(isEntryLevelRole({ title: 'Engineering Manager' })).toBe(false);
    expect(isEntryLevelRole({ title: 'Head of Robotics' })).toBe(false);
    expect(isEntryLevelRole({ title: 'International Program Manager' })).toBe(false);
    expect(isEntryLevelRole({ title: 'International Software Engineer' })).toBe(false);
    expect(isEntryLevelRole({ title: 'Internal Tools Engineer' })).toBe(false);
    expect(isEntryLevelRole({ title: 'Lead Robotics Engineer' })).toBe(false);
    expect(isEntryLevelRole({ title: 'Associate Director' })).toBe(false);
    expect(isEntryLevelRole({ title: 'Software Engineer' })).toBe(false);
  });

  it('does not treat international or internal as intern', () => {
    expect(isInternshipTitle('International Software Engineer')).toBe(false);
    expect(isInternshipTitle('Internal Tools Engineer')).toBe(false);
    expect(isInternshipTitle('Robotics Intern')).toBe(true);
  });
});

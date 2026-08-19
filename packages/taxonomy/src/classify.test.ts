import { describe, expect, it } from 'vitest';
import { RuleBasedClassifier } from './classify';

const classifier = new RuleBasedClassifier();

describe('RuleBasedClassifier', () => {
  it('tags AMR warehouse roles', () => {
    const result = classifier.classify({
      title: 'AMR Deployment Engineer',
      descriptionPlain:
        'Support autonomous mobile robots in warehouse robotics and intralogistics material handling.',
    });
    expect(result.domains).toContain('amr');
    expect(result.seniority).toBe('mid');
  });

  it('tags humanoid titles and companies', () => {
    const result = classifier.classify({
      title: 'Senior Perception Engineer',
      descriptionPlain: 'Work on a bipedal humanoid with whole body control.',
      companyName: 'Figure',
    });
    expect(result.domains).toContain('humanoid');
    expect(result.seniority).toBe('senior');
  });

  it('extracts ROS 2 and C++ tech tags', () => {
    const result = classifier.classify({
      title: 'Robotics Software Engineer',
      descriptionPlain: 'We use ROS 2, C++, Python, and Gazebo. Linux required.',
    });
    expect(result.techTags).toEqual(expect.arrayContaining(['ros2', 'cpp', 'python', 'gazebo', 'linux']));
  });

  it('maps intern titles to junior', () => {
    const result = classifier.classify({
      title: 'Robotics Software Intern',
      descriptionPlain: 'Graduate internship with Isaac Sim.',
    });
    expect(result.seniority).toBe('junior');
    expect(result.techTags).toContain('isaac-sim');
  });

  it('does not treat international or director titles as junior', () => {
    expect(
      classifier.classify({
        title: 'International Software Engineer',
        descriptionPlain: 'C++ and Linux on the robot.',
      }).seniority,
    ).toBe('mid');
    expect(
      classifier.classify({
        title: 'Director of University Partnerships',
        descriptionPlain: 'Hire robotics talent.',
      }).seniority,
    ).toBe('lead');
    expect(
      classifier.classify({
        title: 'Senior Software Engineer',
        descriptionPlain: 'C++ and Linux on the robot.',
      }).seniority,
    ).toBe('senior');
  });

  it('maps new grad titles to junior', () => {
    const result = classifier.classify({
      title: 'New Grad Robotics Engineer',
      descriptionPlain: 'C++ and Linux on the robot.',
    });
    expect(result.seniority).toBe('junior');
  });

  it('maps staff to principal bucket', () => {
    const result = classifier.classify({
      title: 'Staff Controls Engineer',
      descriptionPlain: 'Controls and firmware on embedded Linux.',
    });
    expect(result.seniority).toBe('principal');
    expect(result.techTags).toEqual(expect.arrayContaining(['controls', 'embedded', 'linux']));
  });

  it('tags drones via UAV and PX4', () => {
    const result = classifier.classify({
      title: 'Aerial Autonomy Engineer',
      descriptionPlain: 'UAV flight controller work on PX4 and C++.',
    });
    expect(result.domains).toContain('drone');
    expect(result.techTags).toContain('px4');
  });

  it('tags Locus as AMR from the company name when the posting is unclear', () => {
    const result = classifier.classify({
      title: 'Deployment Engineer',
      descriptionPlain: 'Travel to fulfillment sites and stand up fleets.',
      companyName: 'Locus Robotics',
    });
    expect(result.domains).toContain('amr');
  });

  it('does not tag every Anduril role as drone or field', () => {
    const result = classifier.classify({
      title: 'Manufacturing Engineer',
      descriptionPlain: 'Stand up production lines for electromechanical assemblies in C++ and Linux.',
      companyName: 'Anduril',
    });
    expect(result.domains).not.toContain('drone');
    expect(result.domains).not.toContain('field');
  });

  it('still tags Anduril aerial roles from the posting', () => {
    const result = classifier.classify({
      title: 'Autonomy Engineer',
      descriptionPlain: 'Guidance and navigation for UAV and VTOL aircraft.',
      companyName: 'Anduril',
    });
    expect(result.domains).toContain('drone');
  });

  it('does not treat a company name that merely contains a hint as that domain', () => {
    const result = classifier.classify({
      title: 'Firmware Engineer',
      descriptionPlain: 'C++ and Linux on the robot.',
      companyName: 'Transfigure Labs',
    });
    expect(result.domains).not.toContain('humanoid');
  });

  it('marks jobs without domain keywords as unclear', () => {
    const result = classifier.classify({
      title: 'Office Manager',
      descriptionPlain: 'Facilities and calendar support for the HQ team.',
    });
    expect(result.unclear).toBe(true);
    expect(result.domains).toHaveLength(0);
  });
});

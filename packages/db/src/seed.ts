import { config as loadDotenv } from 'dotenv';
import { resolve } from 'node:path';
import { prisma } from './index.js';
import { upsertSeedCompanies } from './seed-companies.js';
import { EmploymentType, WorkplaceType } from '@prisma/client';

loadDotenv({ path: resolve(process.cwd(), '../../.env') });
loadDotenv({ path: resolve(process.cwd(), '.env') });

const domains = [
  {
    slug: 'amr',
    name: 'AMR',
    description:
      'Autonomous mobile robots used in warehouses, factories, and logistics hubs for material handling and goods transport.',
  },
  {
    slug: 'humanoid',
    name: 'Humanoid',
    description:
      'Bipedal general purpose robots designed to work in spaces built for people, from warehouses to homes.',
  },
  {
    slug: 'industrial',
    name: 'Industrial',
    description:
      'Fixed and collaborative manipulators used for welding, assembly, pick and place, and factory automation.',
  },
  {
    slug: 'drone',
    name: 'Drone',
    description:
      'Uncrewed aerial vehicles for inspection, delivery, mapping, and defense, including PX4 and flight control stacks.',
  },
  {
    slug: 'field',
    name: 'Field',
    description:
      'Outdoor and inspection robots including quadrupeds, agricultural platforms, and industrial inspection systems.',
  },
  {
    slug: 'medical',
    name: 'Medical',
    description:
      'Surgical, rehabilitation, and hospital robotics spanning laparoscopic systems and assistive devices.',
  },
];

const techTags = [
  { slug: 'ros2', label: 'ROS 2' },
  { slug: 'ros1', label: 'ROS' },
  { slug: 'cpp', label: 'C++' },
  { slug: 'python', label: 'Python' },
  { slug: 'plc', label: 'PLC' },
  { slug: 'px4', label: 'PX4' },
  { slug: 'isaac-sim', label: 'Isaac Sim' },
  { slug: 'gazebo', label: 'Gazebo' },
  { slug: 'moveit', label: 'MoveIt' },
  { slug: 'linux', label: 'Linux' },
  { slug: 'cuda', label: 'CUDA' },
  { slug: 'pytorch', label: 'PyTorch' },
  { slug: 'slam', label: 'SLAM' },
  { slug: 'controls', label: 'Controls' },
  { slug: 'embedded', label: 'Embedded' },
];

const seniorities = [
  { slug: 'junior', label: 'Entry level' },
  { slug: 'mid', label: 'Mid level' },
  { slug: 'senior', label: 'Senior' },
  { slug: 'lead', label: 'Lead' },
  { slug: 'principal', label: 'Staff' },
];

type SampleJob = {
  companySlug: string;
  externalId: string;
  title: string;
  slug: string;
  city: string;
  region: string | null;
  country: string;
  isRemote: boolean;
  workplaceType: WorkplaceType;
  employmentType: EmploymentType;
  department: string;
  domains: string[];
  tags: string[];
  seniority: string;
  postedDaysAgo: number;
  html: string;
  plain: string;
  locationRaw: string;
  url: string;
};

const sampleJobs: SampleJob[] = [
  {
    companySlug: 'figure',
    externalId: 'seed-figure-perception',
    title: 'Senior Perception Engineer, Humanoid',
    slug: 'senior-perception-engineer-humanoid',
    city: 'San Jose',
    region: 'California',
    country: 'United States',
    isRemote: false,
    workplaceType: WorkplaceType.ONSITE,
    employmentType: EmploymentType.FULL_TIME,
    department: 'Helix AI',
    domains: ['humanoid'],
    tags: ['cpp', 'python', 'pytorch', 'slam'],
    seniority: 'senior',
    postedDaysAgo: 4,
    locationRaw: 'San Jose, CA',
    url: 'https://job-boards.greenhouse.io/figureai',
    html: '<p>Build onboard perception for a general purpose humanoid, including 3D vision, localization, and visuomotor policies. Strong C++ and Python required.</p>',
    plain:
      'Build onboard perception for a general purpose humanoid, including 3D vision, localization, and visuomotor policies. Strong C++ and Python required. Humanoid robot, SLAM, PyTorch.',
  },
  {
    companySlug: 'figure',
    externalId: 'seed-figure-controls',
    title: 'Staff Controls Engineer',
    slug: 'staff-controls-engineer',
    city: 'San Jose',
    region: 'California',
    country: 'United States',
    isRemote: false,
    workplaceType: WorkplaceType.ONSITE,
    employmentType: EmploymentType.FULL_TIME,
    department: 'Controls',
    domains: ['humanoid'],
    tags: ['cpp', 'controls', 'linux', 'embedded'],
    seniority: 'principal',
    postedDaysAgo: 9,
    locationRaw: 'San Jose, CA',
    url: 'https://job-boards.greenhouse.io/figureai',
    html: '<p>Own whole body control software in C++ on Linux. Experience with bipedal robots, actuators, and real time controls is essential.</p>',
    plain:
      'Own whole body control software in C++ on Linux. Experience with bipedal robots, actuators, and real time controls is essential. Humanoid, embedded, controls.',
  },
  {
    companySlug: 'figure',
    externalId: 'seed-figure-deployment',
    title: 'Deployment Engineer, Commercial Site',
    slug: 'deployment-engineer-commercial-site',
    city: 'Austin',
    region: 'Texas',
    country: 'United States',
    isRemote: false,
    workplaceType: WorkplaceType.ONSITE,
    employmentType: EmploymentType.FULL_TIME,
    department: 'Field Operations',
    domains: ['humanoid', 'amr'],
    tags: ['linux', 'python'],
    seniority: 'mid',
    postedDaysAgo: 2,
    locationRaw: 'Austin, TX',
    url: 'https://job-boards.greenhouse.io/figureai',
    html: '<p>Stand up humanoid robots at warehouse customer sites. Linux, Python, and comfort with warehouse robotics deployments required.</p>',
    plain:
      'Stand up humanoid robots at warehouse customer sites. Linux, Python, and comfort with warehouse robotics deployments required. AMR, humanoid, field.',
  },
  {
    companySlug: 'apptronik',
    externalId: 'seed-apptronik-me',
    title: 'Senior Mechanical Engineer, Apollo',
    slug: 'senior-mechanical-engineer-apollo',
    city: 'Austin',
    region: 'Texas',
    country: 'United States',
    isRemote: false,
    workplaceType: WorkplaceType.ONSITE,
    employmentType: EmploymentType.FULL_TIME,
    department: 'Hardware',
    domains: ['humanoid'],
    tags: ['controls'],
    seniority: 'senior',
    postedDaysAgo: 6,
    locationRaw: 'Austin, TX',
    url: 'https://boards.greenhouse.io/apptronik',
    html: '<p>Design mechanical subsystems for the Apollo humanoid from concept through production. DFMA, FEA, and electromechanical integration.</p>',
    plain:
      'Design mechanical subsystems for the Apollo humanoid from concept through production. DFMA, FEA, and electromechanical integration. Humanoid robot.',
  },
  {
    companySlug: 'apptronik',
    externalId: 'seed-apptronik-sw',
    title: 'Robotics Software Engineer, ROS 2',
    slug: 'robotics-software-engineer-ros-2',
    city: 'Austin',
    region: 'Texas',
    country: 'United States',
    isRemote: false,
    workplaceType: WorkplaceType.HYBRID,
    employmentType: EmploymentType.FULL_TIME,
    department: 'Software',
    domains: ['humanoid'],
    tags: ['ros2', 'cpp', 'python', 'gazebo'],
    seniority: 'mid',
    postedDaysAgo: 11,
    locationRaw: 'Austin, TX (Hybrid)',
    url: 'https://boards.greenhouse.io/apptronik',
    html: '<p>Ship ROS 2 nodes for locomotion and manipulation. C++, Python, Gazebo simulation, and Linux bring up on Apollo.</p>',
    plain:
      'Ship ROS 2 nodes for locomotion and manipulation. C++, Python, Gazebo simulation, and Linux bring up on Apollo. Humanoid, ROS2.',
  },
  {
    companySlug: 'apptronik',
    externalId: 'seed-apptronik-intern',
    title: 'Robotics Software Intern',
    slug: 'robotics-software-intern',
    city: 'Austin',
    region: 'Texas',
    country: 'United States',
    isRemote: false,
    workplaceType: WorkplaceType.ONSITE,
    employmentType: EmploymentType.INTERN,
    department: 'Software',
    domains: ['humanoid'],
    tags: ['python', 'ros2', 'isaac-sim'],
    seniority: 'junior',
    postedDaysAgo: 15,
    locationRaw: 'Austin, TX',
    url: 'https://boards.greenhouse.io/apptronik',
    html: '<p>Graduate and intern role supporting simulation in Isaac Sim and ROS 2. Python first, with mentorship on C++.</p>',
    plain:
      'Graduate and intern role supporting simulation in Isaac Sim and ROS 2. Python first, with mentorship on C++. Junior humanoid.',
  },
  {
    companySlug: 'anduril',
    externalId: 'seed-anduril-aerial',
    title: 'Senior Software Engineer, Aerial Autonomy',
    slug: 'senior-software-engineer-aerial-autonomy',
    city: 'Costa Mesa',
    region: 'California',
    country: 'United States',
    isRemote: false,
    workplaceType: WorkplaceType.ONSITE,
    employmentType: EmploymentType.FULL_TIME,
    department: 'Tactical Recon and Strike',
    domains: ['drone'],
    tags: ['cpp', 'python', 'px4', 'linux'],
    seniority: 'senior',
    postedDaysAgo: 3,
    locationRaw: 'Costa Mesa, CA',
    url: 'https://boards.greenhouse.io/andurilindustries',
    html: '<p>Work on UAV autonomy, PX4 integration, and flight control software in C++. Experience with drones and real hardware required.</p>',
    plain:
      'Work on UAV autonomy, PX4 integration, and flight control software in C++. Experience with drones and real hardware required. Aerial robotics.',
  },
  {
    companySlug: 'anduril',
    externalId: 'seed-anduril-perception',
    title: 'Perception Engineer, Group 2 UAS',
    slug: 'perception-engineer-group-2-uas',
    city: 'Seattle',
    region: 'Washington',
    country: 'United States',
    isRemote: false,
    workplaceType: WorkplaceType.ONSITE,
    employmentType: EmploymentType.FULL_TIME,
    department: 'Perception',
    domains: ['drone'],
    tags: ['cpp', 'python', 'cuda', 'slam'],
    seniority: 'mid',
    postedDaysAgo: 8,
    locationRaw: 'Seattle, WA',
    url: 'https://boards.greenhouse.io/andurilindustries',
    html: '<p>Build onboard computer vision for uncrewed aerial vehicles. CUDA, SLAM, and C++ on embedded Linux.</p>',
    plain:
      'Build onboard computer vision for uncrewed aerial vehicles. CUDA, SLAM, and C++ on embedded Linux. UAV, drone, perception.',
  },
  {
    companySlug: 'anduril',
    externalId: 'seed-anduril-remote',
    title: 'Lead Robotics Software Engineer, Lattice',
    slug: 'lead-robotics-software-engineer-lattice',
    city: 'Remote',
    region: null,
    country: 'United States',
    isRemote: true,
    workplaceType: WorkplaceType.REMOTE,
    employmentType: EmploymentType.FULL_TIME,
    department: 'Software',
    domains: ['drone', 'field'],
    tags: ['cpp', 'python', 'linux'],
    seniority: 'lead',
    postedDaysAgo: 1,
    locationRaw: 'Remote, United States',
    url: 'https://boards.greenhouse.io/andurilindustries',
    html: '<p>Lead engineers building command and control software for autonomous drones and field robots. Remote United States. C++ and Python.</p>',
    plain:
      'Lead engineers building command and control software for autonomous drones and field robots. Remote United States. C++ and Python. UAV, inspection robot.',
  },
  {
    companySlug: 'figure',
    externalId: 'seed-figure-amr-sim',
    title: 'Simulation Engineer, Warehouse Deployment',
    slug: 'simulation-engineer-warehouse-deployment',
    city: 'Dublin',
    region: 'Leinster',
    country: 'Ireland',
    isRemote: true,
    workplaceType: WorkplaceType.HYBRID,
    employmentType: EmploymentType.FULL_TIME,
    department: 'Simulation',
    domains: ['amr', 'humanoid'],
    tags: ['python', 'isaac-sim', 'gazebo', 'ros2'],
    seniority: 'mid',
    postedDaysAgo: 5,
    locationRaw: 'Dublin, Ireland (Hybrid)',
    url: 'https://job-boards.greenhouse.io/figureai',
    html: '<p>Model warehouse AMR and humanoid workflows in Isaac Sim and Gazebo. ROS 2, Python, and logistics experience a plus.</p>',
    plain:
      'Model warehouse AMR and humanoid workflows in Isaac Sim and Gazebo. ROS 2, Python, and logistics experience a plus. Intralogistics, autonomous mobile robot.',
  },
  {
    companySlug: 'apptronik',
    externalId: 'seed-apptronik-industrial',
    title: 'Applications Engineer, Factory Automation',
    slug: 'applications-engineer-factory-automation',
    city: 'Austin',
    region: 'Texas',
    country: 'United States',
    isRemote: false,
    workplaceType: WorkplaceType.ONSITE,
    employmentType: EmploymentType.FULL_TIME,
    department: 'Applications',
    domains: ['industrial', 'humanoid'],
    tags: ['plc', 'python', 'ros2'],
    seniority: 'mid',
    postedDaysAgo: 12,
    locationRaw: 'Austin, TX',
    url: 'https://boards.greenhouse.io/apptronik',
    html: '<p>Integrate Apollo with factory lines alongside cobots, PLCs, and ABB or FANUC cells. Assembly line and industrial robot experience.</p>',
    plain:
      'Integrate Apollo with factory lines alongside cobots, PLCs, and ABB or FANUC cells. Assembly line and industrial robot experience. Welding, cobot.',
  },
  {
    companySlug: 'anduril',
    externalId: 'seed-anduril-field',
    title: 'Field Robotics Engineer, Inspection',
    slug: 'field-robotics-engineer-inspection',
    city: 'Boston',
    region: 'Massachusetts',
    country: 'United States',
    isRemote: false,
    workplaceType: WorkplaceType.ONSITE,
    employmentType: EmploymentType.FULL_TIME,
    department: 'Field',
    domains: ['field'],
    tags: ['python', 'ros2', 'linux'],
    seniority: 'senior',
    postedDaysAgo: 7,
    locationRaw: 'Boston, MA',
    url: 'https://boards.greenhouse.io/andurilindustries',
    html: '<p>Deploy inspection robots and quadruped platforms for industrial sites. ROS 2, Python, and travel to customer facilities.</p>',
    plain:
      'Deploy inspection robots and quadruped platforms for industrial sites. ROS 2, Python, and travel to customer facilities. Spot, Unitree, Anybotics.',
  },
  {
    companySlug: 'figure',
    externalId: 'seed-figure-medical',
    title: 'Junior Robotics Test Engineer',
    slug: 'junior-robotics-test-engineer',
    city: 'San Jose',
    region: 'California',
    country: 'United States',
    isRemote: false,
    workplaceType: WorkplaceType.ONSITE,
    employmentType: EmploymentType.FULL_TIME,
    department: 'Quality',
    domains: ['humanoid'],
    tags: ['python', 'linux'],
    seniority: 'junior',
    postedDaysAgo: 18,
    locationRaw: 'San Jose, CA',
    url: 'https://job-boards.greenhouse.io/figureai',
    html: '<p>Entry level QA and test role for humanoid hardware bring up. Python test fixtures, Linux, and a desire to learn C++.</p>',
    plain:
      'Entry level QA and test role for humanoid hardware bring up. Python test fixtures, Linux, and a desire to learn C++. Graduate, junior.',
  },
  {
    companySlug: 'anduril',
    externalId: 'seed-anduril-cpp',
    title: 'Principal Software Engineer, Flight Stack',
    slug: 'principal-software-engineer-flight-stack',
    city: 'Austin',
    region: 'Texas',
    country: 'United States',
    isRemote: false,
    workplaceType: WorkplaceType.ONSITE,
    employmentType: EmploymentType.FULL_TIME,
    department: 'Autonomy',
    domains: ['drone'],
    tags: ['cpp', 'px4', 'linux', 'embedded'],
    seniority: 'principal',
    postedDaysAgo: 10,
    locationRaw: 'Austin, TX',
    url: 'https://boards.greenhouse.io/andurilindustries',
    html: '<p>Principal engineer for PX4 adjacent flight software. C++, embedded Linux, UAV dynamics, and mentoring staff engineers.</p>',
    plain:
      'Principal engineer for PX4 adjacent flight software. C++, embedded Linux, UAV dynamics, and mentoring staff engineers. Drone, flight controller.',
  },
  {
    companySlug: 'apptronik',
    externalId: 'seed-apptronik-moveit',
    title: 'Manipulation Engineer, MoveIt',
    slug: 'manipulation-engineer-moveit',
    city: 'Austin',
    region: 'Texas',
    country: 'United States',
    isRemote: false,
    workplaceType: WorkplaceType.ONSITE,
    employmentType: EmploymentType.FULL_TIME,
    department: 'Manipulation',
    domains: ['humanoid', 'industrial'],
    tags: ['ros2', 'moveit', 'cpp', 'gazebo'],
    seniority: 'senior',
    postedDaysAgo: 14,
    locationRaw: 'Austin, TX',
    url: 'https://boards.greenhouse.io/apptronik',
    html: '<p>Plan and control dexterous arms with MoveIt on ROS 2. C++, Gazebo, and industrial manipulator background welcome.</p>',
    plain:
      'Plan and control dexterous arms with MoveIt on ROS 2. C++, Gazebo, and industrial manipulator background welcome. Cobot, UR, KUKA.',
  },
];

async function main() {
  for (const domain of domains) {
    await prisma.robotDomain.upsert({
      where: { slug: domain.slug },
      create: domain,
      update: { name: domain.name, description: domain.description },
    });
  }

  for (const tag of techTags) {
    await prisma.techTag.upsert({
      where: { slug: tag.slug },
      create: tag,
      update: { label: tag.label },
    });
  }

  for (const level of seniorities) {
    await prisma.seniorityLevel.upsert({
      where: { slug: level.slug },
      create: level,
      update: { label: level.label },
    });
  }

  await upsertSeedCompanies(prisma);

  const domainRows = await prisma.robotDomain.findMany();
  const tagRows = await prisma.techTag.findMany();
  const seniorityRows = await prisma.seniorityLevel.findMany();
  const companyRows = await prisma.company.findMany();

  const domainBySlug = Object.fromEntries(domainRows.map((d) => [d.slug, d]));
  const tagBySlug = Object.fromEntries(tagRows.map((t) => [t.slug, t]));
  const seniorityBySlug = Object.fromEntries(seniorityRows.map((s) => [s.slug, s]));
  const companyBySlug = Object.fromEntries(companyRows.map((c) => [c.slug, c]));

  for (const job of sampleJobs) {
    const company = companyBySlug[job.companySlug];
    if (!company) continue;
    const postedAt = new Date();
    postedAt.setDate(postedAt.getDate() - job.postedDaysAgo);

    const upserted = await prisma.job.upsert({
      where: {
        sourceSystem_externalId: {
          sourceSystem: company.sourceSystem,
          externalId: job.externalId,
        },
      },
      create: {
        externalId: job.externalId,
        sourceSystem: company.sourceSystem,
        companyId: company.id,
        title: job.title,
        slug: job.slug,
        descriptionHtml: job.html,
        descriptionPlain: job.plain,
        url: job.url,
        locationRaw: job.locationRaw,
        country: job.country,
        region: job.region || null,
        city: job.city,
        isRemote: job.isRemote,
        workplaceType: job.workplaceType,
        employmentType: job.employmentType,
        department: job.department,
        postedAt,
        lastSeenAt: new Date(),
        isActive: true,
      },
      update: {
        title: job.title,
        slug: job.slug,
        descriptionHtml: job.html,
        descriptionPlain: job.plain,
        isActive: true,
        lastSeenAt: new Date(),
      },
    });

    await prisma.jobRobotDomain.deleteMany({ where: { jobId: upserted.id } });
    await prisma.jobTechTag.deleteMany({ where: { jobId: upserted.id } });
    await prisma.jobSeniority.deleteMany({ where: { jobId: upserted.id } });

    await prisma.jobRobotDomain.createMany({
      data: job.domains
        .map((slug) => domainBySlug[slug]?.id)
        .filter(Boolean)
        .map((domainId) => ({ jobId: upserted.id, domainId: domainId as string })),
    });
    await prisma.jobTechTag.createMany({
      data: job.tags
        .map((slug) => tagBySlug[slug]?.id)
        .filter(Boolean)
        .map((techTagId) => ({ jobId: upserted.id, techTagId: techTagId as string })),
    });
    const seniorityId = seniorityBySlug[job.seniority]?.id;
    if (seniorityId) {
      await prisma.jobSeniority.create({
        data: { jobId: upserted.id, seniorityId },
      });
    }
  }

  console.log('Seed complete: taxonomy, companies, feeds, and sample jobs.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

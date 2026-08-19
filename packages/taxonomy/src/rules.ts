export type RobotDomainSlug =
  | 'amr'
  | 'humanoid'
  | 'industrial'
  | 'drone'
  | 'field'
  | 'medical';

export type TechTagSlug =
  | 'ros2'
  | 'ros1'
  | 'cpp'
  | 'python'
  | 'plc'
  | 'px4'
  | 'isaac-sim'
  | 'gazebo'
  | 'moveit'
  | 'linux'
  | 'cuda'
  | 'pytorch'
  | 'slam'
  | 'controls'
  | 'embedded';

export type SenioritySlug = 'junior' | 'mid' | 'senior' | 'lead' | 'principal';

export type KeywordRule<T extends string> = {
  slug: T;
  keywords: string[];
};

export const ROBOT_DOMAIN_RULES: KeywordRule<RobotDomainSlug>[] = [
  {
    slug: 'amr',
    keywords: [
      'amr',
      'autonomous mobile robot',
      'autonomous mobile robots',
      'warehouse robotics',
      'warehouse robot',
      'intralogistics',
      'material handling',
      'goods to person',
      'agv',
      'automated guided vehicle',
      'mobile manipulator warehouse',
    ],
  },
  {
    slug: 'humanoid',
    keywords: [
      'humanoid',
      'bipedal',
      'legged robot',
      'dexterous general-purpose robot',
      'dexterous general purpose robot',
      'whole body control',
      'whole-body',
      'figure 03',
      'apollo humanoid',
      'digit robot',
      'atlas robot',
      'optimus',
      'apptronik',
      'agility robotics',
      '1x technologies',
      'figure ai',
    ],
  },
  {
    slug: 'industrial',
    keywords: [
      'industrial robot',
      'industrial manipulator',
      'welding robot',
      'assembly line',
      'cobot',
      'collaborative robot',
      'fanuc',
      'kuka',
      'universal robots',
      ' pick and place',
      'machine tending',
    ],
  },
  {
    slug: 'drone',
    keywords: [
      'uav',
      'uas',
      'drone',
      'aerial robotics',
      'aerial autonomy',
      'px4',
      'flight controller',
      'uncrewed aerial',
      'unmanned aerial',
      'quadcopter',
      'vtol',
    ],
  },
  {
    slug: 'field',
    keywords: [
      'inspection robot',
      'quadruped',
      'spot robot',
      'unitree',
      'anybotics',
      'agricultural robot',
      'agtech robot',
      'outdoor robot',
      'field robot',
      'mine robot',
    ],
  },
  {
    slug: 'medical',
    keywords: [
      'surgical robot',
      'laparoscopic',
      'rehabilitation robotics',
      'rehab robot',
      'intuitive surgical',
      'da vinci',
      'medtronic',
      'hospital robot',
      'surgical system',
    ],
  },
];

export const COMPANY_DOMAIN_HINTS: Record<string, RobotDomainSlug[]> = {
  figure: ['humanoid'],
  apptronik: ['humanoid'],
  agility: ['humanoid'],
  '1x': ['humanoid'],
  sanctuary: ['humanoid'],
  generalist: ['humanoid'],
  reflex: ['humanoid'],
  skydio: ['drone'],
  zipline: ['drone'],
  'shield ai': ['drone'],
  flyability: ['drone'],
  'gather ai': ['drone'],
  anybotics: ['field'],
  'blue river': ['field'],
  'carbon robotics': ['field'],
  locus: ['amr'],
  ocado: ['amr'],
  exotec: ['amr'],
  outrider: ['amr'],
  wayve: ['field'],
  nuro: ['amr'],
  sereact: ['industrial', 'amr'],
  'path robotics': ['industrial'],
  'standard bots': ['industrial'],
  formic: ['industrial'],
  intuitive: ['medical'],
};

export const TECH_TAG_RULES: KeywordRule<TechTagSlug>[] = [
  { slug: 'ros2', keywords: ['ros 2', 'ros2', 'humble', 'jazzy', 'iron ros'] },
  { slug: 'ros1', keywords: [' ros ', 'ros1', 'robot operating system'] },
  { slug: 'cpp', keywords: ['c++', 'cpp', 'cplusplus'] },
  { slug: 'python', keywords: ['python'] },
  { slug: 'plc', keywords: ['plc', 'ladder logic', 'siemens tia'] },
  { slug: 'px4', keywords: ['px4', 'pixhawk', 'ardupilot'] },
  { slug: 'isaac-sim', keywords: ['isaac sim', 'isaacsim', 'nvidia isaac'] },
  { slug: 'gazebo', keywords: ['gazebo', 'gz sim'] },
  { slug: 'moveit', keywords: ['moveit', 'move it'] },
  { slug: 'linux', keywords: ['linux', 'ubuntu', 'embedded linux'] },
  { slug: 'cuda', keywords: ['cuda', 'gpu inference'] },
  { slug: 'pytorch', keywords: ['pytorch', 'torch'] },
  { slug: 'slam', keywords: ['slam', 'localization and mapping', 'vio'] },
  { slug: 'controls', keywords: ['controls', 'control theory', 'mpc', 'pid control'] },
  { slug: 'embedded', keywords: ['embedded', 'firmware', 'rtos', 'bare metal'] },
];

export const SENIORITY_RULES: { slug: SenioritySlug; keywords: string[]; priority: number }[] = [
  { slug: 'principal', keywords: ['principal', 'staff', 'distinguished', 'fellow'], priority: 5 },
  { slug: 'lead', keywords: ['lead', 'head of', 'manager', 'director'], priority: 4 },
  { slug: 'senior', keywords: ['senior', 'sr.', 'sr '], priority: 3 },
  { slug: 'junior', keywords: ['junior', 'new grad', 'new graduate', 'entry level', 'entry-level', 'early career', 'early-career'], priority: 2 },
  { slug: 'mid', keywords: ['mid-level', 'mid level', 'engineer ii', 'engineer 2'], priority: 1 },
];

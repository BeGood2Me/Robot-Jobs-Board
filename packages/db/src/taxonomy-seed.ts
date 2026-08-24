export const taxonomySeed = {
  domains: [
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
  ],
  techTags: [
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
  ],
  seniorities: [
    { slug: 'junior', label: 'Entry level' },
    { slug: 'mid', label: 'Mid level' },
    { slug: 'senior', label: 'Senior' },
    { slug: 'lead', label: 'Lead' },
    { slug: 'principal', label: 'Staff' },
  ],
} as const;

import { PrismaClient, SourceSystem } from '@prisma/client';

export type SeedCompany = {
  name: string;
  slug: string;
  website: string;
  description: string;
  seoIntro: string;
  sourceSystem: SourceSystem;
  sourceIdentifier: string;
  config: Record<string, string>;
};

function greenhouse(
  name: string,
  slug: string,
  website: string,
  description: string,
  seoIntro: string,
  boardToken: string,
): SeedCompany {
  return {
    name,
    slug,
    website,
    description,
    seoIntro,
    sourceSystem: SourceSystem.greenhouse,
    sourceIdentifier: boardToken,
    config: { boardToken },
  };
}

function ashby(
  name: string,
  slug: string,
  website: string,
  description: string,
  seoIntro: string,
  jobBoardName: string,
  extraConfig: Record<string, string> = {},
): SeedCompany {
  return {
    name,
    slug,
    website,
    description,
    seoIntro,
    sourceSystem: SourceSystem.ashby,
    sourceIdentifier: jobBoardName,
    config: { jobBoardName, ...extraConfig },
  };
}

function lever(
  name: string,
  slug: string,
  website: string,
  description: string,
  seoIntro: string,
  site: string,
): SeedCompany {
  return {
    name,
    slug,
    website,
    description,
    seoIntro,
    sourceSystem: SourceSystem.lever,
    sourceIdentifier: site,
    config: { site },
  };
}

export const seedCompanies: SeedCompany[] = [
  greenhouse(
    'Figure',
    'figure',
    'https://www.figure.ai',
    'Figure builds general purpose humanoid robots for commercial work and the home.',
    'Figure is a San Jose humanoid company (Figure 03) with live openings in perception, controls, hardware, and fleet ops. Robot Jobs Board aggregates Figure jobs from their public ATS so you can compare titles and US locations in one place.',
    'figureai',
  ),
  greenhouse(
    'Apptronik',
    'apptronik',
    'https://www.apptronik.com',
    'Apptronik designs Apollo, an AI powered humanoid for manufacturing and logistics.',
    'Apptronik (Austin) posts live Apollo humanoid openings across mechanical, controls, applied AI, and production. Browse aggregated Apptronik jobs on Robot Jobs Board instead of hunting their ATS alone.',
    'apptronik',
  ),
  greenhouse(
    'Anduril Industries',
    'anduril',
    'https://www.anduril.com',
    'Anduril builds autonomous defense systems including aerial drones and command software.',
    'Anduril Industries hires for autonomous air, land, and maritime systems — live autonomy, perception, and robotics software openings across the US. Robot Jobs Board lists Anduril jobs aggregated from their public career board.',
    'andurilindustries',
  ),
  greenhouse(
    'Locus Robotics',
    'locus-robotics',
    'https://locusrobotics.com',
    'Locus Robotics builds autonomous mobile robots and fleet software for warehouse fulfillment.',
    'Locus Robotics (Wilmington, MA) posts live AMR and LocusONE openings for deployment, robotics software, and customer success. Compare US and Europe Locus jobs aggregated on Robot Jobs Board.',
    'locusrobotics',
  ),
  greenhouse(
    'Agility Robotics',
    'agility-robotics',
    'https://www.agilityrobotics.com',
    'Agility Robotics builds Digit, a bipedal robot for warehouse and logistics work.',
    'Agility Robotics commercializes Digit with live openings in Salem, Pittsburgh, and the Bay Area. Compare Digit hardware, controls, and deployment jobs aggregated on Robot Jobs Board.',
    'agilityrobotics',
  ),
  greenhouse(
    'Ocado Group',
    'ocado-group',
    'https://www.ocadogroup.com',
    'Ocado Group builds grocery automation including warehouse robots, grid systems, and software.',
    'Ocado Group is a UK technology and robotics company operating automated customer fulfillment centers. Hiring spans robotics software, controls, and site engineering in the United Kingdom and Europe. Robot Jobs Board lists Ocado robotics and warehouse automation jobs in the USA, UK, and Europe.',
    'ocadogroup',
  ),
  greenhouse(
    'Path Robotics',
    'path-robotics',
    'https://www.path-robotics.com',
    'Path Robotics builds AI powered welding robots for manufacturers.',
    'Path Robotics is a Columbus industrial robotics company that teaches welding robots to see, think, and adapt on the shop floor. Roles cover computer vision, manufacturing, and field deployment in the United States. Browse Robot Jobs Board for Path Robotics welding and factory automation jobs.',
    'pathrobotics',
  ),
  greenhouse(
    'Blue River Technology',
    'blue-river-technology',
    'https://www.bluerivertechnology.com',
    'Blue River Technology builds See & Spray agricultural robots and computer vision for farming.',
    'Blue River Technology, a John Deere company, develops machine learning and robotics for precision agriculture. Software, hardware, and field teams hire in the United States. Robot Jobs Board lists Blue River field robotics jobs in the USA, UK, and Europe.',
    'bluerivertech',
  ),
  greenhouse(
    'Carbon Robotics',
    'carbon-robotics',
    'https://carbonrobotics.com',
    'Carbon Robotics builds LaserWeeder, an autonomous agricultural robot for in row weeding.',
    'Carbon Robotics (Seattle) hires for LaserWeeder field robotics — vision, mechanical, and farm ops. See live Carbon Robotics agricultural robot jobs aggregated on Robot Jobs Board.',
    'carbonrobotics',
  ),
  greenhouse(
    'Zipline',
    'zipline',
    'https://www.zipline.com',
    'Zipline operates autonomous delivery drones for medical supplies and commercial logistics.',
    'Zipline is a drone delivery company flying long range aircraft for hospitals, retailers, and public health programs. Autonomy, airframe, and operations teams hire across the United States. Robot Jobs Board lists Zipline drone jobs in the USA, UK, and Europe.',
    'flyzipline',
  ),
  greenhouse(
    'Outrider',
    'outrider',
    'https://www.outrider.ai',
    'Outrider builds autonomous yard trucks and software for distribution center yards.',
    'Outrider automates trailer movement at warehouse yards with driverless yard trucks and fleet software. Perception, controls, and field teams hire in the United States. Browse Robot Jobs Board for Outrider yard autonomy and AMR adjacent jobs.',
    'outrider',
  ),
  greenhouse(
    'Formic',
    'formic',
    'https://www.formic.co',
    'Formic deploys industrial robot cells as a service for manufacturers.',
    'Formic is a Chicago industrial automation company that installs and supports robotic cells under a robotics as a service model. Field service, controls, and deployment engineers work at customer factories across the United States. Robot Jobs Board lists Formic industrial robot jobs in the USA, UK, and Europe.',
    'formic',
  ),
  greenhouse(
    'Gather AI',
    'gather-ai',
    'https://gather.ai',
    'Gather AI uses warehouse drones and computer vision for inventory intelligence.',
    'Gather AI is a Pittsburgh company that flies autonomous drones and uses existing equipment to digitize warehouse inventory. Robotics, autonomy, and machine learning teams hire in the United States. Search Robot Jobs Board for Gather AI warehouse drone jobs.',
    'gatherai',
  ),
  greenhouse(
    'Wayve',
    'wayve',
    'https://wayve.ai',
    'Wayve builds embodied AI for autonomous vehicles from its UK engineering base.',
    'Wayve is a London autonomy company training end to end AI for driving. Research, software, and hardware teams hire in the United Kingdom and related European sites. Robot Jobs Board lists Wayve jobs located in the USA, UK, or other European countries.',
    'wayve',
  ),
  greenhouse(
    'Nuro',
    'nuro',
    'https://www.nuro.ai',
    'Nuro builds autonomous delivery robots for local goods transport on public roads.',
    'Nuro is a Mountain View robotics company whose driverless delivery vehicles operate in US cities. Autonomy, hardware, and fleet operations jobs are typically on site in California and Texas. Browse Robot Jobs Board for Nuro delivery robot jobs in the United States.',
    'nuro',
  ),
  greenhouse(
    'Wing',
    'wing',
    'https://wing.com',
    'Wing, an Alphabet company, operates autonomous delivery drones for local goods.',
    'Wing flies small delivery aircraft for packages and food in the United States, Australia, and Europe. Aviation, autonomy, and operations teams hire in Palo Alto and related sites. Robot Jobs Board lists Wing drone jobs in the USA, UK, Australia, and Europe.',
    'wing',
  ),
  greenhouse(
    'GITAI',
    'gitai',
    'https://gitai.tech',
    'GITAI builds space robotics including lunar and orbital robot arms and vehicles.',
    'GITAI is a space robotics company with engineering in Los Angeles for satellite servicing, lunar work, and in-orbit assembly. Hardware and electromechanical teams hire in the United States. Search Robot Jobs Board for GITAI space robot jobs in the USA, UK, and Europe.',
    'gitai',
  ),
  greenhouse(
    'Diligent Robotics',
    'diligent-robotics',
    'https://www.diligentrobots.com',
    'Diligent Robotics builds Moxi, a socially intelligent hospital robot for clinical support.',
    'Diligent Robotics deploys Moxi in US hospitals to fetch supplies and run routine logistics so nurses can stay with patients. Fleet, field, and clinical robot operations jobs hire across the United States. Browse Robot Jobs Board for Diligent hospital robotics jobs.',
    'diligentrobotics',
  ),
  greenhouse(
    'Nimble Robotics',
    'nimble-robotics',
    'https://www.nimble.ai',
    'Nimble Robotics builds AI powered warehouse robots for e-commerce fulfillment.',
    'Nimble Robotics is a San Francisco company combining robotic picking, autonomous mobile robots, and fulfillment software. Hardware, AI, and operations teams hire in the United States. Robot Jobs Board lists Nimble warehouse robotics jobs in the USA, UK, and Europe.',
    'nimblerobotics',
  ),
  greenhouse(
    'Kodiak Robotics',
    'kodiak-robotics',
    'https://kodiak.ai',
    'Kodiak Robotics builds autonomous trucking software and driverless freight vehicles.',
    'Kodiak Robotics develops self driving systems for long haul trucks with operations in California and Texas. Autonomy, vehicle, and test teams hire in the United States. Search Robot Jobs Board for Kodiak autonomous trucking jobs.',
    'kodiak',
  ),
  greenhouse(
    'Motional',
    'motional',
    'https://www.motional.com',
    'Motional builds autonomous robotaxis and driverless vehicle software.',
    'Motional is an AV company testing robotaxis in US cities including Las Vegas and Pittsburgh. Autonomy, vehicle test, and operations jobs hire in the United States. Robot Jobs Board only lists Motional jobs based in the USA, UK, Canada, Australia, or Europe.',
    'motional',
  ),
  greenhouse(
    'May Mobility',
    'may-mobility',
    'https://maymobility.com',
    'May Mobility operates autonomous shuttles for public transit and campus routes.',
    'May Mobility deploys driverless shuttles in US cities with Multi-Policy Decision Making software. Autonomy, operations, and vehicle engineering teams hire in Ann Arbor and related sites. Browse Robot Jobs Board for May Mobility AV jobs in the United States.',
    'maymobility',
  ),
  greenhouse(
    'Stack AV',
    'stack-av',
    'https://www.stackav.com',
    'Stack AV builds autonomous trucking technology for freight networks.',
    'Stack AV is a Pittsburgh autonomy company working on self driving trucks for logistics. Engineering and operations jobs hire across US freight corridors. Robot Jobs Board lists Stack AV autonomous trucking jobs in the United States.',
    'stackav',
  ),
  greenhouse(
    'Waymo',
    'waymo',
    'https://waymo.com',
    'Waymo builds the Waymo Driver for robotaxis and autonomous delivery.',
    'Waymo operates driverless ride hail and autonomy R&D with live openings in California and Arizona. Robot Jobs Board aggregates Waymo autonomy and robotics jobs from their public ATS for easy comparison.',
    'waymo',
  ),
  ashby(
    '1X',
    '1x',
    'https://www.1x.tech',
    '1X builds humanoid robots for home and commercial work, including NEO and EVE.',
    '1X builds NEO and EVE humanoids with live hardware, learning, and robot ops openings in the US and Europe. Compare 1X jobs aggregated on Robot Jobs Board from their public career page.',
    '1x',
  ),
  ashby(
    'Skydio',
    'skydio',
    'https://www.skydio.com',
    'Skydio builds autonomous drones for inspection, public safety, and defense.',
    'Skydio is a US drone company known for obstacle avoidance and enterprise aircraft. Software, hardware, and field teams hire across the United States. Search Robot Jobs Board for Skydio autonomy and aerial robotics jobs.',
    'skydio',
  ),
  ashby(
    'Physical Intelligence',
    'physical-intelligence',
    'https://www.physicalintelligence.company',
    'Physical Intelligence trains foundation models for general purpose robots.',
    'Physical Intelligence is a San Francisco robotics research company building generalist robot policies. Research scientist and engineering jobs are typically US based. Robot Jobs Board lists Physical Intelligence jobs in the USA, UK, and Europe.',
    'physicalintelligence',
  ),
  ashby(
    'Sereact',
    'sereact',
    'https://sereact.ai',
    'Sereact builds AI picking software and warehouse robotics for fulfillment.',
    'Sereact is a Stuttgart company applying vision language action models to robotic picking in warehouses. Software and deployment teams hire in Germany and across Europe. Browse Robot Jobs Board for Sereact warehouse robotics jobs in the USA, UK, and Europe.',
    'sereact',
  ),
  ashby(
    'Standard Bots',
    'standard-bots',
    'https://standardbots.com',
    'Standard Bots builds RO1, an AI native industrial robot arm for factories.',
    'Standard Bots is a New York industrial robotics company making affordable six axis arms with onboard AI. Hardware, software, and applications jobs hire in the United States. Robot Jobs Board lists Standard Bots cobot and factory automation jobs.',
    'standardbots',
  ),
  ashby(
    'Generalist',
    'generalist',
    'https://www.generalist.com',
    'Generalist builds general purpose robots and foundation models for physical work.',
    'Generalist is a US robotics company hiring researchers and robot operations staff in the Bay Area and Boston. Robot Jobs Board lists Generalist humanoid and general purpose robot jobs in the USA, UK, and Europe.',
    'generalist',
  ),
  ashby(
    'Reflex Robotics',
    'reflex-robotics',
    'https://www.reflexrobotics.com',
    'Reflex Robotics builds low cost wheeled humanoid robots for logistics and manufacturing.',
    'Reflex Robotics is a New York company designing affordable mobile manipulators with teleoperation and learning in the loop. Electrical, mechanical, and software jobs are typically NYC based. Search Robot Jobs Board for Reflex humanoid jobs.',
    'reflexrobotics',
  ),
  ashby(
    'Foxglove',
    'foxglove',
    'https://foxglove.dev',
    'Foxglove builds observability and visualization software for robot development teams.',
    'Foxglove makes tools used across the robotics industry to inspect bags, streams, and robot state. Engineering jobs are often remote in the United States. Robot Jobs Board lists Foxglove jobs located in the USA, UK, or Europe.',
    'foxglove',
  ),
  ashby(
    'Sanctuary AI',
    'sanctuary-ai',
    'https://sanctuary.ai',
    'Sanctuary AI builds general purpose humanoid robots and Carbon cognitive architecture.',
    'Sanctuary AI develops humanoid robots with a Canadian research base and additional hiring in the United States and Europe. Robot Jobs Board only publishes Sanctuary jobs located in the USA, UK, or other European countries.',
    'sanctuary',
  ),
  ashby(
    'Applied Intuition',
    'applied-intuition',
    'https://www.appliedintuition.com',
    'Applied Intuition builds simulation, vehicle software, and physical AI tools for autonomy teams.',
    'Applied Intuition serves automotive, trucking, and defense customers with autonomy development software and on-vehicle stacks. Engineering jobs hire across the United States. Robot Jobs Board lists Applied Intuition autonomy and robotics software jobs in the USA, UK, and Europe.',
    'applied',
  ),
  ashby(
    'Serve Robotics',
    'serve-robotics',
    'https://www.serverobotics.com',
    'Serve Robotics builds sidewalk delivery robots for food and local goods.',
    'Serve Robotics operates autonomous sidewalk robots in US cities, with hardware and software teams in the Bay Area. Robotics, embedded, and operations jobs hire in the United States. Browse Robot Jobs Board for Serve delivery robot jobs.',
    'serverobotics',
  ),
  ashby(
    'Collaborative Robotics',
    'collaborative-robotics',
    'https://www.collaborativerobotics.com',
    'Collaborative Robotics builds Proxie, a collaborative mobile robot for human-centered workplaces.',
    'Collaborative Robotics (Cobot) is a Santa Clara company building Proxie for logistics and commercial environments where people and robots share space. Hardware, software, and deployment teams hire in California and related US sites. Robot Jobs Board lists Collaborative Robotics jobs in the USA, UK, and Europe.',
    'cobot',
  ),
  lever(
    'Shield AI',
    'shield-ai',
    'https://www.shield.ai',
    'Shield AI builds autonomous aircraft and Hivemind software for defense missions.',
    'Shield AI flies uncrewed aircraft with GPS-denied autonomy — live aerospace and software openings across the US. Browse Shield AI drone jobs aggregated on Robot Jobs Board.',
    'shieldai',
  ),
  lever(
    'ANYbotics',
    'anybotics',
    'https://www.anybotics.com',
    'ANYbotics builds ANYmal, an autonomous quadruped for industrial inspection.',
    'ANYbotics is a Zurich field robotics company with offices in Barcelona and San Francisco. Hardware, locomotion, and field engineering jobs hire across Switzerland, Spain, and the United States. Robot Jobs Board lists ANYbotics inspection robot jobs in the USA, UK, and Europe.',
    'anybotics',
  ),
  lever(
    'Dexterity',
    'dexterity',
    'https://www.dexterity.ai',
    'Dexterity builds AI robotics for warehouse picking, truck loading, and logistics.',
    'Dexterity is a Redwood City company deploying robot arms and AI for parcel and warehouse work. Controls, field service, and software teams hire in the United States. Search Robot Jobs Board for Dexterity warehouse robotics jobs.',
    'dexterity',
  ),
  lever(
    'OSARO',
    'osaro',
    'https://www.osaro.com',
    'OSARO builds vision AI and robotic picking systems for warehouses.',
    'OSARO develops piece picking robots and perception software used in fulfillment centers. Controls, deployment, and software jobs hire in San Francisco and related US sites. Robot Jobs Board lists OSARO warehouse robotics jobs in the USA, UK, and Europe.',
    'osaro',
  ),
  lever(
    'Zoox',
    'zoox',
    'https://zoox.com',
    'Zoox, an Amazon company, builds purpose designed robotaxis and autonomy software.',
    'Zoox (Foster City) hires for purpose-built robotaxis — live autonomy, vehicle, and safety openings. Compare Zoox AV jobs aggregated on Robot Jobs Board from their public careers page.',
    'zoox',
  ),
  lever(
    'Waabi',
    'waabi',
    'https://www.waabi.ai',
    'Waabi builds generative AI for autonomous trucking and virtual testing.',
    'Waabi trains autonomy models in simulation and on public roads, with teams in Toronto, San Francisco, and Pittsburgh. Research and engineering jobs hire in Canada and the United States. Robot Jobs Board lists Waabi AV jobs in the USA, UK, Canada, and Europe.',
    'waabi',
  ),
  lever(
    'Pickle Robot',
    'pickle-robot',
    'https://www.picklerobot.com',
    'Pickle Robot builds AI robots that unload trucks and containers in warehouses.',
    'Pickle Robot is a Boston warehouse robotics company whose systems unload trailers alongside human teams. Perception, motion planning, and hardware engineers hire in Massachusetts. Search Robot Jobs Board for Pickle Robot truck unloading and logistics robotics jobs in the United States.',
    'picklerobot',
  ),
  lever(
    'Ambi Robotics',
    'ambi-robotics',
    'https://www.ambirobotics.com',
    'Ambi Robotics builds AI powered robotic picking systems for parcel and e-commerce fulfillment.',
    'Ambi Robotics is a Berkeley company deploying high speed picking robots for logistics operators. Software, hardware, and operations teams hire in California. Robot Jobs Board lists Ambi Robotics warehouse picking jobs in the USA, UK, and Europe.',
    'ambirobotics',
  ),
  greenhouse(
    'Agile Robots',
    'agile-robots',
    'https://www.agile-robots.com',
    'Agile Robots builds AI powered robots and automation systems for industrial and service applications.',
    'Agile Robots is a Munich robotics company developing intelligent robot systems for manufacturing and service work. Hardware, software, and commissioning teams hire across Germany. Browse Robot Jobs Board for Agile Robots industrial robotics jobs in the USA, UK, and Europe.',
    'agilerobotsse',
  ),
  ashby(
    'Humanoid',
    'humanoid',
    'https://www.thehumanoid.ai',
    'Humanoid builds commercially scalable humanoid robots, including the HMND-01 platform.',
    'Humanoid is a London based humanoid robotics company with engineering hubs in the United Kingdom and the United States. Roles cover AI, controls, hardware, and manufacturing for industrial humanoid deployments. Robot Jobs Board lists Humanoid jobs in the USA, UK, and Europe.',
    'humanoid',
  ),
  ashby(
    'OpenAI',
    'openai',
    'https://openai.com',
    'OpenAI builds frontier AI systems and is hiring across a Robotics team spanning hardware, firmware, controls, and ML infrastructure.',
    'OpenAI (San Francisco) posts robotics roles from actuator and firmware engineering through inference and distributed data systems for robot training — including listings with public base salaries into the high hundreds of thousands. Robot Jobs Board aggregates OpenAI Robotics team jobs from their public Ashby board (not the full company careers page).',
    'openai',
    // OpenAI's Ashby board is company-wide; keep Robotics team / robot-titled roles only.
    { keyword: 'robot' },
  ),
  {
    name: 'NEURA Robotics',
    slug: 'neura-robotics',
    website: 'https://www.neura-robotics.com',
    description: 'NEURA Robotics builds cognitive collaborative robots and humanoids including 4NE1, MAiRA, and MiPA.',
    seoIntro:
      'NEURA Robotics is a German humanoid and collaborative robotics company based near Stuttgart, with sites across Germany, Switzerland, and the United States. Engineering, AI, and production teams hire for perception, manipulation, and robot operations. Search Robot Jobs Board for NEURA Robotics jobs in the USA, UK, and Europe.',
    sourceSystem: SourceSystem.jobshop,
    sourceIdentifier: 'neura-robotics',
    config: { site: 'https://jobs.neura-robotics.com' },
  },
  {
    name: 'Boston Dynamics',
    slug: 'boston-dynamics',
    website: 'https://bostondynamics.com',
    description: 'Boston Dynamics builds Atlas, Spot, and Stretch robots for research, inspection, and warehouses.',
    seoIntro:
      'Boston Dynamics (Waltham) hires for Atlas, Spot, and Stretch — live mechanical, controls, and AI openings. Robot Jobs Board aggregates Boston Dynamics jobs from Workday so you can scan titles without the careers portal alone.',
    sourceSystem: SourceSystem.workday,
    sourceIdentifier: 'bostondynamics',
    config: {
      host: 'bostondynamics.wd1.myworkdayjobs.com',
      tenant: 'bostondynamics',
      site: 'Boston_Dynamics',
    },
  },
  {
    name: 'AutoStore',
    slug: 'autostore',
    website: 'https://www.autostoresystem.com',
    description: 'AutoStore builds cube storage robots and software for dense warehouse fulfillment.',
    seoIntro:
      'AutoStore warehouse robotics roles span Norway, the US, and Europe — electronics, product, and deployment. Browse live AutoStore jobs aggregated on Robot Jobs Board from their public Workday board.',
    sourceSystem: SourceSystem.workday,
    sourceIdentifier: 'autostore',
    config: {
      host: 'autostore.wd3.myworkdayjobs.com',
      tenant: 'autostore',
      site: 'autostore',
    },
  },
  {
    name: 'Exotec',
    slug: 'exotec',
    website: 'https://www.exotec.com',
    description: 'Exotec builds Skypod warehouse robots and Deepsky software for goods to person fulfillment.',
    seoIntro:
      'Exotec is a French warehouse robotics company deploying Skypod AMRs in Europe and the United States. R&D, deployment, and maintenance teams hire in France, the UK, and US sites such as Atlanta. Robot Jobs Board lists Exotec AMR jobs in the USA, UK, and other European countries.',
    sourceSystem: SourceSystem.workable,
    sourceIdentifier: 'exotec',
    config: { site: 'exotec' },
  },
  {
    name: 'Flyability',
    slug: 'flyability',
    website: 'https://www.flyability.com',
    description: 'Flyability builds collision tolerant indoor inspection drones such as Elios.',
    seoIntro:
      'Flyability is a Swiss drone company whose Elios aircraft inspect tanks, boilers, and other confined industrial spaces. Product, engineering, and field jobs hire in Switzerland and across Europe. Browse Robot Jobs Board for Flyability inspection drone jobs in the USA, UK, and Europe.',
    sourceSystem: SourceSystem.workable,
    sourceIdentifier: 'flyability',
    config: { site: 'flyability' },
  },
];

export async function upsertSeedCompanies(db: PrismaClient): Promise<number> {
  for (const company of seedCompanies) {
    const row = await db.company.upsert({
      where: {
        sourceSystem_sourceIdentifier: {
          sourceSystem: company.sourceSystem,
          sourceIdentifier: company.sourceIdentifier,
        },
      },
      create: {
        name: company.name,
        slug: company.slug,
        website: company.website,
        description: company.description,
        seoIntro: company.seoIntro,
        sourceSystem: company.sourceSystem,
        sourceIdentifier: company.sourceIdentifier,
      },
      update: {
        name: company.name,
        slug: company.slug,
        website: company.website,
        description: company.description,
        seoIntro: company.seoIntro,
      },
    });

    const existingFeed = await db.sourceFeedConfig.findFirst({
      where: { companyId: row.id, sourceSystem: company.sourceSystem },
    });
    if (!existingFeed) {
      await db.sourceFeedConfig.create({
        data: {
          companyId: row.id,
          sourceSystem: company.sourceSystem,
          config: company.config,
          active: true,
        },
      });
    } else {
      await db.sourceFeedConfig.update({
        where: { id: existingFeed.id },
        data: { config: company.config, active: true },
      });
    }
  }

  return seedCompanies.length;
}

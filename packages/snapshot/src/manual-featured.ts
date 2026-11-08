import { slugify } from '@robot-jobs-board/ingestion/normalize';
import { MICRO1_MANUAL_POST_ID } from './micro1-post-status';
import { stableEntityId } from './stable-id';
import type { PublicBoardSnapshot, SnapshotJob } from './types';

const MICRO1_POST_ID = MICRO1_MANUAL_POST_ID;
const MICRO1_REFERRAL_URL =
  'https://jobs.micro1.ai/post/6ce8225a-9f5a-4b30-a556-9081176bffff?referralCode=3943c7a5-1466-416f-81e0-f148afc37813&utm_source=referral&utm_medium=share&utm_campaign=job_referral';

const MICRO1_LOGO =
  'https://micro1-portal-data.s3.us-east-1.amazonaws.com/gptvetting/1773721023535-17057c0f-fc0d-4bfd-b261-8362cb83b589-micro1-new-logo.png';

const DESCRIPTION_HTML = `<p><strong>Job Title:</strong> Member of Technical Staff, Robotics &amp; Embodied AI Research</p>
<p><strong>Job Type:</strong> Full-time · <strong>Location:</strong> Remote</p>
<p><strong>The Role</strong></p>
<p>Frontier research in embodied AI, robot learning, and physical AI: vision-language-action (VLA) models, generalist robot policies, world models, and sim-to-real evaluation.</p>
<p><strong>What You'll Do</strong></p>
<ul>
<li>Lead robotics research across VLA models, generalist policies, world models, and embodied AI.</li>
<li>Design end-to-end systems: teleoperation, data collection, simulation, deployment, and real-world evaluation.</li>
<li>Build simulations from real-world data; structure datasets via human-in-the-loop annotation.</li>
<li>Prototype novel robot learning approaches and carry projects from exploration to implementation.</li>
</ul>
<p><strong>What We're Looking For</strong></p>
<ul>
<li>Robotics, embodied AI, robot learning, computer vision, or applied ML research background.</li>
<li>Hands-on VLA, imitation learning, or generalist policy work; strong Python and PyTorch (and/or ROS).</li>
<li>Real-world data collection, simulation, policy evaluation, or hardware deployment experience.</li>
</ul>
<p><strong>Preferred</strong></p>
<ul>
<li>World models, RL, diffusion policies; MuJoCo, Isaac Sim, or similar; publications or open-source robotics work.</li>
</ul>
<p><strong>Compensation</strong></p>
<p>Base salary range listed by micro1: $200,000–$320,000 (US national range), plus equity and benefits. Apply via micro1 for full details.</p>`;

const DESCRIPTION_PLAIN = DESCRIPTION_HTML.replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

function micro1ManualFeaturedJob(): SnapshotJob {
  const companySlug = 'micro1';
  const companyId = stableEntityId('company', companySlug);
  const jobId = stableEntityId('manual-job', MICRO1_POST_ID);
  const title = 'Member of Technical Staff, Robotics & Embodied AI Research';
  const domainHumanoid = stableEntityId('domain', 'humanoid');
  const tagPython = stableEntityId('tag', 'python');
  const tagPytorch = stableEntityId('tag', 'pytorch');
  const tagRos2 = stableEntityId('tag', 'ros2');
  const seniorityStaff = stableEntityId('seniority', 'principal');

  return {
    id: jobId,
    slug: slugify(title),
    title,
    descriptionHtml: DESCRIPTION_HTML,
    descriptionPlain: DESCRIPTION_PLAIN,
    url: MICRO1_REFERRAL_URL,
    locationRaw: 'Remote',
    country: 'United States',
    region: null,
    city: null,
    isRemote: true,
    workplaceType: 'REMOTE',
    employmentType: 'FULL_TIME',
    department: 'Robotics & Embodied AI',
    compensationText: '$200k–$320k base (micro1 listing)',
    postedAt: '2026-11-07T22:08:58.000Z',
    expiresAt: '2027-01-06T22:08:58.000Z',
    createdAt: '2026-11-07T22:08:58.000Z',
    isHidden: false,
    isActive: true,
    sourceSystem: 'direct',
    externalId: MICRO1_POST_ID,
    companyId,
    company: {
      name: 'micro1',
      slug: companySlug,
      website: 'https://micro1.ai',
      logoUrl: MICRO1_LOGO,
      sourceIdentifier: null,
    },
    robotDomains: [
      {
        domainId: domainHumanoid,
        domain: { id: domainHumanoid, slug: 'humanoid', name: 'Humanoid' },
      },
    ],
    techTags: [
      { techTag: { id: tagPython, slug: 'python', label: 'Python' } },
      { techTag: { id: tagPytorch, slug: 'pytorch', label: 'PyTorch' } },
      { techTag: { id: tagRos2, slug: 'ros2', label: 'ROS 2' } },
    ],
    seniorities: [{ seniority: { id: seniorityStaff, slug: 'principal', label: 'Staff' } }],
    featuredUntil: '2027-01-06T22:08:58.000Z',
    featuredAt: '2026-11-07T22:08:58.000Z',
    featuredSource: 'partner',
  };
}

export function manualFeaturedJobs(): SnapshotJob[] {
  if (process.env.DISABLE_MANUAL_FEATURED === '1') return [];
  return [micro1ManualFeaturedJob()];
}

/** Insert/replace partner Featured rows (snapshot-only; no Neon). */
export function mergeManualFeaturedJobsIntoList(
  jobs: SnapshotJob[],
  manual: SnapshotJob[] = manualFeaturedJobs(),
): SnapshotJob[] {
  if (!manual.length) return jobs;

  let next = [...jobs];
  for (const entry of manual) {
    next = next.filter(
      (job) => job.id !== entry.id && !(job.externalId === entry.externalId && job.sourceSystem === entry.sourceSystem),
    );
    next.push(entry);
  }
  return next;
}

function upsertManualCompany(snapshot: PublicBoardSnapshot, job: SnapshotJob): PublicBoardSnapshot['companies'] {
  const existing = snapshot.companies.find((c) => c.slug === job.company.slug);
  if (existing) {
    return snapshot.companies.map((c) =>
      c.slug === job.company.slug ? { ...c, openJobCount: Math.max(c.openJobCount, 1) } : c,
    );
  }
  return [
    ...snapshot.companies,
    {
      id: job.companyId,
      name: job.company.name,
      slug: job.company.slug,
      website: job.company.website,
      logoUrl: job.company.logoUrl,
      description: `${job.company.name} roles on Robot Jobs Board.`,
      seoIntro: `${job.company.name} jobs on Robot Jobs Board.`,
      openJobCount: 1,
    },
  ];
}

/** Apply partner Featured after loading or building a board snapshot. */
export function applyManualFeaturedToSnapshot(
  snapshot: PublicBoardSnapshot,
  manual: SnapshotJob[] = manualFeaturedJobs(),
): PublicBoardSnapshot {
  if (!manual.length) return snapshot;

  const jobs = mergeManualFeaturedJobsIntoList(snapshot.jobs, manual);
  let companies = snapshot.companies;
  for (const job of manual) {
    companies = upsertManualCompany({ ...snapshot, companies, jobs }, job);
  }
  return { ...snapshot, jobs, companies };
}

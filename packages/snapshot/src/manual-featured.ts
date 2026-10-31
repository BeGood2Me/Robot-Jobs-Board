import { slugify } from '@robot-jobs-board/ingestion/normalize';
import { MICRO1_MANUAL_POST_ID } from './micro1-post-status';
import { stableEntityId } from './stable-id';
import type { PublicBoardSnapshot, SnapshotJob } from './types';

const MICRO1_POST_ID = MICRO1_MANUAL_POST_ID;
const MICRO1_REFERRAL_URL =
  'https://jobs.micro1.ai/post/cfaf2d70-673a-4edb-aeba-558fcf33eb9a?referralCode=3943c7a5-1466-416f-81e0-f148afc37813&utm_source=referral&utm_medium=share&utm_campaign=job_referral';

const MICRO1_LOGO =
  'https://micro1-portal-data.s3.us-east-1.amazonaws.com/gptvetting/1773721023535-17057c0f-fc0d-4bfd-b261-8362cb83b589-micro1-new-logo.png';

const DESCRIPTION_HTML = `<p><strong>Job Title:</strong> Member of Technical Staff, Model Training (applied research)</p>
<p><strong>Job Type:</strong> Full-time · <strong>Location:</strong> Remote</p>
<p><strong>The Role</strong></p>
<p>In this role, you will work across language models, multimodal systems, robotics, and autonomous agents, developing models optimized for specific applications and environments. You will own the full model development lifecycle, from understanding application requirements and designing training datasets to model adaptation, evaluation, and production deployment.</p>
<p>Our objective is to build specialized models that match or exceed the quality of frontier models on targeted workloads while significantly improving inference efficiency, latency, and cost.</p>
<p><strong>What You'll Do</strong></p>
<ul>
<li>Train, fine-tune, and adapt language, vision-language, and robotics models using SFT, RL, imitation learning, and distillation.</li>
<li>Develop specialized models for multimodal understanding, robotic perception and control, and autonomous agents.</li>
<li>Build simulation-based training and evaluation environments for policy learning and sim-to-real transfer.</li>
<li>Optimize models for production inference (latency, throughput, cost).</li>
</ul>
<p><strong>What We're Looking For</strong></p>
<ul>
<li>Strong ML/deep learning foundations with hands-on model training and evaluation experience.</li>
<li>Experience with LLMs, vision-language models, robotics, RL, or autonomous agents.</li>
<li>Strong Python and PyTorch; solid software engineering for training and inference pipelines.</li>
</ul>
<p><strong>Nice to Have</strong></p>
<ul>
<li>Robotics, embodied AI, vision-language-action models, or simulation-based policy learning.</li>
<li>Inference optimization (quantization, compression, efficient serving).</li>
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
  const title = 'Member of Technical Staff, Model Training (applied research)';
  const domainResearch = stableEntityId('domain', 'amr');
  const tagPython = stableEntityId('tag', 'python');
  const tagPytorch = stableEntityId('tag', 'pytorch');
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
    department: 'Applied research',
    compensationText: '$200k–$320k base (micro1 listing)',
    postedAt: '2026-10-27T00:00:00.000Z',
    expiresAt: '2026-12-26T21:33:18.000Z',
    createdAt: '2026-10-27T21:33:18.000Z',
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
        domainId: domainResearch,
        domain: { id: domainResearch, slug: 'amr', name: 'AMR' },
      },
    ],
    techTags: [
      { techTag: { id: tagPython, slug: 'python', label: 'Python' } },
      { techTag: { id: tagPytorch, slug: 'pytorch', label: 'PyTorch' } },
    ],
    seniorities: [{ seniority: { id: seniorityStaff, slug: 'principal', label: 'Staff' } }],
    featuredUntil: '2026-12-26T21:33:18.000Z',
    featuredAt: '2026-10-31T09:00:00.000Z',
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

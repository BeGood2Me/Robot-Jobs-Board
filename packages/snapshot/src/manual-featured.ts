import { slugify } from '@robot-jobs-board/ingestion/normalize';
import { MICRO1_MANUAL_POST_ID } from './micro1-post-status';
import { stableEntityId } from './stable-id';
import type { PublicBoardSnapshot, SnapshotJob } from './types';

const MICRO1_POST_ID = MICRO1_MANUAL_POST_ID;
const MICRO1_REFERRAL_URL =
  'https://jobs.micro1.ai/post/b7a0623b-f333-4183-a744-9879576aa933?referralCode=3943c7a5-1466-416f-81e0-f148afc37813&utm_source=referral&utm_medium=share&utm_campaign=job_referral';

const MICRO1_LOGO =
  'https://micro1-portal-data.s3.us-east-1.amazonaws.com/gptvetting/1773721023535-17057c0f-fc0d-4bfd-b261-8362cb83b589-micro1-new-logo.png';

const DESCRIPTION_HTML = `<p><strong>Role Title:</strong> Mechanical Design Engineer — Robotics CNC Parts (Remote)</p>
<p><strong>Role Type:</strong> Contractor · <strong>Location:</strong> Fully remote (no geographic restrictions)</p>
<p><strong>Opportunity Snapshot</strong></p>
<ul>
<li><strong>Pay:</strong> $90–$155/hour (output-based; paid per task meeting project specs)</li>
<li><strong>Duration:</strong> Initial phase of 20 part packages; production phase to follow</li>
</ul>
<p>micro1 is engaging senior mechanical design engineers to create original CAD part packages for a client robotics project. Your engineering judgment is what matters — no prior AI experience required.</p>
<p>Each package is a new part you design from scratch: a high-value CNC part with a specific machining challenge, plus drawing with full GD&amp;T, design rationale, and a production scenario you justify from experience. Packages are peer-reviewed; you will review others’ work as well.</p>
<p><strong>What you'll do</strong></p>
<ul>
<li>Design original parts in parametric CAD (native files plus STEP).</li>
<li>Produce technical drawings: dimensions, tolerances, GD&amp;T, material, finish, revision standard.</li>
<li>Write design context: function, interfaces, operating conditions, machining challenge, material/process rationale.</li>
<li>Build production scenarios: unit cost drivers, CNC cycle/setup, volume, sourcing — with engineering basis.</li>
<li>Peer review other engineers’ packages and revise yours from feedback.</li>
</ul>
<p><strong>What we're looking for</strong></p>
<ul>
<li>5+ years production engineering with comparable CNC parts, materials, and processes in robotics.</li>
<li>Technical decision authority on drawing, tolerance, material, or production release.</li>
<li>Strong GD&amp;T and tolerancing judgment; parametric CAD (SolidWorks, NX, CATIA, Creo, or similar).</li>
<li>Industry experience (not academic); OEM or specialist supplier background preferred.</li>
</ul>
<p><strong>Compensation</strong></p>
<p>Listed by micro1: $90–$155/hour USD. Apply via micro1 for screening questions and AI interview details.</p>`;

const DESCRIPTION_PLAIN = DESCRIPTION_HTML.replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

function micro1ManualFeaturedJob(): SnapshotJob {
  const companySlug = 'micro1';
  const companyId = stableEntityId('company', companySlug);
  const jobId = stableEntityId('manual-job', MICRO1_POST_ID);
  const title = 'Mechanical Design Engineer — Robotics CNC Parts (Remote)';
  const domainIndustrial = stableEntityId('domain', 'industrial');
  const tagSolidworks = stableEntityId('tag', 'solidworks');
  const tagRobotics = stableEntityId('tag', 'robotics');
  const tagMachining = stableEntityId('tag', 'precision-machining');
  const senioritySenior = stableEntityId('seniority', 'senior');

  return {
    id: jobId,
    slug: slugify(title),
    title,
    descriptionHtml: DESCRIPTION_HTML,
    descriptionPlain: DESCRIPTION_PLAIN,
    url: MICRO1_REFERRAL_URL,
    locationRaw: 'Remote',
    country: null,
    region: null,
    city: null,
    isRemote: true,
    workplaceType: 'REMOTE',
    employmentType: 'CONTRACT',
    department: 'Mechanical Design',
    compensationText: '$90–$155/hr (micro1 listing)',
    postedAt: '2026-11-25T14:05:07.000Z',
    expiresAt: '2027-01-24T14:05:07.000Z',
    createdAt: '2026-11-25T14:05:07.000Z',
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
        domainId: domainIndustrial,
        domain: { id: domainIndustrial, slug: 'industrial', name: 'Industrial' },
      },
    ],
    techTags: [
      { techTag: { id: tagSolidworks, slug: 'solidworks', label: 'SolidWorks' } },
      { techTag: { id: tagRobotics, slug: 'robotics', label: 'Robotics' } },
      { techTag: { id: tagMachining, slug: 'precision-machining', label: 'Precision Machining' } },
    ],
    seniorities: [{ seniority: { id: senioritySenior, slug: 'senior', label: 'Senior' } }],
    featuredUntil: '2027-01-24T14:05:07.000Z',
    featuredAt: '2026-11-25T14:05:07.000Z',
    featuredSource: 'partner',
  };
}

export function manualFeaturedJobs(): SnapshotJob[] {
  if (process.env.DISABLE_MANUAL_FEATURED === '1') return [];
  return [micro1ManualFeaturedJob()];
}

function isPartnerDirectSlot(job: SnapshotJob): boolean {
  return job.sourceSystem === 'direct' && job.featuredSource === 'partner';
}

/** Drop any prior partner direct listing for the same company (e.g. rotated micro1 post ids). */
function isReplacedPartnerSlot(job: SnapshotJob, entry: SnapshotJob): boolean {
  return isPartnerDirectSlot(job) && isPartnerDirectSlot(entry) && job.company.slug === entry.company.slug;
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
      (job) =>
        job.id !== entry.id &&
        !(job.externalId === entry.externalId && job.sourceSystem === entry.sourceSystem) &&
        !isReplacedPartnerSlot(job, entry),
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
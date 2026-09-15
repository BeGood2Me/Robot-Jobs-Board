/**
 * Re-run RuleBasedClassifier over the public board snapshot (no ATS refetch).
 * Usage: pnpm exec tsx scripts/reclassify-snapshot.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { gunzipSync, gzipSync } from 'node:zlib';
import { resolve } from 'node:path';
import { RuleBasedClassifier } from '../packages/taxonomy/src/classify.ts';
import { taxonomySeed } from '../packages/db/src/taxonomy-seed.ts';
import { stableEntityId } from '../packages/snapshot/src/stable-id.ts';

const classifier = new RuleBasedClassifier();
const path = resolve('apps/web/public/snapshot/board.json.gz');
const snapshot = JSON.parse(gunzipSync(readFileSync(path)).toString('utf8'));

const tagBySlug = new Map(
  taxonomySeed.techTags.map((tag) => [
    tag.slug,
    { id: stableEntityId('tag', tag.slug), slug: tag.slug, label: tag.label },
  ]),
);
const domainBySlug = new Map(
  taxonomySeed.domains.map((domain) => [
    domain.slug,
    {
      id: stableEntityId('domain', domain.slug),
      slug: domain.slug,
      name: domain.name,
      description: domain.description,
    },
  ]),
);
const seniorityBySlug = new Map(
  taxonomySeed.seniorities.map((s) => [
    s.slug,
    { id: stableEntityId('seniority', s.slug), slug: s.slug, label: s.label },
  ]),
);

let changed = 0;
let ros2Dropped = 0;
const exampleId = 'ca1c5a7e952a8395c57cb2b85';
const tagCounts = new Map<string, number>();
const domainCounts = new Map<string, number>();

for (const job of snapshot.jobs) {
  const before = new Set(job.techTags.map((t: { techTag: { slug: string } }) => t.techTag.slug));
  const classification = classifier.classify({
    title: job.title,
    descriptionPlain: job.descriptionPlain,
    department: job.department,
    sourceSystem: job.sourceSystem,
    companyName: job.company?.name,
  });

  job.techTags = classification.techTags.flatMap((slug) => {
    const techTag = tagBySlug.get(slug);
    return techTag ? [{ techTag: { id: techTag.id, slug: techTag.slug, label: techTag.label } }] : [];
  });
  job.robotDomains = classification.domains.flatMap((slug) => {
    const domain = domainBySlug.get(slug);
    return domain
      ? [{ domainId: domain.id, domain: { id: domain.id, slug: domain.slug, name: domain.name } }]
      : [];
  });
  const seniority = seniorityBySlug.get(classification.seniority);
  job.seniorities = seniority
    ? [{ seniority: { id: seniority.id, slug: seniority.slug, label: seniority.label } }]
    : [];

  for (const { techTag } of job.techTags) {
    tagCounts.set(techTag.id, (tagCounts.get(techTag.id) ?? 0) + 1);
  }
  for (const { domainId } of job.robotDomains) {
    domainCounts.set(domainId, (domainCounts.get(domainId) ?? 0) + 1);
  }

  const after = new Set(job.techTags.map((t: { techTag: { slug: string } }) => t.techTag.slug));
  const same = before.size === after.size && [...before].every((slug) => after.has(slug));
  if (!same) changed += 1;
  if (before.has('ros2') && !after.has('ros2')) ros2Dropped += 1;

  if (job.id === exampleId) {
    console.log(JSON.stringify({ example: job.title, before: [...before], after: [...after] }));
  }
}

if (Array.isArray(snapshot.tags)) {
  snapshot.tags = snapshot.tags.map((tag: { id: string; openJobCount?: number }) => ({
    ...tag,
    openJobCount: tagCounts.get(tag.id) ?? 0,
  }));
}
if (Array.isArray(snapshot.domains)) {
  snapshot.domains = snapshot.domains.map((domain: { id: string; openJobCount?: number }) => ({
    ...domain,
    openJobCount: domainCounts.get(domain.id) ?? 0,
  }));
}

snapshot.generatedAt = new Date().toISOString();
writeFileSync(path, gzipSync(Buffer.from(JSON.stringify(snapshot), 'utf8')));
console.log(
  JSON.stringify({
    event: 'snapshot.reclassify',
    jobs: snapshot.jobs.length,
    changed,
    ros2Dropped,
  }),
);

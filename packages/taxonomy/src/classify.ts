import { isEntryLevelRole, isInternshipTitle } from './entry-level';
import { classifyInternshipTrack, type InternshipTrackSlug } from './internship-track';
import {
  COMPANY_DOMAIN_HINTS,
  ROBOT_DOMAIN_RULES,
  SENIORITY_RULES,
  TECH_TAG_RULES,
  type RobotDomainSlug,
  type SenioritySlug,
  type TechTagSlug,
} from './rules';

export type ClassifiableJob = {
  title: string;
  descriptionPlain: string;
  department?: string | null;
  sourceSystem?: string | null;
  companyName?: string | null;
};

export type ClassificationResult = {
  domains: RobotDomainSlug[];
  techTags: TechTagSlug[];
  seniority: SenioritySlug;
  /** Set only for internships when UG / PG / PhD is explicit in the posting. */
  internshipTrack: InternshipTrackSlug | null;
  unclear: boolean;
};

export interface Classifier {
  classify(job: ClassifiableJob): Promise<ClassificationResult> | ClassificationResult;
}

function domainHaystack(job: ClassifiableJob): string {
  return [job.title, job.descriptionPlain, job.department, job.companyName]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

/** Skills come from the posting text only — company legal names (e.g. "… plc") must not invent tags. */
function techHaystack(job: ClassifiableJob): string {
  return [job.title, job.descriptionPlain]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function includesKeyword(text: string, keyword: string): boolean {
  const needle = keyword.toLowerCase();
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s+');
  return new RegExp(`(^|[^a-z0-9+#])${escaped}([^a-z0-9+#]|$)`, 'i').test(text);
}

export function classifyDomains(job: ClassifiableJob): RobotDomainSlug[] {
  const text = domainHaystack(job);
  const matched = new Set<RobotDomainSlug>();

  for (const rule of ROBOT_DOMAIN_RULES) {
    if (rule.keywords.some((keyword) => includesKeyword(text, keyword))) {
      matched.add(rule.slug);
    }
  }

  if (matched.size === 0) {
    const company = (job.companyName ?? '').toLowerCase();
    for (const [hint, domains] of Object.entries(COMPANY_DOMAIN_HINTS)) {
      if (includesKeyword(company, hint)) {
        for (const domain of domains) matched.add(domain);
      }
    }
  }

  return [...matched];
}

export function classifyTechTags(job: ClassifiableJob): TechTagSlug[] {
  const text = techHaystack(job);
  const matched = new Set<TechTagSlug>();
  for (const rule of TECH_TAG_RULES) {
    if (rule.keywords.some((keyword) => includesKeyword(text, keyword))) {
      matched.add(rule.slug);
    }
  }
  // "ROS 2" also contains the token "ros"; prefer the more specific tag.
  if (matched.has('ros2')) matched.delete('ros1');
  return [...matched];
}

export function classifySeniority(job: ClassifiableJob): SenioritySlug {
  if (isInternshipTitle(job.title)) return 'junior';
  const title = job.title.toLowerCase();
  const ranked = SENIORITY_RULES.filter((rule) =>
    rule.keywords.some((keyword) => includesKeyword(title, keyword)),
  ).sort((a, b) => b.priority - a.priority);
  if (ranked[0]) return ranked[0].slug;
  if (isEntryLevelRole({ title: job.title })) return 'junior';
  return 'mid';
}

export class RuleBasedClassifier implements Classifier {
  classify(job: ClassifiableJob): ClassificationResult {
    const domains = classifyDomains(job);
    const techTags = classifyTechTags(job);
    const seniority = classifySeniority(job);
    const internshipTrack = classifyInternshipTrack(job);
    return {
      domains,
      techTags,
      seniority,
      internshipTrack,
      unclear: domains.length === 0,
    };
  }
}

/**
 * Placeholder for later LLM enrichment of unclear jobs.
 * Keep this interface stable so ingestion can swap implementations without rewrites.
 */
export class LlmClassifier implements Classifier {
  constructor(private readonly inner: Classifier = new RuleBasedClassifier()) {}

  async classify(job: ClassifiableJob): Promise<ClassificationResult> {
    const base = await this.inner.classify(job);
    if (!base.unclear) return base;
    // Plug in OpenAI/Anthropic here. Return the rule-based result until keys exist.
    return base;
  }

  async classifyUnclear(job: ClassifiableJob): Promise<ClassificationResult> {
    return this.classify(job);
  }
}

export const defaultClassifier = new RuleBasedClassifier();

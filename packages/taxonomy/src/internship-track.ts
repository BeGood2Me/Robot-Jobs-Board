import { isInternshipTitle } from './entry-level';

export type InternshipTrackSlug = 'ug' | 'pg' | 'phd';

function hasPhrase(text: string, phrase: string): boolean {
  const needle = phrase.toLowerCase();
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s+');
  return new RegExp(`(^|[^a-z0-9+#])${escaped}([^a-z0-9+#]|$)`, 'i').test(text);
}

const PHD_PHRASES = [
  'phd',
  'ph.d',
  'ph.d.',
  'doctoral',
  'doctorate',
  'dphil',
  'doctor of philosophy',
];

const PG_PHRASES = [
  "master's",
  'masters',
  'master of science',
  'master of engineering',
  'msc',
  'm.sc',
  'm.sc.',
  'ms student',
  'm.s. student',
  'm.s student',
  'meng',
  'm.eng',
  'm.eng.',
  'postgraduate',
  'post-graduate',
  'post graduate',
  'graduate student',
  'grad student',
];

const UG_PHRASES = [
  'undergraduate',
  'undergrad',
  'under-grad',
  "bachelor's",
  'bachelors',
  'bachelor of',
  'b.s.',
  'b.s',
  'b.a.',
  'b.a',
  'bs/ms', // often undergrad dual — treat as ug-facing when on intern posts
  'sophomore',
  'college student',
  'uni student',
  'university student',
  'pursuing a bachelor',
  'bachelor student',
];

export const INTERNSHIP_TRACK_LABELS: Record<InternshipTrackSlug, string> = {
  ug: 'Undergraduate',
  pg: "Master's / postgraduate",
  phd: 'PhD',
};

/**
 * Who an internship is aimed at (UG / PG / PhD).
 * Returns null when the posting is not an internship, or the level is not explicit.
 */
export function classifyInternshipTrack(job: {
  title: string;
  descriptionPlain?: string | null;
  employmentType?: string | null;
}): InternshipTrackSlug | null {
  const isIntern =
    job.employmentType === 'INTERN' || isInternshipTitle(job.title);
  if (!isIntern) return null;

  const text = [job.title, job.descriptionPlain ?? '']
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .replace(/[\u2018\u2019\u201a\u2032]/g, "'");

  if (PHD_PHRASES.some((phrase) => hasPhrase(text, phrase))) return 'phd';
  if (PG_PHRASES.some((phrase) => hasPhrase(text, phrase))) return 'pg';
  if (UG_PHRASES.some((phrase) => hasPhrase(text, phrase))) return 'ug';
  return null;
}

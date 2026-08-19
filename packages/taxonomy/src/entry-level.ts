function hasPhrase(text: string, phrase: string): boolean {
  const needle = phrase.toLowerCase();
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s+');
  return new RegExp(`(^|[^a-z0-9+#])${escaped}([^a-z0-9+#]|$)`, 'i').test(text);
}

const INTERNSHIP_PHRASES = ['internship', 'intern', 'interns', 'co-op', 'coop', 'apprentice'];

const EARLY_CAREER_PHRASES = [
  'junior',
  'new grad',
  'new-grad',
  'newgrad',
  'new graduate',
  'entry level',
  'entry-level',
  'early career',
  'early-career',
  'associate engineer',
  'associate software',
  'associate robotics',
  'graduate engineer',
  'recent graduate',
  'campus hire',
  'university hire',
  'university graduate',
];

const EXPERIENCED_PHRASES = [
  'senior',
  'sr.',
  'staff',
  'principal',
  'director',
  'manager',
  'head of',
  'vice president',
  'chief',
  'distinguished',
  'fellow',
  'lead',
];

export function isInternshipTitle(title: string): boolean {
  const value = title.toLowerCase();
  if (hasPhrase(value, 'international') && !hasPhrase(value, 'intern') && !hasPhrase(value, 'internship')) {
    return false;
  }
  if (hasPhrase(value, 'internal') && !hasPhrase(value, 'intern') && !hasPhrase(value, 'internship')) {
    return false;
  }
  return INTERNSHIP_PHRASES.some((phrase) => hasPhrase(value, phrase));
}

export function isExperiencedTitle(title: string): boolean {
  return EXPERIENCED_PHRASES.some((phrase) => hasPhrase(title, phrase));
}

export function isEntryLevelRole(job: { title: string; employmentType?: string | null }): boolean {
  if (isInternshipTitle(job.title)) return true;
  if (isExperiencedTitle(job.title)) return false;
  if (job.employmentType === 'INTERN') return true;
  return EARLY_CAREER_PHRASES.some((phrase) => hasPhrase(job.title, phrase));
}

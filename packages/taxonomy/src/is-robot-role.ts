import type { ClassifiableJob } from './classify';

const CORPORATE_TITLE =
  /\b(?:fp&a|fpa|finance|financial analyst|financial controller|corporate controller|accountant|accounting|payroll|treasur(?:y|er)|auditor|recruiter|recruiting|talent acquisition|talent sourcer|sourcer|people operations|people partner|human resources|hrbp|hr partner|general counsel|legal counsel|attorney|paralegal|marketing|communications|copywriter|social media|public relations|investor relations|office manager|executive assistant|administrative assistant|facilities|workplace|receptionist|account executive|sales development|sales manager|sales representative|business development|customer success|brand manager|graphic design|contracts manager|project controls|costing|campus recruiter|recruiting coordinator|learning and development|l&d\b|benefits partner|real estate|property manager)\b/i;

const CORPORATE_DEPARTMENT =
  /^(?:finance|accounting|legal|marketing|people|human resources|hr|communications|brand|facilities|workplace|recruiting|talent|talent acquisition|g&a|sales|people operations)(?:\s|$|,)/i;

/** Passes a broad "engineer/manager" check but is not robotics/engineering product work. */
const ENTERPRISE_IT_OR_OPS_TITLE =
  /\b(?:salesforce|servicenow|workday|\berp\b|\bcrm\b|oracle cloud|growth platform|help desk|desktop support|it hardware procurement|technical program manager,\s*it|product manager,\s*growth|buyer\b|commodity (?:engineer|manager)|product sourcing|process sourcing|supplier industrialization|supplier engineer|procurement engineer|faa compliance)\b/i;

const NOT_A_JOB =
  /\b(?:register your interest|talent community|join our talent|expression of interest|future opportunities|pipeline)\b/i;

const ROBOT_OR_TECHNICAL_TITLE =
  /\b(?:engineer|engineering|technician|technologist|roboticist|scientist|researcher|developer|programmer|robotics|autonomy|autonomous|humanoid|drone|uav|uas|perception|localization|mechatronic|firmware|embedded|mechanical|electrical|hardware|software|machine learning|computer vision|motion planning|manipulation|locomotion|controls engineer|operator|pilot|welder|machinist|assembler|manufacturing|npi|reliability|safety engineer|systems engineer|architect|product manager|program manager|technical program|robot)\b/i;

const EARLY_CAREER_TITLE =
  /\b(?:intern|internship|co-op|coop|new grad|new-grad|newgraduate|early career|early-career|university|campus|emerging talent|graduate programme|graduate program)\b|\b20(?:2[6-9]|3[0-9])\b/i;

const ROBOTICS_CORE_TITLE =
  /\b(?:robot|robotics|autonom(?:y|ous)|perception|humanoid|drone|uav|uas|gnc|mechatron(?:ic|ics)?|embedded|firmware|avionics|flight software|mission autonom|lattice|computer vision|machine learning|ml|localization|motion planning|manipulation|ros|controls|guidance|navigation|sensor fusion|slam|deviceos|arsenalos)\b/i;

export function isRobotRole(job: Pick<ClassifiableJob, 'title' | 'department'>): boolean {
  const title = job.title ?? '';
  const department = job.department ?? '';
  if (!title.trim() || NOT_A_JOB.test(title)) return false;
  if (CORPORATE_TITLE.test(title) || CORPORATE_DEPARTMENT.test(department.trim())) return false;
  if (ENTERPRISE_IT_OR_OPS_TITLE.test(title)) return false;
  return ROBOT_OR_TECHNICAL_TITLE.test(title);
}

/** Prefer interns/new grads and robotics-core titles when a company exceeds the board cap. */
export function boardRelevanceScore(job: { title: string; postedAt?: Date | string | null }): number {
  const title = job.title ?? '';
  let score = 0;
  if (EARLY_CAREER_TITLE.test(title)) score += 100;
  if (ROBOTICS_CORE_TITLE.test(title)) score += 50;
  if (/\b(?:software|firmware|embedded|hardware|mechanical|electrical|systems|perception|controls|gnc)\b/i.test(title)) {
    score += 15;
  }
  const postedAt = job.postedAt;
  const posted = postedAt ? new Date(postedAt).getTime() : 0;
  if (posted > 0) {
    // Up to ~10 points for roles posted in the last ~100 days.
    const ageDays = Math.max(0, (Date.now() - posted) / 86_400_000);
    score += Math.max(0, 10 - ageDays / 10);
  }
  return score;
}

export const MAX_JOBS_PER_COMPANY = 200;

export function capJobsPerCompany<T extends { title: string; postedAt?: Date | string | null }>(
  jobs: T[],
  limit = MAX_JOBS_PER_COMPANY,
): T[] {
  if (jobs.length <= limit) return jobs;
  return [...jobs]
    .sort((a, b) => {
      const scoreDelta = boardRelevanceScore(b) - boardRelevanceScore(a);
      if (scoreDelta !== 0) return scoreDelta;
      const aPosted = a.postedAt;
      const bPosted = b.postedAt;
      const aTime = aPosted ? new Date(aPosted).getTime() : 0;
      const bTime = bPosted ? new Date(bPosted).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, limit);
}

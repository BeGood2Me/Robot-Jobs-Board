import type { ClassifiableJob } from './classify';

const CORPORATE_TITLE =
  /\b(?:fp&a|fpa|finance|financial analyst|financial controller|corporate controller|accountant|accounting|payroll|treasur(?:y|er)|auditor|recruiter|recruiting|talent acquisition|talent sourcer|sourcer|people operations|people partner|human resources|hrbp|hr partner|general counsel|legal counsel|attorney|paralegal|marketing|communications|copywriter|social media|public relations|investor relations|office manager|executive assistant|administrative assistant|facilities|workplace|receptionist|account executive|sales development|sales manager|sales representative|business development|customer success|brand manager|graphic design|contracts manager|project controls|costing|campus recruiter|recruiting coordinator)\b/i;

const CORPORATE_DEPARTMENT =
  /^(?:finance|accounting|legal|marketing|people|human resources|hr|communications|brand|facilities|workplace|recruiting|talent|talent acquisition|g&a|sales|people operations)(?:\s|$|,)/i;

const NOT_A_JOB =
  /\b(?:register your interest|talent community|join our talent|expression of interest|future opportunities|pipeline)\b/i;

const ROBOT_OR_TECHNICAL_TITLE =
  /\b(?:engineer|engineering|technician|technologist|roboticist|scientist|researcher|developer|programmer|robotics|autonomy|autonomous|humanoid|drone|uav|uas|perception|localization|mechatronic|firmware|embedded|mechanical|electrical|hardware|software|machine learning|computer vision|motion planning|manipulation|locomotion|controls engineer|operator|pilot|welder|machinist|assembler|manufacturing|npi|reliability|safety engineer|systems engineer|architect|product manager|program manager|technical program|robot)\b/i;

export function isRobotRole(job: Pick<ClassifiableJob, 'title' | 'department'>): boolean {
  const title = job.title ?? '';
  const department = job.department ?? '';
  if (!title.trim() || NOT_A_JOB.test(title)) return false;
  if (CORPORATE_TITLE.test(title) || CORPORATE_DEPARTMENT.test(department.trim())) return false;
  return ROBOT_OR_TECHNICAL_TITLE.test(title);
}

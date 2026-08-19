export type SourceSystemName = 'greenhouse' | 'lever' | 'ashby' | 'joblistingsapi' | 'workday' | 'workable';

export type NormalizedWorkplace = 'ONSITE' | 'REMOTE' | 'HYBRID';
export type NormalizedEmployment =
  | 'FULL_TIME'
  | 'PART_TIME'
  | 'CONTRACT'
  | 'INTERN'
  | 'TEMPORARY';

export type NormalizedJob = {
  externalId: string;
  sourceSystem: SourceSystemName;
  title: string;
  descriptionHtml: string;
  descriptionPlain: string;
  url: string;
  locationRaw: string;
  country: string | null;
  region: string | null;
  city: string | null;
  isRemote: boolean;
  workplaceType: NormalizedWorkplace;
  employmentType: NormalizedEmployment;
  department: string | null;
  compensationText: string | null;
  postedAt: Date | null;
  companyName?: string | null;
};

export type FeedConfigJson = {
  boardToken?: string;
  site?: string;
  jobBoardName?: string;
  sourceFilter?: string;
  host?: string;
  tenant?: string;
};

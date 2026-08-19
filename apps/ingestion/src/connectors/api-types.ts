export type AshbyCompensation = {
  compensationTierSummary?: string | null;
  summary?: string | null;
};

export type AshbyJob = {
  id: string;
  title?: string;
  department?: string | null;
  departmentName?: string | null;
  team?: string | null;
  teamName?: string | null;
  employmentType?: string | null;
  location?: string | null;
  locationName?: string | null;
  locationIsRemote?: boolean | null;
  isRemote?: boolean | null;
  workplaceType?: string | null;
  jobUrl?: string | null;
  applyUrl?: string | null;
  descriptionHtml?: string | null;
  descriptionPlain?: string | null;
  descriptionText?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  compensation?: AshbyCompensation | null;
  compensationTierSummary?: string | null;
  address?: {
    postalAddress?: {
      addressRegion?: string | null;
      addressCountry?: string | null;
      addressLocality?: string | null;
    } | null;
  } | null;
};

export type AshbyJobBoardResponse = {
  jobs?: AshbyJob[];
  jobPostings?: AshbyJob[];
};

export type GreenhouseOffice = { name?: string | null };
export type GreenhouseDepartment = { name?: string | null };

export type GreenhouseJob = {
  id: number | string;
  title?: string;
  absolute_url?: string;
  first_published?: string | null;
  updated_at?: string | null;
  location?: { name?: string | null } | null;
  offices?: GreenhouseOffice[] | null;
  departments?: GreenhouseDepartment[] | null;
  content?: string | null;
  metadata?: unknown;
};

export type GreenhouseListResponse = {
  jobs?: GreenhouseJob[];
};

export type LeverCategories = {
  location?: string | null;
  department?: string | null;
  team?: string | null;
  commitment?: string | null;
  workplaceType?: string | null;
};

export type LeverPosting = {
  id: string;
  text?: string;
  description?: string | null;
  descriptionPlain?: string | null;
  additional?: string | null;
  additionalPlain?: string | null;
  hostedUrl?: string | null;
  applyUrl?: string | null;
  createdAt?: number | string | null;
  categories?: LeverCategories | null;
  workplaceType?: string | null;
};

export type AggregatorJob = {
  id: string;
  source?: string;
  title?: string;
  description_html?: string | null;
  description_plain?: string | null;
  url?: string | null;
  location?: string | null;
  remote?: boolean;
  employment_type?: string | null;
  department?: string | null;
  company_name?: string | null;
  published_at?: string | null;
  updated_at?: string | null;
};

export type AggregatorResponse = {
  jobs?: AggregatorJob[];
  data?: AggregatorJob[];
  results?: AggregatorJob[];
  next_cursor?: string | null;
};

export type WorkdayJobListItem = {
  title?: string;
  externalPath: string;
  locationsText?: string | null;
  bulletFields?: string[] | null;
};

export type WorkdayJobsResponse = {
  total?: number;
  jobPostings?: WorkdayJobListItem[];
};

export type WorkdayJobDetail = {
  jobPostingInfo?: {
    id?: string;
    title?: string;
    jobDescription?: string | null;
    location?: string | null;
    postedOn?: string | null;
    startDate?: string | null;
    timeType?: string | null;
    jobReqId?: string | null;
    country?: string | null;
    externalUrl?: string | null;
    jobRequisitionLocation?: {
      descriptor?: string | null;
      country?: { descriptor?: string | null; alpha2Code?: string | null } | null;
    } | null;
  } | null;
};

export type WorkableLocation = {
  city?: string | null;
  region?: string | null;
  state?: string | null;
  country?: string | null;
  countryCode?: string | null;
};

export type WorkableWidgetJob = {
  title?: string;
  shortcode: string;
  employment_type?: string | null;
  telecommuting?: boolean | null;
  department?: string | null;
  url?: string | null;
  application_url?: string | null;
  published_on?: string | null;
  created_at?: string | null;
  country?: string | null;
  city?: string | null;
  state?: string | null;
  locations?: WorkableLocation[] | null;
};

export type WorkableWidgetResponse = {
  name?: string;
  jobs?: WorkableWidgetJob[];
};

export type WorkableJobDetail = {
  shortcode?: string;
  title?: string;
  remote?: boolean | null;
  type?: string | null;
  published?: string | null;
  department?: string | string[] | null;
  description?: string | null;
  requirements?: string | null;
  benefits?: string | null;
  location?: {
    country?: string | null;
    countryCode?: string | null;
    region?: string | null;
    city?: string | null;
    display?: string | null;
  } | null;
};

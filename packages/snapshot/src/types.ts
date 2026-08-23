export type SnapshotCompany = {
  id: string;
  name: string;
  slug: string;
  website: string | null;
  logoUrl: string | null;
  description: string;
  seoIntro: string | null;
  openJobCount: number;
};

export type SnapshotDomain = {
  id: string;
  slug: string;
  name: string;
  description: string;
  openJobCount: number;
};

export type SnapshotTag = {
  id: string;
  slug: string;
  label: string;
  openJobCount: number;
};

export type SnapshotSeniority = {
  id: string;
  slug: string;
  label: string;
};

export type SnapshotJob = {
  id: string;
  slug: string;
  title: string;
  descriptionHtml: string;
  descriptionPlain: string;
  url: string;
  locationRaw: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  isRemote: boolean;
  workplaceType: string;
  employmentType: string;
  department: string | null;
  compensationText: string | null;
  postedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  isHidden: boolean;
  isActive: boolean;
  sourceSystem: string;
  externalId: string;
  companyId: string;
  company: {
    name: string;
    slug: string;
    website: string | null;
    logoUrl: string | null;
    sourceIdentifier: string | null;
  };
  robotDomains: Array<{ domainId: string; domain: { id: string; slug: string; name: string } }>;
  techTags: Array<{ techTag: { id: string; slug: string; label: string } }>;
  seniorities: Array<{ seniority: { id: string; slug: string; label: string } }>;
};

export type PublicBoardSnapshot = {
  version: 1;
  generatedAt: string;
  siteUrl: string;
  jobs: SnapshotJob[];
  companies: SnapshotCompany[];
  domains: SnapshotDomain[];
  tags: SnapshotTag[];
  seniorities: SnapshotSeniority[];
  countryFacets: Array<{ country: string; count: number }>;
  places: {
    cities: string[];
    countries: string[];
    regions: string[];
  };
};

export type ListingFilter =
  | { kind: 'remote' }
  | { kind: 'city'; value: string }
  | { kind: 'region'; value: string }
  | { kind: 'country'; value: string }
  | { kind: 'domain'; domainId: string }
  | { kind: 'tag'; tagId: string }
  | { kind: 'and'; filters: ListingFilter[] }
  | { kind: 'or'; filters: ListingFilter[] };

export type JobFilters = {
  q?: string;
  page?: number;
  sort?: 'newest' | 'relevance';
  domains?: string[];
  tags?: string[];
  seniorities?: string[];
  countries?: string[];
  region?: string;
  city?: string;
  workplaces?: string[];
  employments?: string[];
  entryLevel?: boolean;
  remote?: boolean;
};

export const SNAPSHOT_DIR = 'public/snapshot';
export const SNAPSHOT_BOARD_FILE = 'board.json.gz';

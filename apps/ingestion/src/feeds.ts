import { loadEnv } from '@robot-jobs-board/config';
import type { SourceSystem } from '@robot-jobs-board/db';
import { fetchAggregatorJobs } from './connectors/aggregator';
import { fetchAshbyJobs } from './connectors/ashby';
import { fetchGreenhouseJobs } from './connectors/greenhouse';
import { fetchJobShopJobs } from './connectors/jobshop';
import { fetchLeverJobs } from './connectors/lever';
import { fetchWorkableJobs } from './connectors/workable';
import { fetchWorkdayJobs } from './connectors/workday';
import type { FeedConfigJson, NormalizedJob } from './types';

/** Optional feed config.keyword — keep jobs whose title/department match any | -separated needle. */
export function matchesFeedKeyword(
  job: Pick<NormalizedJob, 'title' | 'department'>,
  config: FeedConfigJson | Record<string, string>,
): boolean {
  const raw = 'keyword' in config ? config.keyword : undefined;
  if (!raw?.trim()) return true;
  const hay = `${job.title}\n${job.department ?? ''}`.toLowerCase();
  return raw
    .toLowerCase()
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean)
    .some((needle) => hay.includes(needle));
}

export async function jobsForFeed(sourceSystem: SourceSystem, config: FeedConfigJson): Promise<NormalizedJob[]> {
  let jobs: NormalizedJob[];
  switch (sourceSystem) {
    case 'ashby': {
      const name = config.jobBoardName ?? config.site ?? config.boardToken;
      if (!name) throw new Error('Ashby feed missing jobBoardName');
      jobs = await fetchAshbyJobs(name);
      break;
    }
    case 'greenhouse': {
      const token = config.boardToken ?? config.site;
      if (!token) throw new Error('Greenhouse feed missing boardToken');
      jobs = await fetchGreenhouseJobs(token);
      break;
    }
    case 'lever': {
      const site = config.site ?? config.boardToken;
      if (!site) throw new Error('Lever feed missing site');
      jobs = await fetchLeverJobs(site);
      break;
    }
    case 'workday': {
      const host = config.host;
      const tenant = config.tenant;
      const site = config.site ?? config.boardToken;
      if (!host || !tenant || !site) throw new Error('Workday feed missing host, tenant, or site');
      jobs = await fetchWorkdayJobs({ host, tenant, site });
      break;
    }
    case 'workable': {
      const account = config.site ?? config.boardToken ?? config.jobBoardName;
      if (!account) throw new Error('Workable feed missing site');
      jobs = await fetchWorkableJobs(account);
      break;
    }
    case 'jobshop': {
      const site = config.site ?? config.host;
      if (!site) throw new Error('JobShop feed missing site');
      jobs = await fetchJobShopJobs({ site });
      break;
    }
    case 'joblistingsapi': {
      const env = loadEnv();
      jobs = await fetchAggregatorJobs({
        apiKey: env.JOB_LISTINGS_API_KEY,
        baseUrl: env.JOB_LISTINGS_API_BASE_URL,
        sourceFilter: config.sourceFilter,
      });
      break;
    }
    default:
      throw new Error(`Unsupported source ${sourceSystem}`);
  }
  return jobs.filter((job) => matchesFeedKeyword(job, config));
}

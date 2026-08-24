import { loadEnv } from '@robot-jobs-board/config';
import type { SourceSystem } from '@robot-jobs-board/db';
import { fetchAggregatorJobs } from './connectors/aggregator';
import { fetchAshbyJobs } from './connectors/ashby';
import { fetchGreenhouseJobs } from './connectors/greenhouse';
import { fetchLeverJobs } from './connectors/lever';
import { fetchWorkableJobs } from './connectors/workable';
import { fetchWorkdayJobs } from './connectors/workday';
import type { FeedConfigJson, NormalizedJob } from './types';

export async function jobsForFeed(sourceSystem: SourceSystem, config: FeedConfigJson): Promise<NormalizedJob[]> {
  const env = loadEnv();
  switch (sourceSystem) {
    case 'ashby': {
      const name = config.jobBoardName ?? config.site ?? config.boardToken;
      if (!name) throw new Error('Ashby feed missing jobBoardName');
      return fetchAshbyJobs(name);
    }
    case 'greenhouse': {
      const token = config.boardToken ?? config.site;
      if (!token) throw new Error('Greenhouse feed missing boardToken');
      return fetchGreenhouseJobs(token);
    }
    case 'lever': {
      const site = config.site ?? config.boardToken;
      if (!site) throw new Error('Lever feed missing site');
      return fetchLeverJobs(site);
    }
    case 'workday': {
      const host = config.host;
      const tenant = config.tenant;
      const site = config.site ?? config.boardToken;
      if (!host || !tenant || !site) throw new Error('Workday feed missing host, tenant, or site');
      return fetchWorkdayJobs({ host, tenant, site });
    }
    case 'workable': {
      const account = config.site ?? config.boardToken ?? config.jobBoardName;
      if (!account) throw new Error('Workable feed missing site');
      return fetchWorkableJobs(account);
    }
    case 'joblistingsapi':
      return fetchAggregatorJobs({
        apiKey: env.JOB_LISTINGS_API_KEY,
        baseUrl: env.JOB_LISTINGS_API_BASE_URL,
        sourceFilter: config.sourceFilter,
      });
    default:
      throw new Error(`Unsupported source ${sourceSystem}`);
  }
}

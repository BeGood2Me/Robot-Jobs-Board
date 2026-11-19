type AggregateRow = Record<string, string | number | undefined>;

type VercelAggregateResponse = {
  data: AggregateRow[];
  query?: Record<string, unknown>;
};

function vercelProjectId(): string {
  return process.env.VERCEL_PROJECT_ID?.trim() || 'robot-jobs-board';
}

function vercelTeamQuery(): string {
  const teamId = process.env.VERCEL_TEAM_ID?.trim();
  return teamId ? `&teamId=${encodeURIComponent(teamId)}` : '';
}

async function vercelAnalyticsGet(pathWithQuery: string): Promise<VercelAggregateResponse | null> {
  const token = process.env.VERCEL_ACCESS_TOKEN?.trim();
  if (!token) return null;

  const res = await fetch(`https://api.vercel.com${pathWithQuery}`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;
  return (await res.json()) as VercelAggregateResponse;
}

export type JobListingStatsRow = {
  jobId: string;
  applyClicks: number;
  applyVisitors: number;
  jobViewEvents: number;
  jobViewVisitors: number;
  pageVisitors: number;
  pageViews: number;
};

export type JobListingStatsReport = {
  since: string;
  until: string;
  applyByJob: JobListingStatsRow[];
  configured: boolean;
};

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

/** Production Web Analytics aggregates (requires VERCEL_ACCESS_TOKEN on the server). */
export async function fetchJobListingStats(days = 30): Promise<JobListingStatsReport> {
  const until = new Date().toISOString();
  const since = isoDaysAgo(days);
  const projectId = encodeURIComponent(vercelProjectId());
  const team = vercelTeamQuery();

  const apply = await vercelAnalyticsGet(
    `/v1/query/web-analytics/events/aggregate?projectId=${projectId}&by=eventData/jobId&filter=${encodeURIComponent(
      "eventName eq 'Apply Click'",
    )}&since=${encodeURIComponent(since)}&until=${encodeURIComponent(until)}&limit=100${team}`,
  );

  const jobViews = await vercelAnalyticsGet(
    `/v1/query/web-analytics/events/aggregate?projectId=${projectId}&by=eventData/jobId&filter=${encodeURIComponent(
      "eventName eq 'Job View'",
    )}&since=${encodeURIComponent(since)}&until=${encodeURIComponent(until)}&limit=100${team}`,
  );

  const views = await vercelAnalyticsGet(
    `/v1/query/web-analytics/visits/aggregate?projectId=${projectId}&by=requestPath&filter=${encodeURIComponent(
      "startswith(requestPath,'/jobs/')",
    )}&since=${encodeURIComponent(since)}&until=${encodeURIComponent(until)}&limit=100${team}`,
  );

  const jobViewByJobId = new Map<string, { visitors: number; count: number }>();
  for (const row of jobViews?.data ?? []) {
    const jobId = String(row['eventData/jobId'] ?? '');
    if (!jobId || jobId === 'Others') continue;
    jobViewByJobId.set(jobId, {
      visitors: Number(row.visitors ?? 0),
      count: Number(row.count ?? 0),
    });
  }

  const viewByJobId = new Map<string, { visitors: number; pageviews: number }>();
  for (const row of views?.data ?? []) {
    const path = String(row.requestPath ?? '');
    if (path === 'Others') continue;
    const m = path.match(/^\/jobs\/([^/]+)\//);
    if (!m) continue;
    const jobId = m[1];
    viewByJobId.set(jobId, {
      visitors: Number(row.visitors ?? 0),
      pageviews: Number(row.pageviews ?? 0),
    });
  }

  const jobIds = new Set<string>();
  for (const row of apply?.data ?? []) {
    const jobId = String(row['eventData/jobId'] ?? '');
    if (jobId && jobId !== 'Others') jobIds.add(jobId);
  }
  for (const jobId of jobViewByJobId.keys()) jobIds.add(jobId);

  const applyByJob: JobListingStatsRow[] = [];
  for (const jobId of jobIds) {
    const applyRow = apply?.data?.find((row) => String(row['eventData/jobId'] ?? '') === jobId);
    const viewsForJob = viewByJobId.get(jobId);
    const jobViewRow = jobViewByJobId.get(jobId);
    applyByJob.push({
      jobId,
      applyClicks: Number(applyRow?.count ?? 0),
      applyVisitors: Number(applyRow?.visitors ?? 0),
      jobViewEvents: jobViewRow?.count ?? 0,
      jobViewVisitors: jobViewRow?.visitors ?? 0,
      pageVisitors: viewsForJob?.visitors ?? 0,
      pageViews: viewsForJob?.pageviews ?? 0,
    });
  }

  applyByJob.sort((a, b) => b.jobViewEvents - a.jobViewEvents || b.applyClicks - a.applyClicks);

  return {
    since,
    until,
    applyByJob,
    configured: Boolean(process.env.VERCEL_ACCESS_TOKEN?.trim()),
  };
}
#!/usr/bin/env node
/**
 * Last 30 days: apply clicks + page visitors per job (Vercel Web Analytics).
 * Requires: `cd apps/web` linked project + `vercel login` (uses CLI token).
 */
import { execSync } from 'node:child_process';

const days = Number(process.env.STATS_DAYS ?? 30);
const since = new Date();
since.setUTCDate(since.getUTCDate() - days);
since.setUTCHours(0, 0, 0, 0);
const until = new Date();

function api(path) {
  const raw = execSync(`npx vercel api "${path}" --method GET`, {
    cwd: 'apps/web',
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
  });
  return JSON.parse(raw);
}

const sinceIso = since.toISOString();
const untilIso = until.toISOString();
const enc = (s) => encodeURIComponent(s);

const apply = api(
  `/v1/query/web-analytics/events/aggregate?projectId=robot-jobs-board&by=eventData/jobId&filter=${enc(
    "eventName eq 'Apply Click'",
  )}&since=${enc(sinceIso)}&until=${enc(untilIso)}&limit=50`,
);

const views = api(
  `/v1/query/web-analytics/visits/aggregate?projectId=robot-jobs-board&by=requestPath&filter=${enc(
    "startswith(requestPath,'/jobs/')",
  )}&since=${enc(sinceIso)}&until=${enc(untilIso)}&limit=50`,
);

const viewById = new Map();
for (const row of views.data ?? []) {
  if (row.requestPath === 'Others') continue;
  const m = String(row.requestPath).match(/^\/jobs\/([^/]+)\//);
  if (m) viewById.set(m[1], { visitors: row.visitors, pageviews: row.pageviews });
}

console.log(`Apply clicks by jobId (${sinceIso.slice(0, 10)} → ${untilIso.slice(0, 10)})\n`);
for (const row of apply.data ?? []) {
  const jobId = row['eventData/jobId'];
  if (!jobId || jobId === 'Others') continue;
  const v = viewById.get(jobId);
  console.log(
    `${String(row.count).padStart(4)} clicks · ${String(row.visitors).padStart(3)} visitors · ${jobId}` +
      (v ? ` · ${v.visitors} page visitors` : ''),
  );
}
import type { SnapshotJob } from '@robot-jobs-board/snapshot';
import { PUBLIC_REVALIDATE_SECONDS } from '@/lib/site';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function itemPubDate(postedAt: string | null): string {
  const date = postedAt ? new Date(postedAt) : new Date();
  return Number.isNaN(date.getTime()) ? new Date().toUTCString() : date.toUTCString();
}

export function buildRssFeedXml(options: {
  channelTitle: string;
  channelDescription: string;
  channelPageUrl: string;
  feedUrl: string;
  siteUrl: string;
  jobs: SnapshotJob[];
  lastBuild?: string;
}): string {
  const { channelTitle, channelDescription, channelPageUrl, feedUrl, siteUrl, jobs, lastBuild } = options;
  const build = lastBuild ? new Date(lastBuild) : new Date();
  const buildStr = Number.isNaN(build.getTime()) ? new Date().toUTCString() : build.toUTCString();

  const items = jobs
    .map((job) => {
      const jobUrl = `${siteUrl}/jobs/${job.id}/${job.slug}`;
      const extras = [job.compensationText, job.city, job.country].filter(Boolean).join(' · ');
      const description = extras
        ? `${job.company.name} — ${extras}. Apply via Robot Jobs Board.`
        : `${job.company.name}. Apply via Robot Jobs Board.`;
      return `    <item>
      <title>${escapeXml(`${job.title} — ${job.company.name}`)}</title>
      <link>${escapeXml(jobUrl)}</link>
      <guid isPermaLink="true">${escapeXml(jobUrl)}</guid>
      <pubDate>${itemPubDate(job.postedAt)}</pubDate>
      <description>${escapeXml(description)}</description>
    </item>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(channelTitle)}</title>
    <link>${escapeXml(channelPageUrl)}</link>
    <description>${escapeXml(channelDescription)}</description>
    <language>en-us</language>
    <lastBuildDate>${buildStr}</lastBuildDate>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;
}

export function rssResponseHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/rss+xml; charset=utf-8',
    'Cache-Control': `public, s-maxage=${PUBLIC_REVALIDATE_SECONDS}, stale-while-revalidate=86400`,
    'X-Robots-Tag': 'noindex, nofollow',
  };
}

export function buildEmptyRssFeedXml(options: {
  channelTitle: string;
  channelDescription: string;
  channelPageUrl: string;
  feedUrl: string;
  siteUrl: string;
}): string {
  return buildRssFeedXml({
    ...options,
    jobs: [],
    lastBuild: new Date().toISOString(),
  });
}
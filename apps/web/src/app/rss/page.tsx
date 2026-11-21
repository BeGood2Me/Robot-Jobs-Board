import type { Metadata } from 'next';
import Link from 'next/link';
import { listPublicFeeds, type FeedDescriptor } from '@/lib/rss/registry';
import { getSiteUrl } from '@/lib/site';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'RSS feeds',
  description:
    'Subscribe to robotics job RSS feeds — full board, robot types, locations, and company channels. Snapshot-backed; no account required.',
  alternates: { canonical: '/rss' },
};

function FeedSection({ title, feeds, site }: { title: string; feeds: FeedDescriptor[]; site: string }) {
  if (!feeds.length) return null;
  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold">{title}</h2>
      <ul className="mt-4 space-y-2 text-sm">
        {feeds.map((feed) => (
          <li key={feed.feedPath} className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
            <a href={feed.feedPath} className="font-medium underline hover:text-accent">
              {feed.title.replace(/ — Robot Jobs Board$/, '')}
            </a>
            <span className="font-mono text-xs text-muted">
              {site}
              {feed.feedPath}
            </span>
            <span className="text-xs text-muted">
              {feed.jobCount} job{feed.jobCount === 1 ? '' : 's'} ·{' '}
              <Link href={feed.pagePath} className="underline">
                view hub
              </Link>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function RssIndexPage() {
  const feeds = (await listPublicFeeds()) ?? [];
  const site = getSiteUrl();

  const board = feeds.filter((f) => f.group === 'board');
  const robots = feeds.filter((f) => f.group === 'robots');
  const locations = feeds.filter((f) => f.group === 'locations');
  const companies = feeds.filter((f) => f.group === 'companies');

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="text-4xl font-semibold">RSS feeds</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Subscribe in Feedly, Slack, or any RSS reader. Every feed is built from the public job snapshot — the same daily
        export that powers the board — not from the paid-feature database.
      </p>
      {!feeds.length ? (
        <p className="mt-8 text-muted">Feeds are unavailable until the local or CDN snapshot is present.</p>
      ) : (
        <>
          <FeedSection title="Full board" feeds={board} site={site} />
          <FeedSection title="Robot type" feeds={robots} site={site} />
          <FeedSection title="Locations" feeds={locations} site={site} />
          <FeedSection title="Companies" feeds={companies} site={site} />
        </>
      )}
      <p className="mt-12 text-sm text-muted">
        Main feed:{' '}
        <a href="/robotics-jobs.rss" className="underline">
          robotics-jobs.rss
        </a>
      </p>
    </div>
  );
}
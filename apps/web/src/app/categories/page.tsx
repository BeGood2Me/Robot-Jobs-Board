import type { Metadata } from 'next';
import Link from 'next/link';
import { loadPublicSnapshot } from '@/lib/snapshot/load';
import { domainStaticParams, placeStaticParams } from '@/lib/snapshot/static-params';
import type { ListingFilter } from '@robot-jobs-board/snapshot';
import { domainCopy, getDomainBySlug, loadListing, locationPageCopy, resolvePlace } from '@/lib/programmatic';
import { listPublicFeeds } from '@/lib/rss/registry';
import { INDEX_JOB_THRESHOLD, getSiteUrl } from '@/lib/site';

export const revalidate = 86400;

const FEATURED_LOCATION_PLACES = [
  'united-states-robotics-jobs',
  'remote-robotics-jobs',
  'united-kingdom-robotics-jobs',
  'canada-robotics-jobs',
  'california-robotics-jobs',
  'san-francisco-robotics-jobs',
  'boston-robotics-jobs',
  'austin-robotics-jobs',
] as const;

export const metadata: Metadata = {
  title: 'Robotics job categories',
  description:
    'Browse robotics jobs by robot type and location — AMR, humanoids, drones, US, UK, remote, and more on Robot Jobs Board.',
  alternates: { canonical: '/categories' },
};

async function domainHubRows() {
  const params = domainStaticParams();
  const rows: Array<{ href: string; label: string; count: number; blurb: string }> = [];

  for (const { slug } of params) {
    const domainSlug = slug.replace(/-jobs$/, '');
    const domain = await getDomainBySlug(domainSlug);
    if (!domain) continue;
    const filter: ListingFilter = { kind: 'domain', domainId: domain.id };
    const listing = await loadListing(filter, `categories-domain-${domain.id}`);
    if (listing.total < INDEX_JOB_THRESHOLD) continue;
    const copy = domainCopy(domain.slug, domain.name, domain.description, listing.total);
    rows.push({
      href: `/robots/${slug}`,
      label: copy.h1,
      count: listing.total,
      blurb: domain.description,
    });
  }

  return rows.sort((a, b) => b.count - a.count);
}

async function locationHubRows() {
  const placeSet = new Set(placeStaticParams().map((row) => row.place));
  const rows: Array<{ href: string; label: string; count: number }> = [];

  for (const place of FEATURED_LOCATION_PLACES) {
    if (!placeSet.has(place)) continue;
    const core = place.replace(/-robotics-jobs$/, '');
    const resolved = await resolvePlace(core);
    if (!resolved) continue;
    const listing = await loadListing(resolved.filter, `categories-place-${core}`);
    if (listing.total < INDEX_JOB_THRESHOLD) continue;
    const copy = locationPageCopy(core, resolved.label, listing.total);
    rows.push({ href: `/locations/${place}`, label: copy.h1, count: listing.total });
  }

  return rows;
}

export default async function CategoriesPage() {
  const [domains, locations, feedList] = await Promise.all([
    domainHubRows(),
    locationHubRows(),
    listPublicFeeds(),
  ]);
  const topFeeds = (feedList ?? [])
    .filter((feed) => feed.group !== 'companies')
    .slice(0, 8)
    .concat((feedList ?? []).filter((feed) => feed.group === 'companies').slice(0, 5));
  const snapshot = await loadPublicSnapshot();
  const totalJobs = snapshot
    ? snapshot.jobs.filter((job) => job.isActive && !job.isHidden).length
    : domains.reduce((sum, row) => sum + row.count, 0);

  const site = getSiteUrl();

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link href="/" className="underline">
          Robotics jobs
        </Link>
        <span aria-hidden> / </span>
        <span className="text-foreground">Categories</span>
      </nav>

      <h1 className="mt-6 text-4xl font-semibold">Robotics job categories</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Browse open robotics roles by robot type and location. {totalJobs > 0 ? `${totalJobs}+` : 'Live'} jobs are
        aggregated from public company ATS boards and refreshed daily.
      </p>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Robot type</h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {domains.map((row) => (
            <li key={row.href} className="rounded-2xl border border-line bg-card p-5">
              <Link href={row.href} className="text-lg font-semibold hover:text-accent">
                {row.label}
              </Link>
              <p className="mt-1 font-mono text-xs text-muted">
                {row.count} open job{row.count === 1 ? '' : 's'}
              </p>
              <p className="mt-2 text-sm text-muted line-clamp-3">{row.blurb}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-14">
        <h2 className="text-2xl font-semibold">Locations</h2>
        <ul className="mt-6 flex flex-wrap gap-2">
          {locations.map((row) => (
            <li key={row.href}>
              <Link
                href={row.href}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-chip px-3 py-1.5 text-sm hover:border-accent/40"
              >
                {row.label}
                <span className="font-mono text-xs text-muted">({row.count})</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-14">
        <h2 className="text-2xl font-semibold">RSS feeds</h2>
        <p className="mt-2 text-sm text-muted">
          Snapshot-backed feeds — no login.{' '}
          <Link href="/rss" className="underline">
            Browse all RSS feeds
          </Link>
        </p>
        <ul className="mt-4 space-y-2 text-sm">
          {topFeeds.map((feed) => (
            <li key={feed.feedPath}>
              <a href={feed.feedPath} className="underline hover:text-accent">
                {feed.title.replace(/ — Robot Jobs Board$/, '')}
              </a>
              <span className="ml-2 font-mono text-xs text-muted">
                {site}
                {feed.feedPath}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <aside className="mt-14 rounded-2xl border border-accent/30 bg-accent/5 px-6 py-5">
        <p className="text-sm font-semibold">Employers</p>
        <p className="mt-1 text-sm text-muted">
          Feature your robotics role for $149 / 30 days — live checkout, no sales call.
        </p>
        <Link href="/post-a-job" className="mt-4 inline-block text-sm font-semibold text-accent underline">
          Post a Featured job →
        </Link>
      </aside>
    </div>
  );
}
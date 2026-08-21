import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SeoJobList } from '@/components/seo-job-list';
import { listingIsIndexable, loadListing, resolvePlace } from '@/lib/programmatic';

export const revalidate = 300;

function parsePlaceParam(slug: string): string | null {
  const match = slug.match(/^([a-z0-9-]+)-robotics-jobs$/);
  return match?.[1] ?? null;
}

export async function generateMetadata({ params }: PageProps<'/locations/[place]'>): Promise<Metadata> {
  const { place: raw } = await params;
  const place = parsePlaceParam(raw);
  if (!place) return { title: 'Location jobs' };
  const resolved = await resolvePlace(place);
  if (!resolved) return { title: 'Location jobs' };
  const indexable = await listingIsIndexable(resolved.where, `place-${place}`);
  return {
    title: `${resolved.label} robotics jobs`,
    description: `Robotics jobs in ${resolved.label}, including AMR, humanoid, drone, and industrial jobs.`,
    robots: indexable ? undefined : { index: false, follow: true },
  };
}

export default async function LocationJobsPage({ params }: PageProps<'/locations/[place]'>) {
  const { place: raw } = await params;
  const place = parsePlaceParam(raw);
  if (!place) notFound();
  const resolved = await resolvePlace(place);
  if (!resolved) notFound();
  const listing = await loadListing(resolved.where, `place-${place}`);
  return (
    <SeoJobList
      h1={`${resolved.label} robotics jobs`}
      intro={`${resolved.label} is a recurring location in robotics hiring, from warehouse AMR deployments to humanoid labs and drone programs. This page collects live jobs tied to that city, region, or country so you can compare teams without bouncing between boards. Typical stacks include C++, Python, and ROS 2, with on site hardware work more common than fully remote software. Check related domain pages if you already know the robot type you want.`}
      jobs={listing.jobs}
      indexable={listing.indexable}
    />
  );
}

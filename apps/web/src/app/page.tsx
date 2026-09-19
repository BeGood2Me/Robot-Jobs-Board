import type { Metadata } from 'next';
import { JobBoard } from '@/components/job-board';
import { loadPublicSnapshot } from '@/lib/snapshot/load';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const snapshot = await loadPublicSnapshot();
  const count = snapshot?.jobs.length ?? 0;
  const countLabel = count > 0 ? `${count.toLocaleString('en-US')} open roles. ` : '';
  const title = 'Robotics jobs board';
  const description =
    `${countLabel}Robotics jobs board for engineers and technicians — US, UK, Canada, and remote. Updated daily from company ATS boards; filter by robot type and apply on the original posting.`.slice(
      0,
      160,
    );
  return {
    title,
    description,
    alternates: { canonical: '/' },
    openGraph: {
      title,
      description,
      url: '/',
      type: 'website',
    },
  };
}

/** Default board listing — no searchParams so Vercel can ISR-cache `/`. */
export default async function HomePage() {
  return <JobBoard params={{}} />;
}

import type { Metadata } from 'next';
import { JobBoard } from '@/components/job-board';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const title = 'Robotics jobs board';
  const description =
    'Robotics jobs board for engineers and technicians — US, UK, Canada, and remote. Updated daily from company ATS boards; filter by robot type and apply on the original posting.';
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

import type { Metadata } from 'next';
import { JobBoard } from '@/components/job-board';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Robotics jobs board',
  description:
    'Robotics jobs board with open roles in the United States, United Kingdom, Canada, Australia, and Europe. Filter by location, robot type, and experience, then apply on the original posting.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Robotics jobs board',
    description:
      'Open robotics jobs from company career pages in the United States, United Kingdom, Canada, Australia, and Europe.',
    url: '/',
    type: 'website',
  },
};

/** Default board listing — no searchParams so Vercel can ISR-cache `/`. */
export default async function HomePage() {
  return <JobBoard params={{}} />;
}

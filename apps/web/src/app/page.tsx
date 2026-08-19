import type { Metadata } from 'next';
import { JobBoard } from '@/components/job-board';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Robotics jobs',
  description:
    'Find robotics jobs in the United States, United Kingdom, Canada, Australia, and Europe. Filter by location, robot type, and experience, then apply on the original posting.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Robotics jobs',
    description:
      'Open robotics jobs from company boards in the United States, United Kingdom, Canada, Australia, and Europe.',
    url: '/',
    type: 'website',
  },
};

export default async function HomePage({ searchParams }: PageProps<'/'>) {
  const params = await searchParams;
  return <JobBoard params={params} />;
}

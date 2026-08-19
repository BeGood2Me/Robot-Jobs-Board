import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma, withDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Robotics companies hiring',
  description: 'Company profiles for robotics teams hiring across AMRs, humanoids, drones, and more.',
};

export default async function CompaniesPage() {
  const companies = await withDb(
    () =>
      prisma.company.findMany({
        include: { _count: { select: { jobs: { where: { isActive: true, isHidden: false } } } } },
        orderBy: { name: 'asc' },
      }),
    [],
  );

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="text-4xl font-semibold">Companies</h1>
      <p className="mt-3 max-w-[680px] text-muted">
        Robotics teams with public job boards ingested into Robot Jobs Board.
      </p>
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {companies.map((company) => (
          <Link
            key={company.id}
            href={`/companies/${company.slug}`}
            className="rounded-2xl border border-line bg-card p-6"
          >
            <h2 className="text-xl font-semibold">{company.name}</h2>
            <p className="mt-2 text-sm text-muted">{company.description}</p>
            <p className="mt-4 font-mono text-xs text-muted">
              {company._count.jobs} open job{company._count.jobs === 1 ? '' : 's'}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

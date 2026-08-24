import Link from 'next/link';
import { loadPublicSnapshot } from '@/lib/snapshot/load';
import { prisma, withDb } from '@/lib/db';
import { publicJobWhere } from '@/lib/jobs';
import { unstable_cache } from 'next/cache';
import { PUBLIC_REVALIDATE_SECONDS } from '@/lib/site';

export const revalidate = 14400;

export const metadata = {
  title: 'Robotics companies hiring',
  description: 'Company profiles for robotics teams hiring across AMRs, humanoids, drones, and more.',
};

const loadCompaniesIndex = unstable_cache(
  async () =>
    prisma.company.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        _count: { select: { jobs: { where: publicJobWhere } } },
      },
      orderBy: { name: 'asc' },
    }),
  ['companies-index'],
  { revalidate: PUBLIC_REVALIDATE_SECONDS },
);

export default async function CompaniesPage() {
  const snapshot = await loadPublicSnapshot();
  const companies = snapshot
    ? snapshot.companies.map((company) => ({
        id: company.id,
        name: company.name,
        slug: company.slug,
        description: company.description,
        _count: { jobs: company.openJobCount },
      }))
    : await withDb(loadCompaniesIndex, []);

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

import type { Metadata } from 'next';
import Link from 'next/link';
import { getBlogPosts } from '@/lib/blog';
import { blogIndexJsonLd } from '@/lib/jsonld';

export const metadata: Metadata = {
  title: 'Robotics career guides',
  description:
    'Learn how to become a robotics engineer, choose AMR or humanoid work, and match your skills to live robotics job posts. Guides for candidates and hiring teams.',
  alternates: { canonical: '/guides' },
  openGraph: {
    title: 'Robotics career guides',
    description:
      'How to become a robotics engineer, compare AMR and humanoid careers, and read the skills in live robotics job posts.',
    url: '/guides',
    type: 'website',
  },
};

const audienceLabel: Record<string, string> = {
  candidate: 'Starting a robotics career',
  employer: 'Hiring robotics engineers',
  market: 'Skills robotics jobs ask for',
};

const audienceOrder = ['candidate', 'market', 'employer'];

export default function BlogIndexPage() {
  const posts = getBlogPosts();
  const grouped = audienceOrder
    .map((audience) => ({
      audience,
      label: audienceLabel[audience] ?? audience,
      posts: posts.filter((post) => post.audience === audience),
    }))
    .filter((group) => group.posts.length);

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogIndexJsonLd(posts)) }} />
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <ol className="flex flex-wrap gap-2">
          <li>
            <Link href="/" className="underline">
              Robotics jobs
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="text-foreground">Guides</li>
        </ol>
      </nav>
      <h1 className="mt-6 max-w-[680px] bg-gradient-to-r from-black to-[#666666] bg-clip-text text-4xl font-semibold text-balance text-transparent dark:from-white dark:to-[#9B9B9B]">
        Robotics career guides
      </h1>
      <p className="mt-3 max-w-[680px] text-pretty text-muted">
        Learn{' '}
        <Link href="/guides/how-to-become-a-robotics-engineer" className="underline">
          how to become a robotics engineer
        </Link>
        , compare{' '}
        <Link href="/guides/amr-vs-humanoid-careers" className="underline">
          AMR and humanoid careers
        </Link>
        , and see which{' '}
        <Link href="/guides/robotics-skills-trending-from-job-posts" className="underline">
          skills robotics jobs ask for
        </Link>
        . Hiring teams can read{' '}
        <Link href="/guides/how-to-write-robotics-job-descriptions" className="underline">
          how to write a robotics job description
        </Link>
        . Then browse{' '}
        <Link href="/" className="underline">
          open robotics jobs
        </Link>{' '}
        and filter by entry level or robot type.
      </p>
      <div className="mt-10 space-y-12">
        {grouped.map((group) => (
          <section key={group.audience}>
            <h2 className="text-sm font-semibold">{group.label}</h2>
            <div className="mt-4 grid gap-6">
              {group.posts.map((post) => (
                <article key={post.slug} className="rounded-2xl border border-line bg-card p-6">
                  <h3 className="text-2xl font-semibold">
                    <Link href={`/guides/${post.slug}`}>{post.title}</Link>
                  </h3>
                  <p className="mt-2 text-muted">{post.description}</p>
                  <p className="mt-4 font-mono text-xs text-muted">Updated {post.updatedAt ?? post.publishedAt}</p>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

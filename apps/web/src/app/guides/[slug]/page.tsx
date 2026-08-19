import type { Metadata } from 'next';
import Link from 'next/link';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { getBlogHeadings, getBlogPost, getBlogPosts, getRelatedBlogPosts, headingId } from '@/lib/blog';
import { blogArticleJsonLd } from '@/lib/jsonld';

export function generateStaticParams() {
  return getBlogPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps<'/guides/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return { title: 'Guide' };
  const url = `/guides/${post.slug}`;
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.description,
      url,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt ?? post.publishedAt,
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
    },
  };
}

function childText(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(childText).join('');
  if (node && typeof node === 'object' && 'props' in node) {
    return childText((node as { props: { children?: ReactNode } }).props.children);
  }
  return '';
}

const components = {
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a {...props} className="underline decoration-accent/50 underline-offset-2 hover:text-foreground" />
  ),
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => {
    const id = headingId(childText(props.children));
    return <h2 {...props} id={id} className="mt-12 scroll-mt-28 text-2xl font-semibold" />;
  },
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 {...props} className="mt-8 text-xl font-semibold" />
  ),
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p {...props} className="mt-4 text-muted" />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul {...props} className="mt-4 list-disc space-y-2 pl-5 text-muted" />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol {...props} className="mt-4 list-decimal space-y-2 pl-5 text-muted" />
  ),
  strong: (props: React.HTMLAttributes<HTMLElement>) => <strong {...props} className="text-foreground" />,
};

export default async function BlogPostPage({ params }: PageProps<'/guides/[slug]'>) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();
  const headings = getBlogHeadings(post.content);
  const related = getRelatedBlogPosts(post.slug);
  const modified = post.updatedAt ?? post.publishedAt;
  const cta =
    post.audience === 'employer' ? (
      <Link href="/post-a-job" className="underline">
        Post a robotics job or share your ATS board
      </Link>
    ) : (
      <Link href="/" className="underline">
        Search live robotics jobs
      </Link>
    );

  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogArticleJsonLd(post)) }} />
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <ol className="flex flex-wrap gap-2">
          <li>
            <Link href="/" className="underline">
              Jobs
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href="/guides" className="underline">
              Guides
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="text-foreground">{post.title}</li>
        </ol>
      </nav>
      <p className="mt-6 font-mono text-xs text-muted">
        Updated {modified}
        {modified !== post.publishedAt ? ` · Published ${post.publishedAt}` : ''}
      </p>
      <h1 className="mt-3 text-4xl font-semibold">{post.title}</h1>
      <p className="mt-4 text-lg text-muted">{post.description}</p>
      {headings.length ? (
        <nav aria-label="On this page" className="mt-8 rounded-2xl border border-line bg-card p-6">
          <p className="text-sm font-semibold">On this page</p>
          <ol className="mt-3 space-y-2 text-sm">
            {headings.map((heading) => (
              <li key={heading.id}>
                <a href={`#${heading.id}`} className="text-muted underline hover:text-foreground">
                  {heading.title}
                </a>
              </li>
            ))}
            {post.faqs?.length ? (
              <li>
                <a href="#faq" className="text-muted underline hover:text-foreground">
                  Frequently asked questions
                </a>
              </li>
            ) : null}
          </ol>
        </nav>
      ) : null}
      <div className="mt-10">
        <MDXRemote source={post.content} components={components} />
      </div>
      {post.faqs?.length ? (
        <section className="mt-12">
          <h2 id="faq" className="scroll-mt-28 text-2xl font-semibold">
            Frequently asked questions
          </h2>
          <div className="mt-6 space-y-8">
            {post.faqs.map((faq) => (
              <div key={faq.question}>
                <h3 className="text-xl font-semibold">{faq.question}</h3>
                <p className="mt-3 text-muted">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
      <p className="mt-12 text-sm font-semibold">{cta}</p>
      {related.length ? (
        <section className="mt-16 border-t border-line pt-12">
          <h2 className="text-2xl font-semibold">Related guides</h2>
          <ul className="mt-6 grid gap-4">
            {related.map((item) => (
              <li key={item.slug}>
                <Link href={`/guides/${item.slug}`} className="text-lg font-semibold underline">
                  {item.title}
                </Link>
                <p className="mt-1 text-sm text-muted">{item.description}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}

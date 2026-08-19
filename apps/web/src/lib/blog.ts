import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

export type BlogAudience = 'candidate' | 'employer' | 'market';

export type BlogFaq = {
  question: string;
  answer: string;
};

export type BlogFrontmatter = {
  title: string;
  slug: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  tags: string[];
  audience: BlogAudience;
  faqs?: BlogFaq[];
};

export type BlogPost = BlogFrontmatter & { content: string };

export type BlogHeading = {
  id: string;
  title: string;
};

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog');

export function headingId(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['"’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getBlogHeadings(content: string): BlogHeading[] {
  return [...content.matchAll(/^##\s+(.+)$/gm)].map((match) => ({
    title: match[1] ?? '',
    id: headingId(match[1] ?? ''),
  }));
}

export function getBlogPosts(): BlogPost[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((file) => file.endsWith('.mdx'))
    .map((file) => {
      const raw = fs.readFileSync(path.join(BLOG_DIR, file), 'utf8');
      const parsed = matter(raw);
      const data = parsed.data as BlogFrontmatter;
      return { ...data, content: parsed.content };
    })
    .sort((a, b) => +new Date(b.updatedAt ?? b.publishedAt) - +new Date(a.updatedAt ?? a.publishedAt));
}

export function getBlogPost(slug: string): BlogPost | null {
  return getBlogPosts().find((post) => post.slug === slug) ?? null;
}

export function getRelatedBlogPosts(slug: string, take = 3): BlogPost[] {
  return getBlogPosts()
    .filter((post) => post.slug !== slug)
    .slice(0, take);
}

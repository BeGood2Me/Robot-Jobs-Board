import type { JobWithRelations } from './jobs';
import { PAGE_SIZE, getSiteUrl } from './site';

function employmentSchema(type: string): string {
  switch (type) {
    case 'FULL_TIME':
      return 'FULL_TIME';
    case 'PART_TIME':
      return 'PART_TIME';
    case 'CONTRACT':
      return 'CONTRACTOR';
    case 'INTERN':
      return 'INTERN';
    case 'TEMPORARY':
      return 'TEMPORARY';
    default:
      return 'FULL_TIME';
  }
}

export function jobPostingJsonLd(job: JobWithRelations) {
  const site = getSiteUrl();
  const description = job.descriptionPlain.slice(0, 5000);
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org/',
    '@type': 'JobPosting',
    title: job.title,
    description,
    datePosted: job.postedAt?.toISOString() ?? job.createdAt.toISOString(),
    employmentType: employmentSchema(job.employmentType),
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company.name,
      sameAs: job.company.website ?? undefined,
      logo: job.company.logoUrl ?? undefined,
    },
    identifier: {
      '@type': 'PropertyValue',
      name: job.sourceSystem,
      value: job.externalId,
    },
    directApply: false,
    url: `${site}/jobs/${job.id}/${job.slug}`,
    applicationContact: undefined,
  };

  if (job.expiresAt) {
    data.validThrough = job.expiresAt.toISOString();
  }

  if (job.isRemote || job.workplaceType === 'REMOTE') {
    data.jobLocationType = 'TELECOMMUTE';
    data.applicantLocationRequirements = job.country
      ? { '@type': 'Country', name: job.country }
      : { '@type': 'Country', name: 'United States' };
  }

  if (job.workplaceType !== 'REMOTE') {
    data.jobLocation = {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.city ?? undefined,
        addressRegion: job.region ?? undefined,
        addressCountry: job.country ?? 'US',
      },
    };
  }

  return data;
}

export function blogArticleJsonLd(post: {
  title: string;
  slug: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  faqs?: Array<{ question: string; answer: string }>;
}) {
  const site = getSiteUrl();
  const url = `${site}/guides/${post.slug}`;
  const publisher = {
    '@type': 'Organization',
    name: 'Robot Jobs Board',
    url: site,
  };
  const graph: Record<string, unknown>[] = [
    {
      '@type': 'Article',
      headline: post.title,
      description: post.description,
      datePublished: `${post.publishedAt}T00:00:00.000Z`,
      dateModified: `${post.updatedAt ?? post.publishedAt}T00:00:00.000Z`,
      mainEntityOfPage: url,
      url,
      author: publisher,
      publisher,
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: site },
        { '@type': 'ListItem', position: 2, name: 'Guides', item: `${site}/guides` },
        { '@type': 'ListItem', position: 3, name: post.title, item: url },
      ],
    },
  ];
  if (post.faqs?.length) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: post.faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      })),
    });
  }
  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
}

export function homePageJsonLd() {
  const site = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        name: 'Robot Jobs Board',
        url: site,
        description:
          'Robotics jobs in the United States, United Kingdom, Canada, Australia, and Europe, sourced from company career pages.',
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${site}/?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'CollectionPage',
        name: 'Robotics jobs',
        description:
          'Open robotics jobs for engineers, technicians, and operators. Filter by location, robot type, and experience.',
        url: site,
        isPartOf: { '@id': site },
      },
    ],
  };
}

export function blogIndexJsonLd(posts: Array<{ title: string; slug: string; description: string }>) {
  const site = getSiteUrl();
  const url = `${site}/guides`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: 'Robotics career guides',
        description:
          'Guides on how to become a robotics engineer, choosing AMR or humanoid work, and reading the skills in live robotics job posts.',
        url,
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: posts.length,
          itemListElement: posts.map((post, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            url: `${site}/guides/${post.slug}`,
            name: post.title,
          })),
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Robotics jobs', item: site },
          { '@type': 'ListItem', position: 2, name: 'Robotics career guides', item: url },
        ],
      },
    ],
  };
}

export function companyPageJsonLd(company: {
  name: string;
  slug: string;
  description: string;
  website: string | null;
  logoUrl: string | null;
  jobs: Array<{ id: string; slug: string; title: string }>;
  total: number;
  page: number;
}) {
  const site = getSiteUrl();
  const url = `${site}/companies/${company.slug}`;
  const offset = (company.page - 1) * PAGE_SIZE;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: company.name,
        url: company.website || url,
        logo: company.logoUrl || undefined,
        description: company.description,
      },
      {
        '@type': 'CollectionPage',
        name: `${company.name} robotics jobs`,
        description: company.description,
        url,
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: company.total,
          itemListElement: company.jobs.map((job, index) => ({
            '@type': 'ListItem',
            position: offset + index + 1,
            url: `${site}/jobs/${job.id}/${job.slug}`,
            name: job.title,
          })),
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Robotics jobs', item: site },
          { '@type': 'ListItem', position: 2, name: 'Companies', item: `${site}/companies` },
          { '@type': 'ListItem', position: 3, name: company.name, item: url },
        ],
      },
    ],
  };
}

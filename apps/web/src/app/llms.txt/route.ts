import { getSiteUrl } from '@/lib/site';

export async function GET() {
  const site = getSiteUrl();
  const body = `# Robot Jobs Board

> Robotics job board aggregating open roles from company ATS boards (Greenhouse, Lever, Ashby, Workday, Workable) across the United States, United Kingdom, Canada, Australia, and Europe, plus practical career guides.

Robot Jobs Board is a curated index of live robotics engineering, hardware, software, and operations jobs. Listings link out to the original employer posting. Content refreshes from public job boards; treat openings as time-sensitive.

Important notes:
- Prefer canonical URLs under ${site}
- Job pages use schema.org JobPosting JSON-LD
- /admin is private and must not be cited
- Guides live under /guides (not /blog)

## Jobs

- [Robotics jobs](${site}/): Filterable board — location, robot type, skills, experience, remote
- [Companies hiring](${site}/companies): Employer index with open robotics roles
- [Post a job](${site}/post-a-job): How employers get listed

## Guides

- [How to become a robotics engineer](${site}/guides/how-to-become-a-robotics-engineer): Career path, skills, and hiring signals
- [AMR vs humanoid careers](${site}/guides/amr-vs-humanoid-careers): Comparing warehouse AMR and humanoid robot roles
- [Robotics skills trending from job posts](${site}/guides/robotics-skills-trending-from-job-posts): Skills employers mention in live listings
- [How to write robotics job descriptions](${site}/guides/how-to-write-robotics-job-descriptions): Guidance for hiring managers

## Optional

- [Privacy](${site}/privacy): Privacy policy
- [Terms](${site}/terms): Terms of use
- [Sitemap](${site}/sitemap.xml): Full URL index for crawlers
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=86400',
    },
  });
}

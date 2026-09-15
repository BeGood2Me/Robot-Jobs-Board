import type { LeverPosting } from './api-types';
import { decodeJobHtml, htmlToPlain, mapEmployment, parseLocation } from '../normalize';
import type { NormalizedJob } from '../types';

function escapeHtmlText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Lever puts role bullets in `lists[]` (not in `description`). Omit them and postings look truncated. */
function leverListsHtml(lists: LeverPosting['lists']): string {
  if (!lists?.length) return '';
  return lists
    .map((list) => {
      const heading = list.text?.trim();
      let content = (list.content ?? '').trim();
      if (!heading && !content) return '';
      if (content.includes('<li') && !/<ul[\s>]/i.test(content)) {
        content = `<ul>${content}</ul>`;
      }
      const title = heading ? `<h3>${escapeHtmlText(heading)}</h3>` : '';
      return `${title}${content}`;
    })
    .filter(Boolean)
    .join('\n');
}

function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

export function formatLeverSalary(range: LeverPosting['salaryRange']): string | null {
  if (!range) return null;
  const min = typeof range.min === 'number' ? range.min : null;
  const max = typeof range.max === 'number' ? range.max : null;
  if (min == null && max == null) return null;

  const currency = (range.currency ?? 'USD').toUpperCase();
  const minText = min != null ? formatMoney(min, currency) : null;
  const maxText = max != null ? formatMoney(max, currency) : null;
  const amount = minText && maxText && min !== max ? `${minText}–${maxText}` : (minText ?? maxText)!;

  const interval = (range.interval ?? '').toLowerCase();
  const period = interval.includes('hour')
    ? ' / hour'
    : interval.includes('month')
      ? ' / month'
      : interval.includes('week')
        ? ' / week'
        : interval.includes('year') || interval.includes('salary')
          ? ' / year'
          : '';

  return `${amount}${period}`;
}

/** Lever keeps the numeric range in `salaryRange` and only a prose blurb in `salaryDescription`. */
function leverSalaryHtml(posting: LeverPosting): string {
  const amount = formatLeverSalary(posting.salaryRange);
  const description = (posting.salaryDescription ?? '').trim();
  if (!amount && !description) return '';
  if (!amount) return description;

  const amountBlock = `<p><strong>${escapeHtmlText(amount)}</strong></p>`;
  if (/base\s+salary\s+range/i.test(description)) {
    const injected = description.replace(
      /(base\s+salary\s+range\s*<\/(?:strong|b|span)>\s*<\/div>)\s*(?:<div>&nbsp;<\/div>\s*)?/i,
      (_match, heading: string) => `${heading}\n${amountBlock}\n`,
    );
    if (injected !== description) return injected;
  }
  return `<h3>Base Salary Range</h3>\n${amountBlock}\n${description}`;
}

export function mapLeverJob(posting: LeverPosting): NormalizedJob {
  const html = decodeJobHtml(
    [posting.description, leverListsHtml(posting.lists), leverSalaryHtml(posting), posting.additional]
      .filter(Boolean)
      .join('\n'),
  );
  // Prefer HTML→plain. Some Zoox postings ship an internal template in descriptionPlain.
  const plain = htmlToPlain(html);
  const locationRaw = posting.categories?.location ?? '';
  const parsed = parseLocation(locationRaw);
  const workplaceHint = (posting.workplaceType ?? posting.categories?.workplaceType ?? '').toLowerCase();
  let workplaceType = parsed.workplaceType;
  if (workplaceHint.includes('remote')) workplaceType = parsed.isRemote ? 'REMOTE' : 'HYBRID';
  if (workplaceHint.includes('hybrid')) workplaceType = 'HYBRID';
  if (workplaceHint.includes('onsite') || workplaceHint.includes('on-site')) workplaceType = 'ONSITE';

  const created =
    typeof posting.createdAt === 'number'
      ? new Date(posting.createdAt)
      : posting.createdAt
        ? new Date(posting.createdAt)
        : null;

  return {
    externalId: posting.id,
    sourceSystem: 'lever',
    title: posting.text?.trim() || 'Untitled role',
    descriptionHtml: html,
    descriptionPlain: plain,
    url: posting.hostedUrl ?? posting.applyUrl ?? '',
    locationRaw: parsed.locationRaw,
    country: parsed.country,
    region: parsed.region,
    city: parsed.city,
    isRemote: parsed.isRemote || workplaceType === 'REMOTE',
    workplaceType,
    employmentType: mapEmployment(posting.categories?.commitment),
    department: posting.categories?.department ?? posting.categories?.team ?? null,
    compensationText: formatLeverSalary(posting.salaryRange),
    postedAt: created,
  };
}

export async function fetchLeverJobs(site: string): Promise<NormalizedJob[]> {
  const jobs: NormalizedJob[] = [];
  const limit = 100;
  let skip = 0;

  for (;;) {
    const url = `https://api.lever.co/v0/postings/${encodeURIComponent(site)}?skip=${skip}&limit=${limit}&mode=json`;
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) {
      throw new Error(`Lever fetch failed for ${site}: ${response.status} ${response.statusText}`);
    }
    const page = (await response.json()) as LeverPosting[];
    if (!Array.isArray(page) || page.length === 0) break;
    jobs.push(...page.map(mapLeverJob));
    if (page.length < limit) break;
    skip += limit;
  }

  return jobs;
}

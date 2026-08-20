import Link from 'next/link';

function paginationItems(current: number, total: number): Array<number | 'ellipsis'> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  const items: Array<number | 'ellipsis'> = [1];
  if (start > 2) items.push('ellipsis');
  for (let page = start; page <= end; page += 1) items.push(page);
  if (end < total - 1) items.push('ellipsis');
  items.push(total);
  return items;
}

function pageLinkClass(active: boolean) {
  return active
    ? 'inline-flex h-10 min-w-10 items-center justify-center rounded-lg bg-accent px-3 text-sm font-semibold text-accent-fg'
    : 'inline-flex h-10 min-w-10 items-center justify-center rounded-lg bg-chip px-3 text-sm font-semibold transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-accent';
}

export function JobPagination({
  page,
  pages,
  hrefFor,
}: {
  page: number;
  pages: number;
  hrefFor: (page: number) => string;
}) {
  if (pages <= 1) return null;
  const previous = page > 1;
  const next = page < pages;

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-center gap-2 pt-6 pb-4">
      {previous ? (
        <Link href={hrefFor(page - 1)} className={pageLinkClass(false)}>
          Previous
        </Link>
      ) : (
        <span className={`${pageLinkClass(false)} pointer-events-none opacity-40`}>Previous</span>
      )}
      {paginationItems(page, pages).map((item, index) =>
        item === 'ellipsis' ? (
          <span key={`ellipsis-${index}`} className="px-1 text-sm text-muted">
            …
          </span>
        ) : (
          <Link
            key={item}
            href={hrefFor(item)}
            aria-current={item === page ? 'page' : undefined}
            className={pageLinkClass(item === page)}
          >
            {item}
          </Link>
        ),
      )}
      {next ? (
        <Link href={hrefFor(page + 1)} className={pageLinkClass(false)}>
          Next
        </Link>
      ) : (
        <span className={`${pageLinkClass(false)} pointer-events-none opacity-40`}>Next</span>
      )}
    </nav>
  );
}

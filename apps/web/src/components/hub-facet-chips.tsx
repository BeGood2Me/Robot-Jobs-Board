import Link from 'next/link';
import type { HubFacetLink } from '@/lib/hub-facets';

function FacetList({ title, items }: { title: string; items: HubFacetLink[] }) {
  if (!items.length) return null;
  return (
    <div>
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <ul className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-chip px-3 py-1.5 text-sm hover:border-accent/40"
            >
              <span>{item.label}</span>
              <span className="font-mono text-xs text-muted">({item.count})</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function HubFacetChips({
  companies,
  cities,
}: {
  companies?: HubFacetLink[];
  cities?: HubFacetLink[];
}) {
  const companyItems = companies ?? [];
  const cityItems = cities ?? [];
  if (!companyItems.length && !cityItems.length) return null;

  return (
    <section className="mt-8 space-y-6 border-b border-line pb-8" aria-label="Browse this hub">
      {cityItems.length ? <FacetList title="Top cities" items={cityItems} /> : null}
      {companyItems.length ? <FacetList title="Top employers" items={companyItems} /> : null}
    </section>
  );
}
import Link from 'next/link';

const domains = [
  { slug: 'amr', label: 'AMR' },
  { slug: 'humanoid', label: 'Humanoid' },
  { slug: 'drone', label: 'Drone' },
  { slug: 'industrial', label: 'Industrial' },
  { slug: 'field', label: 'Field' },
  { slug: 'medical', label: 'Medical' },
];

export function DomainChips({ selected }: { selected?: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {domains.map((domain) => {
        const active = selected?.includes(domain.slug);
        return (
          <Link
            key={domain.slug}
            href={`/?domain=${domain.slug}`}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
              active ? 'bg-foreground text-background' : 'bg-chip text-foreground hover:opacity-80'
            }`}
          >
            {domain.label}
          </Link>
        );
      })}
    </div>
  );
}

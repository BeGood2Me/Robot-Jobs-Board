import Link from 'next/link';

export function HubFeaturedCta() {
  return (
    <aside className="mt-8 rounded-2xl border border-accent/30 bg-accent/5 px-6 py-5">
      <p className="text-sm font-semibold text-foreground">Hiring for robotics?</p>
      <p className="mt-1 text-sm text-muted">
        Pin your role near the top of the board — <span className="text-foreground">$149 / 30 days</span>. Candidates
        apply on your career page.
      </p>
      <Link
        href="/post-a-job"
        className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-accent px-4 text-sm font-semibold text-accent-fg hover:opacity-90"
      >
        Post a Featured job
      </Link>
    </aside>
  );
}
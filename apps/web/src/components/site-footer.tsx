import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="relative z-10 mt-16 shrink-0 border-t border-line bg-background px-6 py-16 pb-[max(4rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold">Robot Jobs Board</p>
          <p className="mt-3 max-w-sm text-sm text-muted">
            A robotics job board for people who want to work on real robots, and guides for getting started.
          </p>
        </div>
        <div className="flex flex-wrap gap-6 text-sm text-muted">
          <Link href="/" className="hover:text-foreground">
            Jobs
          </Link>
          <Link href="/companies" className="hover:text-foreground">
            Companies
          </Link>
          <Link href="/guides" className="hover:text-foreground">
            Guides
          </Link>
          <Link href="/locations/united-states-robotics-jobs" className="hover:text-foreground">
            US robotics jobs
          </Link>
          <Link href="/locations/united-kingdom-robotics-jobs" className="hover:text-foreground">
            UK robotics jobs
          </Link>
          <Link href="/locations/canada-robotics-jobs" className="hover:text-foreground">
            Canada robotics jobs
          </Link>
          <Link href="/locations/remote-robotics-jobs" className="hover:text-foreground">
            Remote robotics jobs
          </Link>
          <Link href="/guides/how-to-become-a-robotics-engineer" className="hover:text-foreground">
            Become a robotics engineer
          </Link>
          <Link href="/guides/amr-vs-humanoid-careers" className="hover:text-foreground">
            AMR vs humanoid jobs
          </Link>
          <Link href="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-foreground">
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}

import Link from 'next/link';

export function SiteLogo() {
  return (
    <Link
      href="/"
      aria-label="Robot Jobs Board home"
      className="flex items-center gap-2 rounded-full text-foreground transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-accent"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-background/80 text-accent shadow-sm backdrop-blur-xl">
        <svg viewBox="0 0 32 32" className="h-5 w-5" fill="none" aria-hidden>
          <rect x="5" y="9" width="22" height="16" rx="5" stroke="currentColor" strokeWidth="2" />
          <circle cx="13" cy="17" r="2" fill="currentColor" />
          <circle cx="19" cy="17" r="2" fill="currentColor" />
          <rect x="14" y="4" width="4" height="6" rx="1" fill="currentColor" />
        </svg>
      </span>
      <span className="hidden whitespace-nowrap text-sm font-semibold sm:inline">Robot Jobs Board</span>
    </Link>
  );
}

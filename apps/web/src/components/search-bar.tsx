import { MagnifyingGlass } from '@phosphor-icons/react/ssr';

export function SearchBar({
  defaultQuery = '',
  action = '/',
}: {
  defaultQuery?: string;
  action?: string;
}) {
  return (
    <form action={action} method="get" className="flex w-full max-w-[680px] gap-2">
      <label htmlFor="job-search" className="sr-only">
        Search robotics jobs
      </label>
      <div className="relative flex-1">
        <MagnifyingGlass className="pointer-events-none absolute top-3 left-3 text-muted" size={18} />
        <input
          id="job-search"
          name="q"
          defaultValue={defaultQuery}
          placeholder="Title, company, or city"
          className="h-12 w-full rounded-lg border border-line bg-card pr-3 pl-10 text-base"
        />
      </div>
      <button
        type="submit"
        className="h-12 rounded-lg bg-foreground px-3 text-base font-semibold text-background transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:opacity-90 active:scale-[0.98]"
      >
        Search robotics jobs
      </button>
    </form>
  );
}

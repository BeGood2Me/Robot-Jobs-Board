import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Post a robotics job',
  description: 'Tell Robot Jobs Board about your public ATS board or upcoming robotics jobs.',
};

export default function PostAJobPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-4xl font-semibold">Post a job</h1>
      <p className="mt-4 text-muted">
        Direct employer posting is not live yet. Send your public Greenhouse, Lever, or Ashby board and we will ingest
        the jobs. No wrapping of the apply flow. Candidates still apply on your ATS.
      </p>
      <form className="mt-10 space-y-4" action="mailto:hello@robotjobsboard.com" method="get">
        <label className="block text-sm font-semibold" htmlFor="name">
          Name
        </label>
        <input id="name" name="name" required className="h-10 w-full rounded-lg border border-line bg-card px-3" />
        <label className="block text-sm font-semibold" htmlFor="email">
          Work email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="h-10 w-full rounded-lg border border-line bg-card px-3"
        />
        <label className="block text-sm font-semibold" htmlFor="board">
          Board URL or token
        </label>
        <input id="board" name="board" required className="h-10 w-full rounded-lg border border-line bg-card px-3" />
        <label className="block text-sm font-semibold" htmlFor="message">
          What robots do you build
        </label>
        <textarea id="message" name="body" rows={5} className="w-full rounded-lg border border-line bg-card p-3" />
        <button
          type="submit"
          className="h-10 rounded-lg bg-foreground px-3 text-base font-semibold text-background active:scale-[0.98]"
        >
          Send details
        </button>
      </form>
    </div>
  );
}

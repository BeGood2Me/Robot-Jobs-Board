import {
  LENSA_SPONSORED_DISCLOSURE,
  lensaConnectForJob,
  type LensaConnectJobContext,
} from '@/lib/lensa-connect';

/** Lensa Connect CPC — job detail only; San Francisco campaign for US jobs. */
export function LensaConnectWidget({ job }: { job: LensaConnectJobContext }) {
  const selection = lensaConnectForJob(job);
  if (!selection) return null;

  return (
    <section className="mt-16 w-full" aria-labelledby="lensa-sponsored-heading">
      <h2 id="lensa-sponsored-heading" className="text-2xl font-semibold">
        {selection.heading}
      </h2>
      <p className="mt-2 text-sm text-muted">{LENSA_SPONSORED_DISCLOSURE}</p>
      <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-card">
        <iframe
          title="Sponsored job listings from Lensa"
          src={selection.src}
          style={{ width: '100%', height: '480px', border: 'none', overflow: 'hidden' }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </section>
  );
}

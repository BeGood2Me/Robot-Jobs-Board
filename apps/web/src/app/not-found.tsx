import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-24">
      <h1 className="text-4xl font-semibold">Page not found</h1>
      <p className="mt-4 text-muted">That URL is not a live job, company, or article.</p>
      <Link href="/" className="mt-8 inline-block font-semibold underline">
        Browse robotics jobs
      </Link>
    </div>
  );
}

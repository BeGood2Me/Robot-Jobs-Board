import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/admin';

export const metadata: Metadata = {
  title: 'Admin sign in',
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({ searchParams }: PageProps<'/admin/login'>) {
  if (await isAdmin()) redirect('/admin/jobs');
  const params = await searchParams;
  const error = params.error === '1';

  return (
    <div className="mx-auto max-w-md px-6 py-24">
      <h1 className="text-4xl font-semibold">Admin</h1>
      <p className="mt-4 text-muted">
        Sign in to hide listings that should not appear on Robot Jobs Board. Public jobs still update from ATS boards on
        their own.
      </p>
      {error ? <p className="mt-4 text-sm">That key did not match. Try again.</p> : null}
      <form action="/api/admin/login" method="post" className="mt-8 space-y-4">
        <label className="block text-sm font-semibold" htmlFor="secret">
          Admin key
        </label>
        <input
          id="secret"
          name="secret"
          type="password"
          required
          className="h-10 w-full rounded-lg border border-line bg-card px-3"
        />
        <button
          type="submit"
          className="h-10 rounded-lg bg-foreground px-3 text-base font-semibold text-background active:scale-[0.98]"
        >
          Sign in
        </button>
      </form>
    </div>
  );
}

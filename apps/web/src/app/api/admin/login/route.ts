import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, getAdminSecret, secretsEqual } from '@/lib/admin';

export async function POST(request: Request) {
  const secret = getAdminSecret();
  if (!secret) {
    return NextResponse.json(
      { error: 'Set ADMIN_SECRET in the environment before using the admin tools.' },
      { status: 500 },
    );
  }

  const form = await request.formData();
  const provided = String(form.get('secret') ?? '');
  if (!secretsEqual(provided, secret)) {
    return NextResponse.redirect(new URL('/admin/login?error=1', request.url), { status: 303 });
  }

  const response = NextResponse.redirect(new URL('/admin/jobs', request.url), { status: 303 });
  response.cookies.set(ADMIN_COOKIE, secret, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}

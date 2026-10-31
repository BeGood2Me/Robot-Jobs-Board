import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, LEGACY_ADMIN_COOKIE } from '@/lib/admin';

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL('/admin/login', request.url), { status: 303 });
  response.cookies.set(ADMIN_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
  response.cookies.set(LEGACY_ADMIN_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
  return response;
}

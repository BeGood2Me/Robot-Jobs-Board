import { timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const ADMIN_COOKIE = 'robot_roles_admin';

export function getAdminSecret(): string {
  return process.env.ADMIN_SECRET ?? '';
}

export function getCronSecret(): string {
  return process.env.CRON_SECRET ?? process.env.ADMIN_SECRET ?? '';
}

export function secretsEqual(provided: string, expected: string): boolean {
  if (!provided || !expected) return false;
  const left = Buffer.from(provided);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export async function isAdmin(): Promise<boolean> {
  const secret = getAdminSecret();
  if (!secret) return false;
  const jar = await cookies();
  return secretsEqual(jar.get(ADMIN_COOKIE)?.value ?? '', secret);
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect('/admin/login');
}

export function cronAuthorized(request: Request): boolean {
  const secret = getCronSecret();
  if (!secret) return false;
  const header = request.headers.get('authorization') ?? '';
  const bearer = header.startsWith('Bearer ') ? header.slice(7) : '';
  const query = new URL(request.url).searchParams.get('secret') ?? '';
  return secretsEqual(bearer, secret) || secretsEqual(query, secret);
}

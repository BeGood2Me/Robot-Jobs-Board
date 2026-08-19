'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@robot-jobs-board/db';
import { runIngestion } from '@robot-jobs-board/ingestion';
import { requireAdmin } from '@/lib/admin';

export async function hideJob(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  const hiddenNote = String(formData.get('note') ?? '').trim() || null;
  if (!id) return;
  await prisma.job.update({
    where: { id },
    data: { isHidden: true, hiddenAt: new Date(), hiddenNote },
  });
  revalidatePath('/admin/jobs');
  revalidatePath('/jobs');
  revalidatePath('/');
}

export async function restoreJob(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  await prisma.job.update({
    where: { id },
    data: { isHidden: false, hiddenAt: null, hiddenNote: null },
  });
  revalidatePath('/admin/jobs');
  revalidatePath('/jobs');
  revalidatePath('/');
}

export async function syncJobsNow(): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  const metrics = await runIngestion();
  const created = metrics.sources.reduce((sum, row) => sum + row.created, 0);
  const updated = metrics.sources.reduce((sum, row) => sum + row.updated, 0);
  revalidatePath('/admin/jobs');
  revalidatePath('/jobs');
  revalidatePath('/');
  return {
    ok: true,
    message: `Sync finished. ${created} new, ${updated} updated, ${metrics.expired} expired, ${metrics.robotExpired} non-robot removed.`,
  };
}

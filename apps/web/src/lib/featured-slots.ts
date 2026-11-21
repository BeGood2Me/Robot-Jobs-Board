import { prisma } from '@robot-jobs-board/db';
import { HOMEPAGE_FEATURED_CAP } from '@robot-jobs-board/snapshot';

export type HomepageSlotAvailability = {
  cap: number;
  used: number;
  available: number;
  full: boolean;
};

/** Active paid Featured boosts (homepage cap). */
export async function countHomepageFeaturedSlots(): Promise<number> {
  const now = new Date();
  return prisma.featuredBoost.count({
    where: { featuredUntil: { gt: now } },
  });
}

export async function getHomepageSlotAvailability(): Promise<HomepageSlotAvailability> {
  const used = await countHomepageFeaturedSlots();
  const cap = HOMEPAGE_FEATURED_CAP;
  const available = Math.max(0, cap - used);
  return { cap, used, available, full: available <= 0 };
}

export async function assertHomepageFeaturedSlotAvailable(): Promise<void> {
  const slots = await getHomepageSlotAvailability();
  if (slots.full) {
    throw new Error(
      `All ${slots.cap} homepage Featured slots are in use. Try again when one expires or email hello@robotjobsboard.com.`,
    );
  }
}
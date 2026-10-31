import { cache } from 'react';
import { getCache } from '@vercel/functions';
import {
  applyManualFeaturedToSnapshot,
  manualFeaturedJobs,
  isManualFeaturedMicro1Open,
} from '@robot-jobs-board/snapshot';
import type { PublicBoardSnapshot } from '@robot-jobs-board/snapshot';

const RUNTIME_CACHE_KEY = 'manual-featured-open-v1';
const RUNTIME_CACHE_NAMESPACE = 'robot-jobs-board-manual-featured';

function runtimeTtlSeconds(): number {
  const raw = process.env.MANUAL_FEATURED_STATUS_TTL_SECONDS?.trim();
  const seconds = raw ? Number(raw) : 86_400;
  return Number.isFinite(seconds) && seconds > 0 ? seconds : 86_400;
}

const RUNTIME_CACHE_TTL_SECONDS = runtimeTtlSeconds();
const MEMORY_TTL_MS = 60_000;

type MemoryOpen = { open: boolean; until: number };

let memoryOpen: MemoryOpen | null = null;
let inflightOpen: Promise<boolean> | null = null;

function manualFeaturedRuntimeCache() {
  return getCache({ namespace: RUNTIME_CACHE_NAMESPACE });
}

async function readRuntimeOpenFlag(): Promise<boolean | undefined> {
  try {
    const value = await manualFeaturedRuntimeCache().get(RUNTIME_CACHE_KEY);
    return typeof value === 'boolean' ? value : undefined;
  } catch {
    return undefined;
  }
}

async function writeRuntimeOpenFlag(open: boolean): Promise<void> {
  try {
    await manualFeaturedRuntimeCache().set(RUNTIME_CACHE_KEY, open, {
      ttl: RUNTIME_CACHE_TTL_SECONDS,
      name: 'manual-featured-open',
    });
  } catch {
    // Runtime Cache unavailable outside Vercel — module cache in snapshot package still applies.
  }
}

async function resolveManualFeaturedOpen(): Promise<boolean> {
  const now = Date.now();
  if (memoryOpen && memoryOpen.until > now) return memoryOpen.open;

  const fromRuntime = await readRuntimeOpenFlag();
  if (typeof fromRuntime === 'boolean') {
    memoryOpen = { open: fromRuntime, until: now + MEMORY_TTL_MS };
    return fromRuntime;
  }

  if (!inflightOpen) {
    inflightOpen = (async () => {
      try {
        const open = await isManualFeaturedMicro1Open();
        memoryOpen = { open, until: Date.now() + MEMORY_TTL_MS };
        await writeRuntimeOpenFlag(open);
        return open;
      } finally {
        inflightOpen = null;
      }
    })();
  }

  return inflightOpen;
}

export const loadActiveManualFeaturedJobs = cache(async () => {
  const open = await resolveManualFeaturedOpen();
  if (!open) return [];
  return manualFeaturedJobs();
});

export async function applyLiveManualFeaturedToSnapshot(
  snapshot: PublicBoardSnapshot,
): Promise<PublicBoardSnapshot> {
  const manual = await loadActiveManualFeaturedJobs();
  return applyManualFeaturedToSnapshot(snapshot, manual);
}

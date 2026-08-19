'use client';

import { Heart } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'robot-jobs-board-saved';
const LEGACY_STORAGE_KEY = 'robot-roles-saved';

function readSaved(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    const ids = Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
    if (ids.length && !window.localStorage.getItem(STORAGE_KEY)) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    }
    return ids;
  } catch {
    return [];
  }
}

export function SaveJobButton({ jobId, title }: { jobId: string; title: string }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(readSaved().includes(jobId));
  }, [jobId]);

  function toggle() {
    const current = readSaved();
    const next = current.includes(jobId) ? current.filter((id) => id !== jobId) : [...current, jobId];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSaved(next.includes(jobId));
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${title} from saved jobs` : `Save ${title}`}
      className="flex h-10 w-10 items-center justify-center rounded-lg bg-chip text-foreground transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-accent focus-visible:ring-2 focus-visible:ring-accent active:scale-[0.98]"
    >
      <Heart size={18} weight={saved ? 'fill' : 'regular'} className={saved ? 'text-accent' : undefined} />
    </button>
  );
}

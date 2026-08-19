'use client';

import { useState, useTransition } from 'react';
import { syncJobsNow } from './actions';

export function SyncNowButton() {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState('');

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const result = await syncJobsNow();
            setMessage(result.message);
          })
        }
        className="h-10 rounded-lg bg-foreground px-3 text-sm font-semibold text-background disabled:opacity-60 active:scale-[0.98]"
      >
        {pending ? 'Syncing boards…' : 'Sync boards now'}
      </button>
      {message ? <p className="text-sm text-muted">{message}</p> : null}
    </div>
  );
}

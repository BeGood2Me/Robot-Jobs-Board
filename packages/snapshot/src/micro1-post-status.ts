export const MICRO1_MANUAL_POST_ID = 'cfaf2d70-673a-4edb-aeba-558fcf33eb9a';

export function micro1PostPageUrl(postId: string): string {
  return `https://jobs.micro1.ai/post/${postId}`;
}

/** micro1 embeds escaped JSON in the RSC/HTML payload, e.g. `\"job_status\":\"open\"`. */
export function parseMicro1JobStatusFromMarkup(markup: string): string | null {
  const escaped = markup.match(/\\"job_status\\":\\"([^\\"]+)\\"/i);
  if (escaped?.[1]) return escaped[1].toLowerCase();

  const plain = markup.match(/"job_status"\s*:\s*"([^"]+)"/i);
  return plain?.[1]?.toLowerCase() ?? null;
}

export function isMicro1JobStatusOpen(status: string | null): boolean {
  if (status === 'not_found') return false;
  return status === 'open';
}

export async function fetchMicro1JobStatus(
  postId: string,
  init?: RequestInit,
): Promise<string | null> {
  const url = micro1PostPageUrl(postId);
  try {
    const res = await fetch(url, {
      ...init,
      redirect: 'follow',
      headers: {
        Accept: 'text/html',
        'User-Agent': 'RobotJobsBoard/1.0 (+https://www.robotjobsboard.com)',
        ...(init?.headers ?? {}),
      },
      signal: init?.signal ?? AbortSignal.timeout(15_000),
    });
    if (res.status === 404) return 'not_found';
    if (!res.ok) return null;
    const markup = await res.text();
    return parseMicro1JobStatusFromMarkup(markup);
  } catch {
    return null;
  }
}

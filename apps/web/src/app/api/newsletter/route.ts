import { NextResponse } from 'next/server';

const BUTTONDOWN_API = 'https://api.buttondown.com/v1/subscribers';

function clientIp(request: Request): string | undefined {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim();
  return request.headers.get('x-real-ip') ?? undefined;
}

export async function POST(request: Request) {
  const apiKey = process.env.BUTTONDOWN_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Newsletter signup is not configured yet. Try again soon.' },
      { status: 503 },
    );
  }

  let body: { email?: string; source?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }

  const source =
    typeof body.source === 'string' && body.source.trim() ? body.source.trim().slice(0, 64) : 'website';

  const ip = clientIp(request);
  const payload: Record<string, unknown> = {
    email_address: email,
    metadata: { source },
  };
  if (ip) payload.ip_address = ip;

  const response = await fetch(BUTTONDOWN_API, {
    method: 'POST',
    headers: {
      Authorization: `Token ${apiKey}`,
      'Content-Type': 'application/json',
      'X-Buttondown-Collision-Behavior': 'add',
    },
    body: JSON.stringify(payload),
  });

  if (response.ok || response.status === 201) {
    return NextResponse.json({ ok: true });
  }

  let detail = 'Could not subscribe. Try again.';
  try {
    const err = (await response.json()) as { detail?: string; code?: string; email_address?: string[] };
    if (typeof err.detail === 'string') detail = err.detail;
    else if (Array.isArray(err.email_address) && err.email_address[0]) detail = err.email_address[0];
    // Already subscribed / collision — treat as success for the visitor.
    if (response.status === 400 && /already|exist|collision/i.test(JSON.stringify(err))) {
      return NextResponse.json({ ok: true });
    }
  } catch {
    // ignore parse errors
  }

  if (response.status === 429) {
    return NextResponse.json({ error: 'Too many signup attempts. Try again later.' }, { status: 429 });
  }

  console.error('Buttondown subscribe failed', response.status, detail);
  return NextResponse.json({ error: detail }, { status: response.status >= 400 ? response.status : 502 });
}

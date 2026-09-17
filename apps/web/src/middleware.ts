import { NextResponse, type NextRequest } from 'next/server';
import { filtersFromSearchParams, isDefaultBoardListing } from '@/lib/job-filter-utils';

/** Scrapers that amplify ISR/CPU without meaningful referral traffic. */
const BLOCKED_BOTS =
  /GPTBot|ChatGPT-User|CCBot|anthropic-ai|ClaudeBot|Claude-Web|Bytespider|DataForSeoBot|AhrefsBot|SemrushBot|DotBot|PetalBot|Amazonbot|meta-externalagent|ImagesiftBot|magpie-crawler|SeekportBot|BLEXBot|MJ12bot|AhrefsSiteAudit|SemrushBot-BA|AwarioBot|Diffbot|omgili|YouBot/i;

function paramsFromSearch(searchParams: URLSearchParams): Record<string, string | string[]> {
  const params: Record<string, string | string[]> = {};
  for (const key of new Set(searchParams.keys())) {
    const values = searchParams.getAll(key);
    params[key] = values.length > 1 ? values : values[0]!;
  }
  return params;
}

export function middleware(request: NextRequest) {
  const ua = request.headers.get('user-agent') ?? '';
  if (BLOCKED_BOTS.test(ua)) {
    return new NextResponse('Blocked', { status: 403 });
  }

  const { pathname, searchParams } = request.nextUrl;

  // Keep `/` fully ISR-cacheable; serve filtered board via internal rewrite.
  if (pathname === '/' && searchParams.toString()) {
    const filters = filtersFromSearchParams(paramsFromSearch(searchParams));
    if (!isDefaultBoardListing(filters)) {
      const rewriteUrl = request.nextUrl.clone();
      rewriteUrl.pathname = '/board';
      const response = NextResponse.rewrite(rewriteUrl);
      response.headers.set('x-robots-tag', 'noindex, follow');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Skip static assets and the snapshot files themselves.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|xml|txt|gz)$).*)',
  ],
};

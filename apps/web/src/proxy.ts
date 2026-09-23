import { NextResponse, type NextRequest } from 'next/server';

/** Scrapers that amplify ISR/CPU without meaningful referral traffic. */
const BLOCKED_BOTS =
  /GPTBot|ChatGPT-User|CCBot|anthropic-ai|ClaudeBot|Claude-Web|Bytespider|DataForSeoBot|AhrefsBot|SemrushBot|DotBot|PetalBot|Amazonbot|meta-externalagent|ImagesiftBot|magpie-crawler|SeekportBot|BLEXBot|MJ12bot|AhrefsSiteAudit|SemrushBot-BA|AwarioBot|Diffbot|omgili|YouBot/i;

/** Query keys that make `/` a filtered board (must not share the ISR cache with bare `/`). */
const BOARD_FILTER_KEY =
  /^(?:q|domain|domains|tag|tags|seniority|seniorities|country|countries|region|city|workplace|employment|intern|entry|remote|sort|page)$/;

/** True when search should hit `/board` instead of the cached homepage. */
function needsFilteredBoardRewrite(searchParams: URLSearchParams): boolean {
  for (const key of searchParams.keys()) {
    if (!BOARD_FILTER_KEY.test(key)) continue;
    if (key === 'page' && (searchParams.get('page') === '1' || searchParams.get('page') === '')) {
      continue;
    }
    if (key === 'sort' && searchParams.get('sort') === 'newest') continue;
    return true;
  }
  return false;
}

export function proxy(request: NextRequest) {
  const ua = request.headers.get('user-agent') ?? '';
  if (BLOCKED_BOTS.test(ua)) {
    return new NextResponse('Blocked', { status: 403 });
  }

  const { pathname, searchParams } = request.nextUrl;

  // Keep `/` fully ISR-cacheable; serve filtered board via internal rewrite.
  if (pathname === '/' && searchParams.toString() && needsFilteredBoardRewrite(searchParams)) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = '/board';
    const response = NextResponse.rewrite(rewriteUrl);
    response.headers.set('x-robots-tag', 'noindex, follow');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Only HTML surfaces + public JSON APIs scrapers hit.
     * Skipping /api/cron|/revalidate|/admin|/snapshot and static assets
     * cuts middleware Active CPU (~18% of the meter) without dropping bot shields.
     */
    '/',
    '/board',
    '/jobs',
    '/jobs/:path*',
    '/companies',
    '/companies/:path*',
    '/locations/:path*',
    '/robots/:path*',
    '/guides',
    '/guides/:path*',
    '/post-a-job',
    '/privacy',
    '/terms',
    '/mcp',
    '/api/jobs',
    '/api/jobs/:path*',
    '/api/facets',
    '/api/companies',
    '/api/companies/:path*',
    '/api/mcp',
  ],
};

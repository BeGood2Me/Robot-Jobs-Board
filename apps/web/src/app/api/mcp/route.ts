import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { createServer } from '@robot-jobs-board/mcp/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Accept, Authorization, Mcp-Session-Id, Last-Event-ID, MCP-Protocol-Version',
  'Access-Control-Expose-Headers': 'Mcp-Session-Id',
};

function withCors(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function methodNotAllowed(): Response {
  return withCors(
    new Response(
      JSON.stringify({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Method not allowed.',
        },
        id: null,
      }),
      {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      },
    ),
  );
}

/**
 * Stateless Streamable HTTP: create a fresh McpServer + transport per request.
 * Reusing one transport (as mcp-handler 1.0.6 does) returns empty HTTP 500 after
 * the first initialize on warm serverless isolates.
 */
async function handleMcpPost(request: Request): Promise<Response> {
  const server = createServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    // JSON responses avoid SSE keep-alive hanging serverless functions.
    enableJsonResponse: true,
  });

  await server.connect(transport);
  try {
    return withCors(await transport.handleRequest(request));
  } finally {
    // Safe once enableJsonResponse has fully buffered the body.
    await Promise.allSettled([transport.close(), server.close()]);
  }
}

export async function OPTIONS() {
  return withCors(new Response(null, { status: 204 }));
}

export async function GET() {
  return methodNotAllowed();
}

export async function DELETE() {
  return methodNotAllowed();
}

export async function POST(request: Request) {
  try {
    return await handleMcpPost(request);
  } catch (error) {
    console.error('MCP POST error:', error);
    return withCors(
      new Response(
        JSON.stringify({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal server error',
          },
          id: null,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );
  }
}

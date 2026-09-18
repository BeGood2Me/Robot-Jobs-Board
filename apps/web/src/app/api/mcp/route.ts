import { createMcpHandler } from 'mcp-handler';
import { registerRobotJobsBoard } from '@robot-jobs-board/mcp/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const mcpHandler = createMcpHandler(
  (server) => {
    registerRobotJobsBoard(server);
  },
  {
    serverInfo: {
      name: 'robot-jobs-board',
      version: '0.1.0',
    },
  },
  {
    basePath: '/api',
    // Stateless Streamable HTTP only — works on Vercel without Redis.
    disableSse: true,
    maxDuration: 60,
    verboseLogs: false,
  },
);

function withCors(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Accept, Authorization, Mcp-Session-Id, Last-Event-ID',
  );
  headers.set('Access-Control-Expose-Headers', 'Mcp-Session-Id');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export async function OPTIONS() {
  return withCors(new Response(null, { status: 204 }));
}

export async function GET(request: Request) {
  return withCors(await mcpHandler(request));
}

export async function POST(request: Request) {
  return withCors(await mcpHandler(request));
}

export async function DELETE(request: Request) {
  return withCors(await mcpHandler(request));
}

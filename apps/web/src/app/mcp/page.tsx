import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'MCP server',
  description:
    'Connect Cursor, Claude, Grok Bot, and other MCP clients to Robot Jobs Board job search tools over the public internet.',
};

const MCP_URL = 'https://www.robotjobsboard.com/api/mcp';

export default function McpPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-wide text-muted">For agents</p>
      <h1 className="mt-2 text-4xl font-semibold">Robot Jobs Board MCP</h1>
      <p className="mt-4 text-muted">
        Public Model Context Protocol endpoint for searching robotics jobs, companies, and facets. No API key. Remote
        Streamable HTTP — works from Cursor, Claude, Grok Bot, and other MCP clients.
      </p>

      <section className="mt-10 space-y-3">
        <h2 className="text-xl font-semibold">Endpoint</h2>
        <code className="block overflow-x-auto rounded-lg border border-line bg-card px-3 py-2 text-sm">{MCP_URL}</code>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-xl font-semibold">Tools</h2>
        <ul className="list-disc space-y-2 pl-5 text-muted">
          <li>
            <span className="font-semibold text-foreground">search_jobs</span> — query open roles by text, domain, tag,
            seniority, country, workplace, and more
          </li>
          <li>
            <span className="font-semibold text-foreground">get_job</span> — full job detail and related roles
          </li>
          <li>
            <span className="font-semibold text-foreground">list_companies</span> /{' '}
            <span className="font-semibold text-foreground">get_company</span> — company directory and open jobs
          </li>
          <li>
            <span className="font-semibold text-foreground">list_facets</span> — valid filter values for search
          </li>
        </ul>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-xl font-semibold">Cursor / Claude Desktop</h2>
        <pre className="overflow-x-auto rounded-lg border border-line bg-card p-3 text-sm text-foreground">{`{
  "mcpServers": {
    "robot-jobs-board": {
      "url": "${MCP_URL}"
    }
  }
}`}</pre>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-xl font-semibold">Grok Bot / Grok CLI</h2>
        <pre className="overflow-x-auto rounded-lg border border-line bg-card p-3 text-sm text-foreground">{`[mcp_servers.robot-jobs-board]
url = "${MCP_URL}"
startup_timeout_sec = 60`}</pre>
      </section>

      <p className="mt-10 text-sm text-muted">
        Prefer applying on the employer ATS. This MCP only reads the public board — it does not submit applications.{' '}
        <Link href="/" className="font-semibold text-accent underline-offset-4 hover:underline">
          Browse jobs
        </Link>
      </p>
    </div>
  );
}

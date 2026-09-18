import { createServer } from './server';

type ToolMap = Record<
  string,
  {
    handler: (args: Record<string, unknown>) => Promise<{ content?: Array<{ text?: string }>; isError?: boolean }>;
  }
>;

async function call(tools: ToolMap, name: string, args: Record<string, unknown> = {}) {
  const tool = tools[name];
  if (!tool) throw new Error(`Missing tool: ${name}`);
  const result = await tool.handler(args);
  const text = result.content?.[0]?.text ?? JSON.stringify(result);
  if (result.isError) throw new Error(`${name} failed: ${text}`);
  console.log(`== ${name} ==`);
  console.log(text.slice(0, 700));
  console.log();
  return JSON.parse(text) as unknown;
}

async function main() {
  const server = createServer();
  const tools = (server as unknown as { _registeredTools: ToolMap })._registeredTools;

  await call(tools, 'list_facets');
  const search = (await call(tools, 'search_jobs', { q: 'perception', page: 1 })) as {
    total: number;
    jobs: Array<{ id: string }>;
  };
  if (!search.jobs[0]) throw new Error('search_jobs returned no jobs');
  await call(tools, 'get_job', { id: search.jobs[0].id });
  await call(tools, 'list_companies', { q: 'figure', limit: 5 });
  await call(tools, 'get_company', { slug: 'figure' });
  console.log('smoke ok');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

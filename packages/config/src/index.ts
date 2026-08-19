import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().min(1).optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),
  INGEST_INACTIVE_AFTER_DAYS: z.coerce.number().int().positive().default(3),
  JOB_LISTINGS_API_KEY: z.string().optional().default(''),
  JOB_LISTINGS_API_BASE_URL: z.string().url().optional().default('https://api.joblistingsapi.com/v1'),
  OPENAI_API_KEY: z.string().optional().default(''),
  ANTHROPIC_API_KEY: z.string().optional().default(''),
  CRON_SECRET: z.string().optional().default(''),
  ADMIN_SECRET: z.string().optional().default(''),
  NODE_ENV: z.enum(['development', 'test', 'production']).optional().default('development'),
});

export type AppEnv = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid environment: ${issues}`);
  }
  return parsed.data;
}

export function getSiteUrl(env: Pick<AppEnv, 'NEXT_PUBLIC_SITE_URL'> = loadEnv()): string {
  return env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
}

import { z } from "zod";

const schema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z
    .string()
    .url()
    .default("postgresql://aireport:aireport@localhost:5432/aireport"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  DEFAULT_TENANT_ID: z.string().uuid().default("11111111-1111-1111-1111-111111111111"),
  DEFAULT_USER_ID: z.string().uuid().default("22222222-2222-2222-2222-222222222222"),
  AI_PROVIDER: z.enum(["openai", "azure", "anthropic"]).default("openai"),
  AI_API_KEY: z.string().default(""),
  AI_MODEL: z.string().default("gpt-4o"),
  JWT_SECRET: z.string().min(8).default("dev-secret-change-in-production"),
  JWT_EXPIRES_IN: z.string().default("7d"),
});

export const env = schema.parse(process.env);
export type Env = z.infer<typeof schema>;

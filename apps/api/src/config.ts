import { config as loadEnv } from "dotenv";
import { z } from "zod";

loadEnv({ path: ".env.local" });

const integerString = z.string().regex(/^\d+$/);

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).optional(),
  PORT: integerString.optional(),
  CORS_ORIGIN: z.string().url().optional(),
  DATABASE_PATH: z.string().min(1).optional(),
  SESSION_COOKIE_NAME: z.string().min(1).optional(),
  SESSION_TTL_SECONDS: integerString.optional(),
  BOOTSTRAP_SUPERADMIN_USERNAME: z.string().min(1).optional(),
  BOOTSTRAP_SUPERADMIN_PASSWORD: z.string().min(1).optional(),
  BOOTSTRAP_SUPERADMIN_FULL_NAME: z.string().min(1).optional(),
  PUBLISH_WORKER_POLL_MS: integerString.optional(),
  PUBLISH_MAX_RETRIES: integerString.optional(),
  PUBLISH_RETRY_DELAY_MS: integerString.optional(),
  GEMINI_MODEL: z.string().min(1).optional(),
  GEMINI_API_KEY: z.string().min(1).optional(),
  TAVILY_API_KEY: z.string().min(1).optional(),
  SEMRUSH_PROXY_TOKEN: z.string().min(1).optional(),
  KEYWORD_VOLUME_PROVIDER_ORDER: z.string().min(1).optional(),
  KEYWORD_VOLUME_CACHE_TTL_DAYS: integerString.optional(),
  KEYWORD_VOLUME_COUNTRY: z.string().min(2).optional(),
  KEYWORD_VOLUME_METRICS_LANGUAGE: z.string().min(2).optional(),
  DATAFORSEO_LOGIN: z.string().min(1).optional(),
  DATAFORSEO_PASSWORD: z.string().min(1).optional(),
  DATAFORSEO_BASIC_AUTH: z.string().min(1).optional(),
  DATAFORSEO_LOCATION_NAME_VI: z.string().min(1).optional(),
  DATAFORSEO_LANGUAGE_NAME_VI: z.string().min(1).optional(),
  DATAFORSEO_LOCATION_NAME_EN: z.string().min(1).optional(),
  DATAFORSEO_LANGUAGE_NAME_EN: z.string().min(1).optional(),
  AHREFS_API_KEY: z.string().min(1).optional(),
  KEYWORDTOOL_API_KEY: z.string().min(1).optional(),
  KEYWORDTOOL_ENGINE: z.string().min(1).optional()
}).passthrough().superRefine((value, context) => {
  if (value.NODE_ENV === "production" && (!value.BOOTSTRAP_SUPERADMIN_PASSWORD || value.BOOTSTRAP_SUPERADMIN_PASSWORD.length < 8)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "BOOTSTRAP_SUPERADMIN_PASSWORD must be at least 8 characters in production.",
      path: ["BOOTSTRAP_SUPERADMIN_PASSWORD"]
    });
  }
});

export const env = envSchema.parse(process.env);

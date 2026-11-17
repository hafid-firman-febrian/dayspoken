import { z } from 'zod';

// Public configuration only. EXPO_PUBLIC_* values ship inside the app bundle,
// so anyone can read them: never put a secret here.
const schema = z.object({
  EXPO_PUBLIC_APP_ENV: z.enum(['development', 'production']).default('development'),
  // Checked by parseSupabase below, which has its own error messages (the key must never be
  // repeated in an error).
  EXPO_PUBLIC_SUPABASE_URL: z.string().optional(),
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
});

export type SupabaseEnv = {
  url: string;
  publishableKey: string;
};

export type Env = {
  appEnv: z.infer<typeof schema>['EXPO_PUBLIC_APP_ENV'];
  // Absent when neither Supabase variable is set, so the app, the tests, and CI work
  // without a backend.
  supabase?: SupabaseEnv;
};

type RawEnv = Record<string, string | undefined>;

function describeIssue(issue: z.core.$ZodIssue): string {
  if (issue.code === 'invalid_value') {
    return `expected one of ${issue.values.join(', ')}`;
  }
  return issue.message;
}

const URL_VAR = 'EXPO_PUBLIC_SUPABASE_URL';
const KEY_VAR = 'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY';
const PUBLISHABLE_PREFIX = 'sb_publishable_';
const SECRET_PREFIX = 'sb_secret_';
// React Native's built-in URL does not validate, so the address is checked with a pattern.
const HTTP_URL = /^(https?):\/\/[^\s/?#]+([/?#]\S*)?$/i;

// Both variables or neither. Errors never contain the key, only its name and expected prefix.
function parseSupabase(
  url: string | undefined,
  key: string | undefined,
  appEnv: Env['appEnv'],
): SupabaseEnv | undefined {
  if (url === undefined && key === undefined) {
    return undefined;
  }
  if (url === undefined) {
    throw new Error(`Invalid ${URL_VAR}: required when ${KEY_VAR} is set`);
  }
  if (key === undefined) {
    throw new Error(`Invalid ${KEY_VAR}: required when ${URL_VAR} is set`);
  }

  if (key.startsWith(SECRET_PREFIX)) {
    throw new Error(
      `Invalid ${KEY_VAR}: this is a secret key (${SECRET_PREFIX}...). A secret key must never be in the app: use the publishable key (${PUBLISHABLE_PREFIX}...)`,
    );
  }
  if (!key.startsWith(PUBLISHABLE_PREFIX)) {
    throw new Error(
      `Invalid ${KEY_VAR}: expected a publishable key that starts with ${PUBLISHABLE_PREFIX} (the legacy anon key is not accepted)`,
    );
  }

  const match = HTTP_URL.exec(url);
  if (!match) {
    throw new Error(`Invalid ${URL_VAR}: expected an http or https URL (received "${url}")`);
  }
  if (appEnv === 'production' && match[1].toLowerCase() !== 'https') {
    throw new Error(`Invalid ${URL_VAR}: production needs https (received "${url}")`);
  }

  return { url, publishableKey: key };
}

export function parseEnv(raw: RawEnv): Env {
  const cleaned: RawEnv = {};
  for (const [key, value] of Object.entries(raw)) {
    cleaned[key] = value === '' ? undefined : value;
  }

  const result = schema.safeParse(cleaned);
  if (!result.success) {
    const issue = result.error.issues[0];
    const name = String(issue.path[0]);
    throw new Error(`Invalid ${name}: ${describeIssue(issue)} (received "${cleaned[name]}")`);
  }

  const appEnv = result.data.EXPO_PUBLIC_APP_ENV;
  const supabase = parseSupabase(
    result.data.EXPO_PUBLIC_SUPABASE_URL,
    result.data.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    appEnv,
  );

  // The supabase key is left out (not set to undefined) when it is not configured.
  return supabase ? { appEnv, supabase } : { appEnv };
}

// Expo inlines EXPO_PUBLIC_* values at build time only for static
// `process.env.NAME` access, so each variable is listed by name here.
export const env = parseEnv({
  EXPO_PUBLIC_APP_ENV: process.env.EXPO_PUBLIC_APP_ENV,
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
});

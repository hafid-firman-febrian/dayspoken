import { z } from 'zod';

// Public configuration only. EXPO_PUBLIC_* values ship inside the app bundle,
// so anyone can read them: never put a secret here.
const schema = z.object({
  EXPO_PUBLIC_APP_ENV: z.enum(['development', 'production']).default('development'),
});

export type Env = {
  appEnv: z.infer<typeof schema>['EXPO_PUBLIC_APP_ENV'];
};

type RawEnv = Record<string, string | undefined>;

function describeIssue(issue: z.core.$ZodIssue): string {
  if (issue.code === 'invalid_value') {
    return `expected one of ${issue.values.join(', ')}`;
  }
  return issue.message;
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

  return { appEnv: result.data.EXPO_PUBLIC_APP_ENV };
}

// Expo inlines EXPO_PUBLIC_* values at build time only for static
// `process.env.NAME` access, so each variable is listed by name here.
export const env = parseEnv({
  EXPO_PUBLIC_APP_ENV: process.env.EXPO_PUBLIC_APP_ENV,
});

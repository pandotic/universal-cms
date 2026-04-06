/**
 * Validate that required environment variables are set.
 * Call at app startup (e.g. in instrumentation.ts or a layout server component).
 */

export const requiredCmsEnvVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

export const requiredServerEnvVars = [
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

export function validateEnv(
  vars: readonly string[] = requiredCmsEnvVars
): { valid: boolean; missing: string[] } {
  const missing = vars.filter((v) => !process.env[v]);
  return { valid: missing.length === 0, missing };
}

export function validateEnvOrThrow(
  vars: readonly string[] = requiredCmsEnvVars
): void {
  const { valid, missing } = validateEnv(vars);
  if (!valid) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }
}

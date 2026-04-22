import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PORT ?? 3001);
const BASE_URL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        // Build + start (production mode) — turbopack dev mode loads the
        // whole app on first request and is too flaky for smoke tests.
        command: "pnpm build && pnpm start --port " + PORT,
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
        // Smoke tests run unauthenticated against the missing-config flow,
        // so deliberately do NOT pass NEXT_PUBLIC_SUPABASE_URL — the
        // middleware redirects everything to /setup/missing-config.
        env: {
          PORT: String(PORT),
        },
      },
});

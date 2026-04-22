import { expect, test } from "@playwright/test";

// Smoke tests run with NO Supabase env vars. The middleware redirects
// every protected route to /setup/missing-config, which means these
// tests verify that the Next.js app boots, middleware runs, the
// missing-config page renders, and routing works end-to-end — without
// any external dependencies.

test("missing-config page renders with setup instructions", async ({ page }) => {
  const response = await page.goto("/setup/missing-config");
  expect(response?.status()).toBe(200);
  await expect(
    page.getByRole("heading", { name: /Supabase isn.?t configured yet/i })
  ).toBeVisible();
  await expect(page.getByText(/NEXT_PUBLIC_SUPABASE_URL/)).toBeVisible();
});

test("root redirects unauthenticated users to missing-config", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/setup\/missing-config$/);
});

test("protected routes redirect to missing-config", async ({ page }) => {
  for (const path of ["/properties", "/team-hub", "/social", "/skills"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/setup\/missing-config$/);
  }
});

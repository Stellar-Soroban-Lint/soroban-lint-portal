import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env["E2E_PORT"] ?? 3100);

/**
 * When `E2E_BASE_URL` is set the suite runs against that origin and no local
 * server is started — the same tests, local or deployed. Locally the portal is
 * tested through the production build, served exactly as a user would receive it.
 */
const BASE_URL = process.env["E2E_BASE_URL"] ?? `http://127.0.0.1:${PORT}`;
const LOCAL = process.env["E2E_BASE_URL"] === undefined;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: process.env["CI"] ? "github" : "list",
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: LOCAL
    ? {
        command: `npm run build && npm run start -- --port ${PORT}`,
        url: `http://127.0.0.1:${PORT}`,
        reuseExistingServer: !process.env["CI"],
        timeout: 240_000,
        stdout: "pipe",
        stderr: "pipe",
      }
    : undefined,
});

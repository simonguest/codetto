/// <reference types="node" />
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",

  // Each test has up to 2 minutes — Pyodide WASM takes time to load
  timeout: 120_000,

  // Assertion timeout
  expect: { timeout: 60_000 },

  // Don't run tests in parallel — Pyodide is memory/CPU intensive
  fullyParallel: false,
  workers: 1,

  // Retry once on CI to handle flaky Pyodide initialisation
  retries: process.env.CI ? 1 : 0,

  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["html", { open: "on-failure" }]],

  use: {
    baseURL: "http://localhost:55000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    command: "npm run dev",
    url: "http://localhost:55000",
    // Reuse a running dev server locally; always start fresh in CI
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});

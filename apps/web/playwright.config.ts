import { defineConfig, devices } from "@playwright/test";

const browserChannel = process.env.PLAYWRIGHT_BROWSER_CHANNEL ?? "chrome";

export default defineConfig({
  testDir: "./e2e",
  webServer: {
    command: "pnpm exec next dev --hostname 127.0.0.1 --port 5173",
    url: "http://127.0.0.1:5173/vi-vn/markets",
    reuseExistingServer: true
  },
  use: {
    baseURL: "http://127.0.0.1:5173",
    channel: browserChannel
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } }
  ]
});

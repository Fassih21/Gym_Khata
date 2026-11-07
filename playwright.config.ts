import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config({ path: ".env.test" });

// Lovable ka dev server hamesha 8080 par chalta hai (strictPort).
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:8080";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1, // rate limit (60 inserts/min per gym) se bachne ke liye ek ke baad ek
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"], storageState: "e2e/.auth/gymA.json" },
      dependencies: ["setup"],
      testIgnore: /(auth\.setup\.ts|login\.spec\.ts)/,
    },
    {
      name: "login",
      use: { ...devices["Pixel 7"] },
      testMatch: /login\.spec\.ts/,
    },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npm run dev",
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
      },
});

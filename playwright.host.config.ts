import { defineConfig } from "@playwright/test";
const hostTestPort = Number(process.env.HOST_TEST_PORT || 5179);
export default defineConfig({
  testDir: "./tests/browser",
  testMatch: "host-routing.spec.ts",
  workers: 1,
  use: { baseURL: `http://127.0.0.1:${hostTestPort}` },
  webServer: {
    command: `npm run start:website -- --port=${hostTestPort}`,
    url: `http://127.0.0.1:${hostTestPort}`,
    reuseExistingServer: false,
    timeout: 30000,
  },
});

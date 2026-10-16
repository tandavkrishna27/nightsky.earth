import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  testMatch: "host-routing.spec.ts",
  workers: 1,
  use: { baseURL: "http://127.0.0.1:5179" },
  webServer: {
    command: "npm run start:website -- --port=5179",
    url: "http://127.0.0.1:5179",
    reuseExistingServer: false,
    timeout: 30000,
  },
});

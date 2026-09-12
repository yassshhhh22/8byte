import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  reporter: "line",
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:5173",
    channel: "chrome",
    colorScheme: "dark",
    actionTimeout: 8_000,
    navigationTimeout: 10_000,
  },
  webServer: {
    command: "node ../node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5173",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: true,
  },
});

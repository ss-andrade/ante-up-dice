import { defineConfig, devices } from "@playwright/test";
import { execFileSync } from "node:child_process";

const port =
  process.env.PLAYWRIGHT_PORT ??
  execFileSync(
    process.execPath,
    [
      "-e",
      "const server=require('node:net').createServer();server.listen(0,'127.0.0.1',()=>{process.stdout.write(String(server.address().port));server.close()})",
    ],
    { encoding: "utf8" },
  ).trim();
process.env.PLAYWRIGHT_PORT = port;
const baseURL = `http://127.0.0.1:${port}/ante-up-dice/`;

export default defineConfig({
  testDir: "./e2e",
  webServer: {
    command: `npm run dev -- --host 127.0.0.1 --port ${port}`,
    url: baseURL,
    reuseExistingServer: false,
  },
  use: { baseURL },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
});

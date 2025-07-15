import { defineConfig, devices } from "@playwright/test"

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./tests",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ["html"],
    ["json", { outputFile: "test-results/results.json" }]
  ],
  /* Output directory for screenshots and other test artifacts */
  outputDir: "test-results",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: "http://localhost:5173",

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
    
    /* Screenshot settings */
    screenshot: "only-on-failure",
    
    /* Video recording settings */
    video: "retain-on-failure",
  },
  
  /* Visual comparison settings */
  expect: {
    /* Global visual comparison threshold */
    threshold: 0.1,
    
    /* Visual comparison mode */
    toHaveScreenshot: {
      mode: "css",
      caret: "hide",
      scale: "css",
      animations: "disabled",
    },
    
    /* Maximum allowed pixel difference for visual comparisons */
    toMatchSnapshot: {
      threshold: 0.1,
      maxDiffPixels: 1000,
    },
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: [
    {
      command: "cd ../../apps/server && npm run dev:test",
      reuseExistingServer: !process.env.CI,
      port: 9000,
      timeout: 120 * 1000,
    },
    {
      command: "npm run dev",
      reuseExistingServer: !process.env.CI,
      port: 5173,
      timeout: 120 * 1000,
    },
  ],
})

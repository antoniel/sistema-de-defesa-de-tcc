import { expect, test } from "@playwright/test"

test.describe("Application Tests", () => {
  test("should load the application", async ({ page }) => {
    await page.goto("/")

    // Wait for the page to load
    await page.waitForLoadState("networkidle")

    // Check if the page loaded successfully
    await expect(page).toHaveTitle(/TCC/)
  })
})

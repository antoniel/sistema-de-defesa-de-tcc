import { test } from "@playwright/test"

test.describe("Application Tests", () => {
  test("should load the application", async ({ page }) => {
    await page.goto("/")
  })
})

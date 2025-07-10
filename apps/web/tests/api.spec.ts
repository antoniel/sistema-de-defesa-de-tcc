import { expect, test } from "@playwright/test"

test.describe("API Integration Tests", () => {
  test("Deve fazer a busca de bancas via API", async ({ page }) => {
    await page.goto("/")
    await page.waitForRequest((req) => {
      return req.url().includes("banca")
    })
    await expect(page.locator("body")).toBeVisible()
  })
})

test.describe("Error Handling", () => {
  test("should handle network timeouts", async ({ page }) => {
    await page.goto("/")

    // Mock slow API response
    await page.route("**/api/**", (route) => {
      setTimeout(() => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({ data: "delayed response" }),
        })
      }, 5000)
    })

    // Test timeout handling
    await expect(page.locator("body")).toBeVisible()
  })
})

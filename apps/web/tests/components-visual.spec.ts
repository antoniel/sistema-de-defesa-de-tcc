import { test } from "@playwright/test"
import {
  hideDynamicElements,
  takeComponentScreenshot,
  takePageScreenshot,
  VIEWPORTS,
  waitForAnimations,
} from "./utils/visual-helpers"

test.describe("Component Visual Regression Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop)
  })

  test("Navigation visual regression", async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("networkidle")
    await waitForAnimations(page)
    await hideDynamicElements(page)

    // Capture navigation area
    const nav = page.locator("nav, header").first()
    if ((await nav.count()) > 0) {
      await takeComponentScreenshot(page, "nav, header", "navigation-default.png")
    }

    // Test mobile navigation if toggle exists
    await page.setViewportSize(VIEWPORTS.mobile)
    await page.goto("/")
    await page.waitForLoadState("networkidle")
    await waitForAnimations(page)

    const mobileToggle = page.locator('[aria-label*="menu"], .menu-toggle, button:has([data-lucide="menu"])')
    if ((await mobileToggle.count()) > 0) {
      // Closed state
      await takeComponentScreenshot(page, "nav, header", "navigation-mobile-closed.png")

      // Open mobile menu
      await mobileToggle.first().click()
      await page.waitForTimeout(300) // Wait for animation
      await takeComponentScreenshot(page, "nav, header", "navigation-mobile-open.png")
    }
  })

  test("Loading states visual regression", async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("networkidle")
    await waitForAnimations(page)

    // Look for loading indicators
    const loadingElements = page.locator('[data-testid*="loading"], .loading, .spinner, [aria-label*="loading"]')

    if ((await loadingElements.count()) > 0) {
      await takeComponentScreenshot(page, '[data-testid*="loading"], .loading, .spinner', "loading-spinner.png")
    }
  })

  test("Error states visual regression", async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("networkidle")
    await waitForAnimations(page)
    await hideDynamicElements(page)

    // Try to trigger form validation errors
    const forms = page.locator("form")
    if ((await forms.count()) > 0) {
      const firstForm = forms.first()
      const submitButton = firstForm.locator('button[type="submit"], input[type="submit"]')

      if ((await submitButton.count()) > 0) {
        // Submit empty form to trigger validation
        await submitButton.click()
        await page.waitForTimeout(1000) // Wait for validation messages

        // Capture form with error messages
        await takeComponentScreenshot(page, "form", "form-with-errors.png")
      }
    }
  })

  test("Dark mode visual regression", async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("networkidle")
    await waitForAnimations(page)
    await hideDynamicElements(page)

    // Capture light mode
    await takePageScreenshot(page, "theme-light-mode.png", { fullPage: true })

    // Look for dark mode toggle
    const darkModeToggle = page.locator('[data-theme], [data-mode], button:has-text("Dark"), button:has-text("Escuro")')

    if ((await darkModeToggle.count()) > 0) {
      await darkModeToggle.first().click()
      await page.waitForTimeout(500) // Wait for theme transition

      // Capture dark mode
      await takePageScreenshot(page, "theme-dark-mode.png", { fullPage: true })
    } else {
      // Manually inject dark mode if no toggle exists
      await page.addStyleTag({
        content: `
          html, body { 
            background: #1a1a1a !important; 
            color: #ffffff !important; 
          }
          * { 
            background-color: #2a2a2a !important; 
            color: #ffffff !important; 
            border-color: #404040 !important;
          }
        `,
      })
      await takePageScreenshot(page, "theme-dark-mode-manual.png", { fullPage: true })
    }
  })

  test("Interactive elements hover states", async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("networkidle")
    await waitForAnimations(page)
    await hideDynamicElements(page)

    // Test hover on links
    const links = page.locator("a")
    if ((await links.count()) > 0) {
      const firstLink = links.first()

      // Normal state
      await takeComponentScreenshot(page, "a", "link-normal.png")

      // Hover state
      await firstLink.hover()
      await page.waitForTimeout(100)
      await takeComponentScreenshot(page, "a", "link-hover.png")
    }

    // Test hover on cards/clickable elements
    const cards = page.locator('[role="button"], .card, .clickable')
    if ((await cards.count()) > 0) {
      const firstCard = cards.first()

      await firstCard.hover()
      await page.waitForTimeout(100)
      await takeComponentScreenshot(page, '[role="button"], .card, .clickable', "card-hover.png")
    }
  })
})

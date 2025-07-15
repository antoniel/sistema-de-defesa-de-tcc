import { test, expect } from "@playwright/test"
import { createVisualHelper, setupVisualTest } from "./utils/visual-helpers"

test.describe("Visual Regression Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Setup consistent visual test environment
    await setupVisualTest(page)
    
    // Wait for page to be fully loaded before taking screenshots
    await page.goto("/")
    await page.waitForLoadState("networkidle")
  })

  test("Homepage visual regression", async ({ page }) => {
    const visual = createVisualHelper(page, "homepage")
    
    await visual.hideDynamicContent()
    await visual.waitForStableState()
    
    await visual.compareScreenshot("full", { fullPage: true })
  })

  test("Login page visual regression", async ({ page }) => {
    const visual = createVisualHelper(page, "login")
    
    // Navigate to login if it exists
    const loginButton = page.locator('a[href*="login"], button:has-text("Login"), a:has-text("Entrar")')
    
    if (await loginButton.count() > 0) {
      await loginButton.first().click()
      await visual.waitForStableState()
      await visual.hideDynamicContent()
      
      await visual.compareScreenshot("page", { fullPage: true })
    }
  })

  test("Responsive homepage visual regression", async ({ page }) => {
    const visual = createVisualHelper(page, "responsive")
    
    await visual.hideDynamicContent()
    await visual.compareResponsive("homepage", { fullPage: true })
  })

  test("Navigation components visual regression", async ({ page }) => {
    // Take screenshot of just the navigation area
    const nav = page.locator("nav, header").first()
    
    if (await nav.count() > 0) {
      await expect(nav).toHaveScreenshot("navigation.png", {
        animations: "disabled",
      })
    }
  })

  test("Forms visual regression", async ({ page }) => {
    // Look for any forms on the page
    const forms = page.locator("form")
    const formCount = await forms.count()
    
    for (let i = 0; i < Math.min(formCount, 3); i++) {
      const form = forms.nth(i)
      const formId = await form.getAttribute("id") || `form-${i}`
      
      await expect(form).toHaveScreenshot(`form-${formId}.png`, {
        animations: "disabled",
      })
    }
  })

  test("Button states visual regression", async ({ page }) => {
    // Find buttons and test different states
    const buttons = page.locator("button")
    const buttonCount = await buttons.count()
    
    if (buttonCount > 0) {
      const firstButton = buttons.first()
      
      // Normal state
      await expect(firstButton).toHaveScreenshot("button-normal.png")
      
      // Hover state
      await firstButton.hover()
      await expect(firstButton).toHaveScreenshot("button-hover.png")
      
      // Focus state (if button is focusable)
      await firstButton.focus()
      await expect(firstButton).toHaveScreenshot("button-focus.png")
    }
  })

  test("Error states visual regression", async ({ page }) => {
    // Try to trigger error states by submitting empty forms
    const forms = page.locator("form")
    
    if (await forms.count() > 0) {
      const firstForm = forms.first()
      const submitButton = firstForm.locator('button[type="submit"], input[type="submit"]')
      
      if (await submitButton.count() > 0) {
        await submitButton.click()
        
        // Wait for potential error messages
        await page.waitForTimeout(1000)
        
        await expect(firstForm).toHaveScreenshot("form-with-errors.png", {
          animations: "disabled",
        })
      }
    }
  })

  test("Dark mode visual regression", async ({ page }) => {
    // Check if dark mode toggle exists
    const darkModeToggle = page.locator('[data-theme], [data-mode], button:has-text("Dark"), button:has-text("Escuro")')
    
    if (await darkModeToggle.count() > 0) {
      await darkModeToggle.first().click()
      await page.waitForTimeout(500) // Wait for theme transition
      
      await expect(page).toHaveScreenshot("homepage-dark-mode.png", {
        fullPage: true,
        animations: "disabled",
      })
    }
  })

  test("Responsive breakpoints visual regression", async ({ page }) => {
    const breakpoints = [
      { name: "mobile", width: 375, height: 667 },
      { name: "tablet", width: 768, height: 1024 },
      { name: "desktop", width: 1920, height: 1080 },
    ]

    for (const breakpoint of breakpoints) {
      await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height })
      await page.goto("/")
      await page.waitForLoadState("networkidle")
      
      await expect(page).toHaveScreenshot(`homepage-${breakpoint.name}.png`, {
        fullPage: true,
        animations: "disabled",
      })
    }
  })
})
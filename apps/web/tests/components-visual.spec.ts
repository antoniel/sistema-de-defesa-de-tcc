import { test, expect } from "@playwright/test"
import { createVisualHelper, setupVisualTest } from "./utils/visual-helpers"

test.describe("Component Visual Regression Tests", () => {
  test.beforeEach(async ({ page }) => {
    await setupVisualTest(page)
  })

  test("Button components visual states", async ({ page }) => {
    const visual = createVisualHelper(page, "buttons")
    
    await page.goto("/")
    await visual.waitForStableState()
    await visual.hideDynamicContent()
    
    // Find all buttons on the page
    const buttons = page.locator("button")
    const buttonCount = await buttons.count()
    
    if (buttonCount > 0) {
      const firstButton = buttons.first()
      
      // Normal state
      await visual.compareElement("button", "normal")
      
      // Hover state
      await firstButton.hover()
      await visual.compareElement("button", "hover")
      
      // Focus state
      await firstButton.focus()
      await visual.compareElement("button", "focus")
    }
  })

  test("Form components visual regression", async ({ page }) => {
    const visual = createVisualHelper(page, "forms")
    
    await page.goto("/")
    await visual.waitForStableState()
    await visual.hideDynamicContent()
    
    // Look for form inputs
    const inputs = page.locator("input, textarea, select")
    const inputCount = await inputs.count()
    
    if (inputCount > 0) {
      // Normal form state
      await visual.compareElement("form", "empty", { fullPage: false })
      
      // Try to focus first input to show focus styles
      const firstInput = inputs.first()
      await firstInput.focus()
      await visual.compareElement("form", "focused", { fullPage: false })
    }
  })

  test("Navigation visual regression", async ({ page }) => {
    const visual = createVisualHelper(page, "navigation")
    
    await page.goto("/")
    await visual.waitForStableState()
    await visual.hideDynamicContent()
    
    // Capture navigation area
    const nav = page.locator("nav, header").first()
    if (await nav.count() > 0) {
      await visual.compareElement("nav, header", "default")
    }
    
    // Test mobile navigation if toggle exists
    await visual.setDevice("mobile")
    await page.goto("/")
    await visual.waitForStableState()
    
    const mobileToggle = page.locator('[aria-label*="menu"], .menu-toggle, button:has([data-lucide="menu"])')
    if (await mobileToggle.count() > 0) {
      // Closed state
      await visual.compareElement("nav, header", "mobile-closed")
      
      // Open mobile menu
      await mobileToggle.first().click()
      await page.waitForTimeout(300) // Wait for animation
      await visual.compareElement("nav, header", "mobile-open")
    }
  })

  test("Loading states visual regression", async ({ page }) => {
    const visual = createVisualHelper(page, "loading")
    
    await page.goto("/")
    await visual.waitForStableState()
    
    // Look for loading indicators
    const loadingElements = page.locator('[data-testid*="loading"], .loading, .spinner, [aria-label*="loading"]')
    
    if (await loadingElements.count() > 0) {
      await visual.compareElement('[data-testid*="loading"], .loading, .spinner', "spinner")
    }
  })

  test("Error states visual regression", async ({ page }) => {
    const visual = createVisualHelper(page, "errors")
    
    await page.goto("/")
    await visual.waitForStableState()
    await visual.hideDynamicContent()
    
    // Try to trigger form validation errors
    const forms = page.locator("form")
    if (await forms.count() > 0) {
      const firstForm = forms.first()
      const submitButton = firstForm.locator('button[type="submit"], input[type="submit"]')
      
      if (await submitButton.count() > 0) {
        // Submit empty form to trigger validation
        await submitButton.click()
        await page.waitForTimeout(1000) // Wait for validation messages
        
        // Capture form with error messages
        await visual.compareElement("form", "with-errors")
      }
    }
  })

  test("Dark mode visual regression", async ({ page }) => {
    const visual = createVisualHelper(page, "themes")
    
    await page.goto("/")
    await visual.waitForStableState()
    await visual.hideDynamicContent()
    
    // Capture light mode
    await visual.compareScreenshot("light-mode", { fullPage: true })
    
    // Look for dark mode toggle
    const darkModeToggle = page.locator('[data-theme], [data-mode], button:has-text("Dark"), button:has-text("Escuro")')
    
    if (await darkModeToggle.count() > 0) {
      await darkModeToggle.first().click()
      await page.waitForTimeout(500) // Wait for theme transition
      
      // Capture dark mode
      await visual.compareScreenshot("dark-mode", { fullPage: true })
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
        `
      })
      await visual.compareScreenshot("dark-mode-manual", { fullPage: true })
    }
  })

  test("Interactive elements hover states", async ({ page }) => {
    const visual = createVisualHelper(page, "hover")
    
    await page.goto("/")
    await visual.waitForStableState()
    await visual.hideDynamicContent()
    
    // Test hover on links
    const links = page.locator("a")
    if (await links.count() > 0) {
      const firstLink = links.first()
      
      // Normal state
      await visual.compareElement("a", "link-normal")
      
      // Hover state
      await firstLink.hover()
      await visual.compareElement("a", "link-hover")
    }
    
    // Test hover on cards/clickable elements
    const cards = page.locator('[role="button"], .card, .clickable')
    if (await cards.count() > 0) {
      const firstCard = cards.first()
      
      await firstCard.hover()
      await visual.compareElement('[role="button"], .card, .clickable', "card-hover")
    }
  })
})
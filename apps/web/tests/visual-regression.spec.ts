import { test, expect } from "@playwright/test"
import { takePageScreenshot, takeComponentScreenshot, VIEWPORTS, hideDynamicElements, waitForAnimations } from "./utils/visual-helpers"

test.describe("Visual Regression Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport for consistent screenshots
    await page.setViewportSize(VIEWPORTS.desktop)
  })

  test("home page screenshot", async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("networkidle")
    await waitForAnimations(page)
    await hideDynamicElements(page)
    
    await takePageScreenshot(page, "home-page.png", { fullPage: true })
  })

  test("login page screenshot", async ({ page }) => {
    await page.goto("/")
    
    // Navigate to login if there's a login link/button
    const loginButton = page.locator("text=Login").or(page.locator("text=Entrar")).first()
    if (await loginButton.isVisible()) {
      await loginButton.click()
      await page.waitForLoadState("networkidle")
      await waitForAnimations(page)
      await hideDynamicElements(page)
      
      await takePageScreenshot(page, "login-page.png", { fullPage: true })
    }
  })

  test("responsive mobile view", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile)
    await page.goto("/")
    await page.waitForLoadState("networkidle")
    await waitForAnimations(page)
    await hideDynamicElements(page)
    
    await takePageScreenshot(page, "home-mobile.png")
  })

  test("responsive tablet view", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.tablet)
    await page.goto("/")
    await page.waitForLoadState("networkidle")
    await waitForAnimations(page)
    await hideDynamicElements(page)
    
    await takePageScreenshot(page, "home-tablet.png")
  })

  test("responsive desktop view", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.large)
    await page.goto("/")
    await page.waitForLoadState("networkidle")
    await waitForAnimations(page)
    await hideDynamicElements(page)
    
    await takePageScreenshot(page, "home-desktop-large.png")
  })
})

test.describe("Component Visual Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop)
    await page.goto("/")
    await page.waitForLoadState("networkidle")
    await waitForAnimations(page)
    await hideDynamicElements(page)
  })

  test("navigation component", async ({ page }) => {
    const nav = page.locator("nav").first()
    if (await nav.isVisible()) {
      await takeComponentScreenshot(page, "nav", "navigation-component.png")
    }
  })

  test("footer component", async ({ page }) => {
    const footer = page.locator("footer").first()
    if (await footer.isVisible()) {
      await takeComponentScreenshot(page, "footer", "footer-component.png")
    }
  })

  test("header component", async ({ page }) => {
    const header = page.locator("header").first()
    if (await header.isVisible()) {
      await takeComponentScreenshot(page, "header", "header-component.png")
    }
  })

  test("main content area", async ({ page }) => {
    const main = page.locator("main").first()
    if (await main.isVisible()) {
      await takeComponentScreenshot(page, "main", "main-content.png")
    }
  })
})

test.describe("Form Components Visual Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop)
    await page.goto("/")
    await page.waitForLoadState("networkidle")
    await waitForAnimations(page)
    await hideDynamicElements(page)
  })

  test("forms visual regression", async ({ page }) => {
    const forms = page.locator("form")
    const formCount = await forms.count()
    
    for (let i = 0; i < Math.min(formCount, 3); i++) {
      const form = forms.nth(i)
      const formId = await form.getAttribute("id") || `form-${i}`
      
      await takeComponentScreenshot(page, `form:nth-of-type(${i + 1})`, `form-${formId}.png`)
    }
  })

  test("button states visual regression", async ({ page }) => {
    const buttons = page.locator("button")
    const buttonCount = await buttons.count()
    
    if (buttonCount > 0) {
      const firstButton = buttons.first()
      
      // Normal state
      await expect(firstButton).toHaveScreenshot("button-normal.png")
      
      // Hover state
      await firstButton.hover()
      await page.waitForTimeout(100)
      await expect(firstButton).toHaveScreenshot("button-hover.png")
      
      // Focus state (if button is focusable)
      await firstButton.focus()
      await page.waitForTimeout(100)
      await expect(firstButton).toHaveScreenshot("button-focus.png")
    }
  })
})

test.describe("Interactive Elements Visual Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop)
    await page.goto("/")
    await page.waitForLoadState("networkidle")
    await waitForAnimations(page)
    await hideDynamicElements(page)
  })

  test("error states visual regression", async ({ page }) => {
    const forms = page.locator("form")
    
    if (await forms.count() > 0) {
      const firstForm = forms.first()
      const submitButton = firstForm.locator('button[type="submit"], input[type="submit"]')
      
      if (await submitButton.count() > 0) {
        await submitButton.click()
        await page.waitForTimeout(1000)
        await waitForAnimations(page)
        
        await takeComponentScreenshot(page, "form", "form-with-errors.png")
      }
    }
  })

  test("dark mode visual regression", async ({ page }) => {
    const darkModeToggle = page.locator('[data-theme], [data-mode], button:has-text("Dark"), button:has-text("Escuro")')
    
    if (await darkModeToggle.count() > 0) {
      await darkModeToggle.first().click()
      await page.waitForTimeout(500)
      await waitForAnimations(page)
      
      await takePageScreenshot(page, "homepage-dark-mode.png", { fullPage: true })
    }
  })
})

test.describe("Comprehensive Responsive Tests", () => {
  const testPages = ["/"]
  
  for (const pagePath of testPages) {
    test(`responsive breakpoints for ${pagePath}`, async ({ page }) => {
      const breakpoints = [
        { name: "mobile", ...VIEWPORTS.mobile },
        { name: "tablet", ...VIEWPORTS.tablet },
        { name: "desktop", ...VIEWPORTS.desktop },
        { name: "large", ...VIEWPORTS.large },
      ]

      for (const breakpoint of breakpoints) {
        await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height })
        await page.goto(pagePath)
        await page.waitForLoadState("networkidle")
        await waitForAnimations(page)
        await hideDynamicElements(page)
        
        const pageName = pagePath === "/" ? "homepage" : pagePath.replace(/\//g, "-")
        await takePageScreenshot(page, `${pageName}-${breakpoint.name}.png`, { fullPage: true })
      }
    })
  }
})
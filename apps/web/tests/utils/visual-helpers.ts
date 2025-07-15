import { expect } from "@playwright/test"
import type { Page } from "@playwright/test"
import { readFile, writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import * as path from "path"

export interface ScreenshotOptions {
  fullPage?: boolean
  mask?: string[]
  threshold?: number
  clip?: {
    x: number
    y: number
    width: number
    height: number
  }
}

/**
 * Take a screenshot with consistent settings
 */
export async function takePageScreenshot(
  page: Page, 
  name: string, 
  options: ScreenshotOptions = {}
) {
  // Wait for page to be stable
  await page.waitForLoadState("networkidle")
  await page.waitForTimeout(500)
  
  // Hide dynamic elements that might cause flaky tests
  const dynamicSelectors = [
    '[data-testid="timestamp"]',
    '.loading-spinner',
    '.toast',
    '[class*="animate"]',
    ...options.mask || []
  ]
  
  // Mask dynamic content
  const maskLocators = dynamicSelectors
    .map(selector => page.locator(selector))
    .filter(async locator => await locator.count() > 0)
  
  return await expect(page).toHaveScreenshot(name, {
    fullPage: options.fullPage || false,
    threshold: options.threshold || 0.2,
    mask: maskLocators,
    clip: options.clip,
  })
}

/**
 * Take a component screenshot
 */
export async function takeComponentScreenshot(
  page: Page,
  selector: string,
  name: string,
  options: ScreenshotOptions = {}
) {
  const element = page.locator(selector)
  await expect(element).toBeVisible()
  
  return await expect(element).toHaveScreenshot(name, {
    threshold: options.threshold || 0.2,
    mask: options.mask?.map(mask => page.locator(mask)) || [],
  })
}

/**
 * Utility to wait for animations to complete
 */
export async function waitForAnimations(page: Page) {
  await page.waitForFunction(() => {
    const animations = document.getAnimations()
    return animations.every(animation => 
      animation.playState === 'finished' || animation.playState === 'idle'
    )
  })
}

/**
 * Hide elements that typically cause visual test flakiness
 */
export async function hideDynamicElements(page: Page) {
  await page.addStyleTag({
    content: `
      [data-testid="timestamp"],
      .loading-spinner,
      .toast,
      [class*="animate-pulse"],
      [class*="animate-spin"],
      [class*="animate-bounce"] {
        visibility: hidden !important;
      }
      
      /* Hide cursors */
      * {
        cursor: none !important;
      }
    `
  })
}

/**
 * Standard viewport sizes for testing
 */
export const VIEWPORTS = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 720 },
  large: { width: 1920, height: 1080 },
} as const

/**
 * Take screenshots across multiple viewport sizes
 */
export async function takeResponsiveScreenshots(
  page: Page,
  baseName: string,
  url: string = "/"
) {
  for (const [device, viewport] of Object.entries(VIEWPORTS)) {
    await page.setViewportSize(viewport)
    await page.goto(url)
    await page.waitForLoadState("networkidle")
    await waitForAnimations(page)
    await hideDynamicElements(page)
    
    await takePageScreenshot(page, `${baseName}-${device}.png`)
  }
}

/**
 * Create baseline screenshots (for initial setup)
 */
export async function createBaselines(page: Page, routes: string[]) {
  await page.setViewportSize(VIEWPORTS.desktop)
  
  for (const route of routes) {
    const routeName = route === "/" ? "home" : route.replace(/\//g, "-")
    await page.goto(route)
    await page.waitForLoadState("networkidle")
    await waitForAnimations(page)
    await hideDynamicElements(page)
    
    await takePageScreenshot(page, `baseline-${routeName}.png`)
  }
}
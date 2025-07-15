import { Page, expect } from "@playwright/test"
import fs from "fs"
import path from "path"

export interface VisualTestOptions {
  fullPage?: boolean
  animations?: "disabled" | "allow"
  threshold?: number
  maxDiffPixels?: number
  clip?: { x: number; y: number; width: number; height: number }
}

export class VisualRegressionHelper {
  constructor(private page: Page, private testName: string) {}

  /**
   * Take a screenshot and compare with baseline
   */
  async compareScreenshot(
    name: string,
    options: VisualTestOptions = {}
  ): Promise<void> {
    const defaultOptions: VisualTestOptions = {
      fullPage: false,
      animations: "disabled",
      threshold: 0.1,
      maxDiffPixels: 1000,
    }

    const finalOptions = { ...defaultOptions, ...options }

    await expect(this.page).toHaveScreenshot(`${this.testName}-${name}.png`, {
      ...finalOptions,
    })
  }

  /**
   * Compare a specific element
   */
  async compareElement(
    selector: string,
    name: string,
    options: VisualTestOptions = {}
  ): Promise<void> {
    const element = this.page.locator(selector)
    await element.waitFor({ state: "visible" })

    await expect(element).toHaveScreenshot(`${this.testName}-${name}.png`, {
      animations: options.animations || "disabled",
      threshold: options.threshold || 0.1,
    })
  }

  /**
   * Wait for animations and network to settle before screenshot
   */
  async waitForStableState(): Promise<void> {
    await this.page.waitForLoadState("networkidle")
    await this.page.waitForTimeout(300) // Additional buffer for animations
  }

  /**
   * Hide dynamic content that changes between runs
   */
  async hideDynamicContent(): Promise<void> {
    // Hide timestamps, dates, random IDs, etc.
    await this.page.addStyleTag({
      content: `
        [data-testid*="timestamp"],
        [data-testid*="date"],
        .timestamp,
        .date-time,
        .random-id,
        .uuid {
          visibility: hidden !important;
        }
        
        /* Hide scrollbars for consistent screenshots */
        ::-webkit-scrollbar {
          display: none !important;
        }
        
        * {
          scrollbar-width: none !important;
        }
        
        /* Disable animations and transitions */
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `,
    })
  }

  /**
   * Set viewport to specific device
   */
  async setDevice(device: "mobile" | "tablet" | "desktop"): Promise<void> {
    const devices = {
      mobile: { width: 375, height: 667 },
      tablet: { width: 768, height: 1024 },
      desktop: { width: 1920, height: 1080 },
    }

    await this.page.setViewportSize(devices[device])
  }

  /**
   * Take multiple screenshots at different viewports
   */
  async compareResponsive(
    name: string,
    options: VisualTestOptions = {}
  ): Promise<void> {
    const devices = ["mobile", "tablet", "desktop"] as const

    for (const device of devices) {
      await this.setDevice(device)
      await this.waitForStableState()
      await this.compareScreenshot(`${name}-${device}`, options)
    }
  }

  /**
   * Generate visual test report data
   */
  static generateTestReport(
    testResults: Array<{ test: string; status: "passed" | "failed"; screenshots: string[] }>
  ): void {
    const reportPath = path.join(process.cwd(), "test-results", "visual-report.json")
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: testResults.length,
        passed: testResults.filter(r => r.status === "passed").length,
        failed: testResults.filter(r => r.status === "failed").length,
      },
      tests: testResults,
    }

    // Ensure directory exists
    fs.mkdirSync(path.dirname(reportPath), { recursive: true })
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  }
}

/**
 * Helper function to create visual regression helper
 */
export function createVisualHelper(page: Page, testName: string): VisualRegressionHelper {
  return new VisualRegressionHelper(page, testName)
}

/**
 * Common page setup for visual tests
 */
export async function setupVisualTest(page: Page): Promise<void> {
  // Set consistent user agent
  await page.setExtraHTTPHeaders({
    "User-Agent": "PlaywrightVisualRegression/1.0",
  })

  // Disable font loading variations
  await page.addInitScript(() => {
    // Mock Date.now to return consistent timestamp
    const mockDate = new Date("2024-01-01T00:00:00.000Z").getTime()
    Date.now = () => mockDate
    
    // Mock Math.random for consistent random values
    Math.random = () => 0.5
  })
}

export default VisualRegressionHelper
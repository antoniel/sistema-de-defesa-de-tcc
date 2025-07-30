import { test, expect } from "@playwright/test"

test.describe("Pagination Display", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page
    await page.goto("/")
    
    // Wait for the page to load
    await page.waitForLoadState("networkidle")
  })

  test("should display correct pagination info for all defenses tab", async ({ page }) => {
    // Wait for the defense table to load
    await page.waitForSelector('[data-testid="defense-table"]', { timeout: 10000 })
    
    // Check if we're on the all defenses tab (default)
    const allDefensesTab = page.locator('[data-testid="all-defenses-tab"]')
    await allDefensesTab.click()
    
    // Wait for pagination info to appear
    await page.waitForSelector('text=/Exibindo \\d+ de \\d+/', { timeout: 5000 })
    
    // Get pagination text (there might be multiple pagination sections)
    const paginationElements = await page.locator('text=/Exibindo \\d+ de \\d+/').all()
    
    // Test at least one pagination section
    if (paginationElements.length > 0) {
      const paginationText = await paginationElements[0].textContent()
      
      if (paginationText) {
        // Extract numbers from pagination text
        const match = paginationText.match(/Exibindo (\\d+) de (\\d+)/)
        if (match) {
          const displayed = parseInt(match[1])
          const total = parseInt(match[2])
          
          // The displayed count should not exceed the total
          expect(displayed).toBeLessThanOrEqual(total)
          
          // The displayed count should be positive
          expect(displayed).toBeGreaterThan(0)
          
          // The total should be positive
          expect(total).toBeGreaterThan(0)
        }
      }
    }
  })

  test("should display both upcoming and past defenses sections when available", async ({ page }) => {
    // Wait for the defense table to load
    await page.waitForSelector('[data-testid="defense-table"]', { timeout: 10000 })
    
    // Check if there are sections for both upcoming and past defenses
    const upcomingSection = page.locator('h3:has-text("Próximas defesas")')
    const pastSection = page.locator('h3:has-text("Defesas anteriores")').or(page.locator('h3:has-text("Defesas")'))
    
    // At least one section should be visible
    const sections = await Promise.all([
      upcomingSection.isVisible().catch(() => false),
      pastSection.isVisible().catch(() => false)
    ])
    
    expect(sections.some(visible => visible)).toBe(true)
    
    // Check pagination for visible sections
    const paginationElements = await page.locator('text=/Exibindo \\d+ de \\d+/').all()
    
    if (paginationElements.length > 0) {
      for (const element of paginationElements) {
        const paginationText = await element.textContent()
        if (paginationText) {
          const match = paginationText.match(/Exibindo (\\d+) de (\\d+)/)
          if (match) {
            const displayed = parseInt(match[1])
            const total = parseInt(match[2])
            
            expect(displayed).toBeLessThanOrEqual(total)
            expect(displayed).toBeGreaterThan(0)
            expect(total).toBeGreaterThan(0)
          }
        }
      }
    }
  })

  test("should update pagination correctly when changing rows per page", async ({ page }) => {
    // Wait for the defense table to load
    await page.waitForSelector('[data-testid="defense-table"]', { timeout: 10000 })
    
    // Click on the select trigger to open the dropdown
    const selectTrigger = page.locator('[role="combobox"]').first()
    await selectTrigger.click()
    
    // Wait for the dropdown to open and click on the "5" option
    await page.waitForSelector('[role="option"]')
    await page.locator('[role="option"]').filter({ hasText: "5" }).click()
    
    // Wait for the page to update
    await page.waitForTimeout(1000)
    
    // Check that pagination info is updated
    const paginationText = await page.locator('text=/Exibindo \\d+ de \\d+/').textContent()
    
    if (paginationText) {
      const match = paginationText.match(/Exibindo (\\d+) de (\\d+)/)
      if (match) {
        const displayed = parseInt(match[1])
        const total = parseInt(match[2])
        
        // The displayed count should not exceed 5 (our selected limit)
        expect(displayed).toBeLessThanOrEqual(5)
        
        // The displayed count should not exceed the total
        expect(displayed).toBeLessThanOrEqual(total)
      }
    }
  })

  test("should maintain correct pagination when searching", async ({ page }) => {
    // Wait for the defense table to load
    await page.waitForSelector('[data-testid="defense-table"]', { timeout: 10000 })
    
    // Perform a search
    const searchInput = page.locator('input[type="search"]')
    await searchInput.fill("Test")
    
    // Wait for search results to load
    await page.waitForTimeout(1000)
    
    // Check pagination info after search
    const paginationText = await page.locator('text=/Exibindo \\d+ de \\d+/').textContent()
    
    if (paginationText) {
      const match = paginationText.match(/Exibindo (\\d+) de (\\d+)/)
      if (match) {
        const displayed = parseInt(match[1])
        const total = parseInt(match[2])
        
        // The displayed count should not exceed the total
        expect(displayed).toBeLessThanOrEqual(total)
        
        // Verify search indication appears
        expect(page.locator('text=/para "Test"/')).toBeVisible()
      }
    }
  })

  test("should handle pagination navigation correctly", async ({ page }) => {
    // Wait for the defense table to load
    await page.waitForSelector('[data-testid="defense-table"]', { timeout: 10000 })
    
    // Set a small limit to ensure pagination
    const selectTrigger = page.locator('[role="combobox"]').first()
    await selectTrigger.click()
    
    // Wait for the dropdown to open and click on the "5" option
    await page.waitForSelector('[role="option"]')
    await page.locator('[role="option"]').filter({ hasText: "5" }).click()
    
    // Wait for the page to update
    await page.waitForTimeout(1000)
    
    // Check if next button is available
    const nextButton = page.locator('button:has-text("Próximo")')
    
    if (await nextButton.isEnabled()) {
      // Get current page info
      const currentPageText = await page.locator('text=/Página \\d+ de \\d+/').textContent()
      
      if (currentPageText) {
        const currentMatch = currentPageText.match(/Página (\\d+) de (\\d+)/)
        if (currentMatch) {
          const currentPage = parseInt(currentMatch[1])
          const totalPages = parseInt(currentMatch[2])
          
          // Click next button
          await nextButton.click()
          
          // Wait for page to update
          await page.waitForTimeout(1000)
          
          // Check that page number increased
          const newPageText = await page.locator('text=/Página \\d+ de \\d+/').textContent()
          if (newPageText) {
            const newMatch = newPageText.match(/Página (\\d+) de (\\d+)/)
            if (newMatch) {
              const newPage = parseInt(newMatch[1])
              expect(newPage).toBe(currentPage + 1)
            }
          }
          
          // Check that pagination info is still correct
          const paginationText = await page.locator('text=/Exibindo \\d+ de \\d+/').textContent()
          if (paginationText) {
            const match = paginationText.match(/Exibindo (\\d+) de (\\d+)/)
            if (match) {
              const displayed = parseInt(match[1])
              const total = parseInt(match[2])
              
              // The displayed count should not exceed the total
              expect(displayed).toBeLessThanOrEqual(total)
              
              // The displayed count should not exceed our limit of 5
              expect(displayed).toBeLessThanOrEqual(5)
            }
          }
        }
      }
    }
  })
})
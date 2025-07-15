import { test, expect } from "@playwright/test"

test.describe("Pagination Display", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page
    await page.goto("/")
    
    // Wait for the page to load
    await page.waitForLoadState("networkidle")
  })

  test("should display correct pagination info for upcoming defenses", async ({ page }) => {
    // Wait for the defense table to load
    await page.waitForSelector('[data-testid="defense-table"]', { timeout: 10000 })
    
    // Check if there are upcoming defenses
    const upcomingTab = page.locator('[data-testid="upcoming-tab"]')
    await upcomingTab.click()
    
    // Wait for pagination info to appear
    await page.waitForSelector('text=/Exibindo \\d+ de \\d+/', { timeout: 5000 })
    
    // Get pagination text
    const paginationText = await page.locator('text=/Exibindo \\d+ de \\d+/').textContent()
    
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
  })

  test("should display correct pagination info for past defenses", async ({ page }) => {
    // Check if there are past defenses
    const pastTab = page.locator('[data-testid="past-tab"]')
    await pastTab.click()
    
    // Wait for pagination info to appear
    await page.waitForSelector('text=/Exibindo \\d+ de \\d+/', { timeout: 5000 })
    
    // Get pagination text
    const paginationText = await page.locator('text=/Exibindo \\d+ de \\d+/').textContent()
    
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
  })

  test("should update pagination correctly when changing rows per page", async ({ page }) => {
    // Wait for the defense table to load
    await page.waitForSelector('[data-testid="defense-table"]', { timeout: 10000 })
    
    // Select a specific number of rows per page
    const rowsPerPageSelect = page.locator('select').filter({ hasText: /10|5|30/ }).first()
    await rowsPerPageSelect.selectOption("5")
    
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
    const rowsPerPageSelect = page.locator('select').filter({ hasText: /10|5|30/ }).first()
    await rowsPerPageSelect.selectOption("5")
    
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
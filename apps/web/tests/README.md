# Playwright Tests

This directory contains end-to-end tests for the web application using Playwright.

## Running Tests

### Basic Commands

```bash
# Run all tests
npm run test

# Run tests with UI mode (interactive)
npm run test:ui

# Run tests in headed mode (see browser)
npm run test:headed

# Run tests in debug mode
npm run test:debug

# Show test report
npm run test:report
```

### From Root Directory

```bash
# Run e2e tests from the root
npm run test:e2e
```

## Test Structure

- `example.spec.ts` - Basic example tests
- `app.spec.ts` - Application-specific tests
- `api.spec.ts` - API integration tests with fake database

## Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';

test('test name', async ({ page }) => {
  await page.goto('/');
  
  // Your test logic here
  await expect(page.locator('selector')).toBeVisible();
});
```

### Common Patterns

#### Navigation
```typescript
await page.goto('/');
await page.getByRole('link', { name: 'Link Text' }).click();
```

#### Form Interactions
```typescript
await page.getByLabel('Email').fill('test@example.com');
await page.getByRole('button', { name: 'Submit' }).click();
```

#### Assertions
```typescript
await expect(page).toHaveTitle(/Expected Title/);
await expect(page.locator('.element')).toBeVisible();
await expect(page).toHaveURL(/.*expected-path/);
```

#### API Mocking
```typescript
await page.route('**/api/**', route => {
  route.fulfill({ 
    status: 200, 
    body: JSON.stringify({ data: 'mock' }) 
  });
});
```

## Configuration

The Playwright configuration is in `playwright.config.ts` and includes:

- Test directory: `./tests`
- Base URL: `http://localhost:5173`
- Browser support: Chromium, Firefox, WebKit
- Automatic dev server startup (both frontend and backend)
- Fake database for testing (using pglite)
- HTML reporter
- Trace collection on retry

### Environment Setup

The tests use a special test environment:

- **Frontend**: Uses `.env.test` with `VITE_API_URL=http://localhost:9000`
- **Backend**: Uses `NODE_ENV=test` with fake database (pglite)
- **Database**: In-memory PostgreSQL using pglite for testing

## Best Practices

1. **Use descriptive test names** that explain what is being tested
2. **Group related tests** using `test.describe()`
3. **Use page object pattern** for complex applications
4. **Mock external dependencies** when appropriate
5. **Test across different viewports** for responsive design
6. **Use accessibility selectors** like `getByRole()` and `getByLabel()`

## Debugging

- Use `npm run test:debug` for step-by-step debugging
- Use `npm run test:ui` for interactive mode
- Check the HTML report for detailed test results
- Use `page.pause()` in your tests for manual debugging

## CI/CD Integration

Tests are configured to run in CI environments with:
- Reduced parallelism on CI
- Retry logic for flaky tests
- Proper exit codes for build failures
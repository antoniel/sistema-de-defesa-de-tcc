#!/usr/bin/env node

/**
 * Script to generate PR comments for visual regression results
 * Can be used locally or in CI/CD
 */

import { readFile, readdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

const TEST_RESULTS_DIR = "./apps/web/test-results"

async function generatePRComment() {
  try {
    let commentBody = '## 🎯 Visual Regression Test Results\n\n'
    
    const screenshotsDir = path.join(TEST_RESULTS_DIR, "screenshots")
    const diffDir = path.join(TEST_RESULTS_DIR, "diff")
    const reportsDir = path.join(TEST_RESULTS_DIR, "reports")
    const reportPath = path.join(reportsDir, "visual-regression-report.html")
    
    let screenshotCount = 0
    let diffCount = 0
    
    // Count screenshots and diffs
    if (existsSync(screenshotsDir)) {
      const files = await readdir(screenshotsDir)
      screenshotCount = files.filter(f => f.endsWith('.png')).length
    }
    
    if (existsSync(diffDir)) {
      const files = await readdir(diffDir)
      diffCount = files.filter(f => f.endsWith('.png')).length
    }
    
    // Check if report exists
    if (existsSync(reportPath)) {
      if (diffCount > 0) {
        commentBody += `❌ **${diffCount} visual changes detected!**\n\n`
        commentBody += `📸 **Screenshots captured:** ${screenshotCount}\n`
        commentBody += `🔍 **Visual differences found:** ${diffCount}\n\n`
        
        // List specific changes if available
        if (existsSync(diffDir)) {
          const diffFiles = await readdir(diffDir)
          const diffs = diffFiles.filter(f => f.endsWith('.png')).slice(0, 5) // Show max 5
          
          if (diffs.length > 0) {
            commentBody += `### 🔍 Changed Screenshots\n`
            for (const diff of diffs) {
              const testName = diff.replace('diff-', '').replace('.png', '')
              commentBody += `- \`${testName}\`\n`
            }
            
            if (diffFiles.length > 5) {
              commentBody += `- ... and ${diffFiles.length - 5} more\n`
            }
            commentBody += '\n'
          }
        }
        
        commentBody += `### 📊 Detailed Report\n`
        commentBody += `A detailed visual regression report has been generated with side-by-side comparisons.\n\n`
        commentBody += `### 🛠️ Next Steps\n`
        commentBody += `1. 📥 Download the \`visual-test-results\` artifact from the GitHub Actions run\n`
        commentBody += `2. 🔍 Open \`visual-regression-report.html\` to review all changes\n`
        commentBody += `3. ✅ If changes are intentional, update baselines:\n`
        commentBody += `   \`\`\`bash\n`
        commentBody += `   ./scripts/visual-testing.sh update\n`
        commentBody += `   git add apps/web/test-results/screenshots/\n`
        commentBody += `   git commit -m "chore: update visual baselines"\n`
        commentBody += `   \`\`\`\n`
        commentBody += `4. 🔄 Push changes to update this PR\n\n`
        
      } else {
        commentBody += `✅ **All visual tests passed!**\n\n`
        commentBody += `📸 **Screenshots captured:** ${screenshotCount}\n`
        commentBody += `🎉 No visual regressions detected.\n\n`
        commentBody += `All UI components and pages match their baseline screenshots perfectly.\n`
      }
      
    } else if (screenshotCount > 0) {
      commentBody += `🆕 **First time visual testing setup**\n\n`
      commentBody += `📸 **Screenshots captured:** ${screenshotCount}\n\n`
      commentBody += `This appears to be the first time visual regression tests have been run for this project. `
      commentBody += `The captured screenshots will serve as baseline images for future comparisons.\n\n`
      commentBody += `### 📝 What's Next\n`
      commentBody += `1. These screenshots will be automatically saved as baselines\n`
      commentBody += `2. Future PRs will compare against these baselines\n`
      commentBody += `3. Any visual changes will be highlighted in subsequent test runs\n\n`
      
    } else {
      commentBody += `⚠️ **No visual tests executed**\n\n`
      commentBody += `No screenshots were captured. This might be because:\n`
      commentBody += `- Visual tests were not triggered\n`
      commentBody += `- Tests failed before screenshots could be taken\n`
      commentBody += `- Test configuration issues\n\n`
      commentBody += `Check the GitHub Actions logs for more details.\n`
    }
    
    // Add technical details
    commentBody += `### 🔗 Resources\n`
    commentBody += `- [Visual Testing Documentation](apps/web/tests/VISUAL_TESTING.md)\n`
    commentBody += `- [Playwright Visual Comparisons](https://playwright.dev/docs/test-screenshots)\n`
    
    commentBody += `\n---\n`
    commentBody += `*🤖 Automated visual regression testing powered by Playwright*\n`
    commentBody += `*📊 Generated at ${new Date().toISOString()}*`
    
    return commentBody
    
  } catch (error) {
    console.error("Error generating PR comment:", error)
    
    return `## 🎯 Visual Regression Test Results\n\n` +
           `❌ **Error generating visual test report**\n\n` +
           `\`\`\`\n${error.message}\n\`\`\`\n\n` +
           `Please check the GitHub Actions logs for more details.\n\n` +
           `---\n*🤖 Automated visual regression testing powered by Playwright*`
  }
}

// Export for use in other scripts
export { generatePRComment }

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generatePRComment().then(comment => {
    console.log(comment)
  })
}
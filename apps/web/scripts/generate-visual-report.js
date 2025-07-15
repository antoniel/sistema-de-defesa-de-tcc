#!/usr/bin/env node

import { readFile, readdir, writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"
import { compareImages, generateDiffReport, initializeBaselineStructure } from "../tests/utils/image-diff.ts"

const TEST_RESULTS_DIR = "./test-results"
const SCREENSHOTS_DIR = path.join(TEST_RESULTS_DIR, "screenshots")
const REPORTS_DIR = path.join(TEST_RESULTS_DIR, "reports")

async function main() {
  console.log("🎯 Generating Visual Regression Report...")

  try {
    // Initialize directory structure
    await initializeBaselineStructure(TEST_RESULTS_DIR)

    // Find all screenshot files
    const screenshotFiles = await findScreenshotFiles()
    
    if (screenshotFiles.length === 0) {
      console.log("❌ No screenshots found. Run visual tests first.")
      process.exit(1)
    }

    console.log(`📸 Found ${screenshotFiles.length} screenshots`)

    // Process each screenshot comparison
    const comparisons = []
    const baselineDir = path.join(TEST_RESULTS_DIR, "baseline")
    const currentDir = path.join(TEST_RESULTS_DIR, "current")
    const diffDir = path.join(TEST_RESULTS_DIR, "diff")

    for (const screenshot of screenshotFiles) {
      const baselinePath = path.join(baselineDir, screenshot)
      const currentPath = path.join(SCREENSHOTS_DIR, screenshot)
      const diffPath = path.join(diffDir, `diff-${screenshot}`)

      // Copy current screenshot to current dir for report
      await copyFile(currentPath, path.join(currentDir, screenshot))

      if (existsSync(baselinePath)) {
        comparisons.push({
          name: screenshot.replace('.png', ''),
          baselinePath,
          currentPath,
          diffOutputPath: diffPath,
        })
      } else {
        console.log(`⚠️  No baseline found for ${screenshot}, copying as new baseline`)
        await copyFile(currentPath, baselinePath)
      }
    }

    if (comparisons.length === 0) {
      console.log("ℹ️  No comparisons to make. All screenshots are new baselines.")
      return
    }

    // Generate diff report
    const reportPath = path.join(REPORTS_DIR, "visual-regression-report.html")
    const results = await generateDiffReport(comparisons, reportPath)

    // Print summary
    const passed = results.filter(r => r.passed).length
    const failed = results.filter(r => !r.passed).length

    console.log("\n📊 Visual Regression Test Results:")
    console.log(`   ✅ Passed: ${passed}`)
    console.log(`   ❌ Failed: ${failed}`)
    console.log(`   📄 Report: ${reportPath}`)

    if (failed > 0) {
      console.log("\n🔍 Failed Tests:")
      results
        .filter(r => !r.passed)
        .forEach(r => {
          console.log(`   • ${r.name}: ${r.percentageDiff}% difference`)
        })
    }

    // Exit with error code if tests failed
    process.exit(failed > 0 ? 1 : 0)

  } catch (error) {
    console.error("❌ Error generating visual report:", error)
    process.exit(1)
  }
}

async function findScreenshotFiles() {
  if (!existsSync(SCREENSHOTS_DIR)) {
    return []
  }

  const files = await readdir(SCREENSHOTS_DIR)
  return files.filter(file => file.endsWith('.png'))
}

async function copyFile(src, dest) {
  const content = await readFile(src)
  await mkdir(path.dirname(dest), { recursive: true })
  await writeFile(dest, content)
}

// Run if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
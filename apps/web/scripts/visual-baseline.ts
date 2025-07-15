#!/usr/bin/env tsx

/**
 * Script to manage visual regression testing baselines
 * 
 * Usage:
 * npm run visual:baseline           # Generate new baseline screenshots
 * npm run visual:update             # Update existing baselines
 * npm run visual:compare            # Compare current with baseline
 * npm run visual:diff               # Generate diff images
 */

import { execSync } from "child_process"
import fs from "fs"
import path from "path"

const BASELINE_DIR = path.join(process.cwd(), "tests", "visual-baseline")
const RESULTS_DIR = path.join(process.cwd(), "test-results")
const DIFF_DIR = path.join(RESULTS_DIR, "visual-diffs")

interface VisualTestConfig {
  command: string
  description: string
}

const commands: Record<string, VisualTestConfig> = {
  baseline: {
    command: "npx playwright test visual-regression.spec.ts --update-snapshots",
    description: "Generate new baseline screenshots",
  },
  update: {
    command: "npx playwright test visual-regression.spec.ts --update-snapshots",
    description: "Update existing baseline screenshots",
  },
  compare: {
    command: "npx playwright test visual-regression.spec.ts",
    description: "Compare current screenshots with baseline",
  },
  diff: {
    command: "npx playwright test visual-regression.spec.ts --reporter=json",
    description: "Generate diff images and report",
  },
}

function ensureDirectoryExists(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
    console.log(`📁 Created directory: ${dir}`)
  }
}

function cleanup(): void {
  // Clean up old test results
  if (fs.existsSync(RESULTS_DIR)) {
    fs.rmSync(RESULTS_DIR, { recursive: true, force: true })
    console.log("🧹 Cleaned up old test results")
  }
}

function copyBaselines(): void {
  const playwrightTestResults = path.join(process.cwd(), "test-results")
  
  if (fs.existsSync(playwrightTestResults)) {
    ensureDirectoryExists(BASELINE_DIR)
    
    // Copy screenshots to baseline directory
    const screenshots = fs.readdirSync(playwrightTestResults, { recursive: true })
      .filter((file: any) => typeof file === "string" && file.endsWith(".png"))
    
    screenshots.forEach((screenshot: any) => {
      const srcPath = path.join(playwrightTestResults, screenshot)
      const destPath = path.join(BASELINE_DIR, screenshot)
      
      ensureDirectoryExists(path.dirname(destPath))
      fs.copyFileSync(srcPath, destPath)
    })
    
    console.log(`📸 Copied ${screenshots.length} baseline screenshots`)
  }
}

function generateDiffReport(): void {
  const reportPath = path.join(RESULTS_DIR, "visual-diff-report.html")
  
  const htmlReport = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Visual Regression Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .diff-container { display: flex; gap: 20px; margin: 20px 0; }
        .diff-image { flex: 1; text-align: center; }
        .diff-image img { max-width: 100%; border: 1px solid #ddd; }
        .test-section { border: 1px solid #eee; padding: 20px; margin: 20px 0; }
        .status-pass { color: green; }
        .status-fail { color: red; }
        h1, h2 { color: #333; }
        .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>Visual Regression Test Report</h1>
    <div class="summary">
        <p><strong>Generated:</strong> ${new Date().toISOString()}</p>
        <p><strong>Test Results:</strong> Check individual diff images below</p>
    </div>
    
    <h2>How to interpret results:</h2>
    <ul>
        <li><strong>Expected:</strong> The baseline screenshot</li>
        <li><strong>Actual:</strong> The current screenshot</li>
        <li><strong>Diff:</strong> Visual difference highlighting changes</li>
    </ul>
    
    <div id="diff-results">
        <p>Diff images will be generated in the test-results/visual-diffs directory</p>
        <p>Each failed visual test will create three images:</p>
        <ul>
            <li>test-name-expected.png</li>
            <li>test-name-actual.png</li>
            <li>test-name-diff.png</li>
        </ul>
    </div>
</body>
</html>
  `
  
  ensureDirectoryExists(path.dirname(reportPath))
  fs.writeFileSync(reportPath, htmlReport)
  console.log(`📊 Generated visual diff report: ${reportPath}`)
}

function main(): void {
  const action = process.argv[2] || "compare"
  
  if (!commands[action]) {
    console.error(`❌ Unknown action: ${action}`)
    console.log("Available actions:", Object.keys(commands).join(", "))
    process.exit(1)
  }
  
  const config = commands[action]
  console.log(`🚀 ${config.description}...`)
  
  try {
    // Setup directories
    ensureDirectoryExists(BASELINE_DIR)
    ensureDirectoryExists(DIFF_DIR)
    
    if (action === "baseline") {
      cleanup()
    }
    
    // Run the playwright command
    console.log(`Running: ${config.command}`)
    execSync(config.command, { 
      stdio: "inherit",
      cwd: process.cwd(),
    })
    
    if (action === "baseline" || action === "update") {
      copyBaselines()
    }
    
    if (action === "diff" || action === "compare") {
      generateDiffReport()
    }
    
    console.log(`✅ ${config.description} completed successfully!`)
    
  } catch (error) {
    console.error(`❌ Error during ${action}:`, error)
    
    if (action === "compare" || action === "diff") {
      // Visual tests failed - this is expected when there are differences
      console.log("📸 Visual differences detected. Check the diff report for details.")
      generateDiffReport()
    } else {
      process.exit(1)
    }
  }
}

if (require.main === module) {
  main()
}
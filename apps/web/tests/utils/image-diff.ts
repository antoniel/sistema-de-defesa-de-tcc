import { PNG } from "pngjs"
import pixelmatch from "pixelmatch"
import { readFile, writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import * as path from "path"

export interface DiffResult {
  diffPixels: number
  totalPixels: number
  percentageDiff: number
  diffImagePath?: string
  passed: boolean
}

export interface ImageDiffOptions {
  threshold: number
  includeAA: boolean
  alpha: number
  aaColor: [number, number, number]
  diffColor: [number, number, number]
  diffColorAlt?: [number, number, number]
}

const defaultOptions: ImageDiffOptions = {
  threshold: 0.1,
  includeAA: false,
  alpha: 0.1,
  aaColor: [255, 255, 0],
  diffColor: [255, 0, 255],
}

/**
 * Compare two images and generate a visual diff
 */
export async function compareImages(
  baselinePath: string,
  currentPath: string,
  diffOutputPath?: string,
  options: Partial<ImageDiffOptions> = {}
): Promise<DiffResult> {
  const opts = { ...defaultOptions, ...options }

  try {
    // Read both images
    const [baselineBuffer, currentBuffer] = await Promise.all([
      readFile(baselinePath),
      readFile(currentPath),
    ])

    const baseline = PNG.sync.read(baselineBuffer)
    const current = PNG.sync.read(currentBuffer)

    // Check if dimensions match
    if (baseline.width !== current.width || baseline.height !== current.height) {
      throw new Error(
        `Image dimensions don't match: baseline(${baseline.width}x${baseline.height}) vs current(${current.width}x${current.height})`
      )
    }

    const { width, height } = baseline
    const totalPixels = width * height

    // Create diff image
    const diff = new PNG({ width, height })

    // Compare images
    const diffPixels = pixelmatch(
      baseline.data,
      current.data,
      diff.data,
      width,
      height,
      {
        threshold: opts.threshold,
        includeAA: opts.includeAA,
        alpha: opts.alpha,
        aaColor: opts.aaColor,
        diffColor: opts.diffColor,
        diffColorAlt: opts.diffColorAlt,
      }
    )

    const percentageDiff = (diffPixels / totalPixels) * 100
    const passed = percentageDiff < 0.1 // Consider test passed if less than 0.1% difference

    // Save diff image if there are differences and output path is provided
    if (diffPixels > 0 && diffOutputPath) {
      await mkdir(path.dirname(diffOutputPath), { recursive: true })
      await writeFile(diffOutputPath, PNG.sync.write(diff))
    }

    return {
      diffPixels,
      totalPixels,
      percentageDiff: Math.round(percentageDiff * 100) / 100,
      diffImagePath: diffPixels > 0 ? diffOutputPath : undefined,
      passed,
    }
  } catch (error) {
    console.error("Error comparing images:", error)
    throw error
  }
}

/**
 * Generate a comprehensive diff report for multiple images
 */
export async function generateDiffReport(
  comparisons: Array<{
    name: string
    baselinePath: string
    currentPath: string
    diffOutputPath: string
  }>,
  reportOutputPath: string
): Promise<DiffResult[]> {
  const results: DiffResult[] = []

  for (const comparison of comparisons) {
    try {
      const result = await compareImages(
        comparison.baselinePath,
        comparison.currentPath,
        comparison.diffOutputPath
      )
      
      results.push({
        ...result,
        ...{ name: comparison.name } as any,
      })
    } catch (error) {
      console.error(`Failed to compare ${comparison.name}:`, error)
      results.push({
        diffPixels: -1,
        totalPixels: -1,
        percentageDiff: -1,
        passed: false,
        ...{ name: comparison.name, error: String(error) } as any,
      })
    }
  }

  // Generate HTML report
  const htmlReport = generateHTMLReport(results)
  await mkdir(path.dirname(reportOutputPath), { recursive: true })
  await writeFile(reportOutputPath, htmlReport)

  return results
}

/**
 * Generate an HTML report with visual diffs
 */
function generateHTMLReport(results: Array<DiffResult & { name?: string; error?: string }>): string {
  const reportDate = new Date().toISOString()
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Visual Regression Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            border-bottom: 2px solid #eee;
            margin-bottom: 20px;
            padding-bottom: 20px;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 30px;
        }
        .summary-card {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
            text-align: center;
        }
        .summary-card.passed { border-left: 4px solid #28a745; }
        .summary-card.failed { border-left: 4px solid #dc3545; }
        .summary-card.error { border-left: 4px solid #ffc107; }
        .test-result {
            border: 1px solid #ddd;
            border-radius: 6px;
            margin-bottom: 20px;
            overflow: hidden;
        }
        .test-header {
            padding: 15px;
            background: #f8f9fa;
            border-bottom: 1px solid #ddd;
        }
        .test-header.passed { background: #d4edda; }
        .test-header.failed { background: #f8d7da; }
        .test-header.error { background: #fff3cd; }
        .test-content {
            padding: 15px;
        }
        .image-comparison {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 15px;
            margin-top: 15px;
        }
        .image-container {
            text-align: center;
        }
        .image-container img {
            max-width: 100%;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        .stats {
            background: #f8f9fa;
            padding: 10px;
            border-radius: 4px;
            margin-top: 10px;
        }
        .error-message {
            color: #dc3545;
            background: #f8d7da;
            padding: 10px;
            border-radius: 4px;
            margin-top: 10px;
        }
        @media (max-width: 768px) {
            .image-comparison {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Visual Regression Test Report</h1>
            <p>Generated on: ${reportDate}</p>
        </div>
        
        <div class="summary">
            ${generateSummaryCards(results)}
        </div>
        
        <div class="results">
            ${results.map(result => generateTestResultHTML(result)).join('')}
        </div>
    </div>
</body>
</html>
  `.trim()
}

function generateSummaryCards(results: Array<DiffResult & { name?: string; error?: string }>): string {
  const total = results.length
  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed && !r.error).length
  const errors = results.filter(r => r.error).length

  return `
    <div class="summary-card">
        <h3>Total Tests</h3>
        <div style="font-size: 2em; font-weight: bold;">${total}</div>
    </div>
    <div class="summary-card passed">
        <h3>Passed</h3>
        <div style="font-size: 2em; font-weight: bold; color: #28a745;">${passed}</div>
    </div>
    <div class="summary-card failed">
        <h3>Failed</h3>
        <div style="font-size: 2em; font-weight: bold; color: #dc3545;">${failed}</div>
    </div>
    <div class="summary-card error">
        <h3>Errors</h3>
        <div style="font-size: 2em; font-weight: bold; color: #ffc107;">${errors}</div>
    </div>
  `
}

function generateTestResultHTML(result: DiffResult & { name?: string; error?: string }): string {
  const status = result.error ? 'error' : (result.passed ? 'passed' : 'failed')
  const statusText = result.error ? 'ERROR' : (result.passed ? 'PASSED' : 'FAILED')

  return `
    <div class="test-result">
        <div class="test-header ${status}">
            <h3>${result.name || 'Unknown Test'} - ${statusText}</h3>
        </div>
        <div class="test-content">
            ${result.error ? `
                <div class="error-message">
                    <strong>Error:</strong> ${result.error}
                </div>
            ` : `
                <div class="stats">
                    <strong>Difference:</strong> ${result.percentageDiff}% 
                    (${result.diffPixels.toLocaleString()} / ${result.totalPixels.toLocaleString()} pixels)
                </div>
                ${result.diffImagePath ? `
                    <div class="image-comparison">
                        <div class="image-container">
                            <h4>Baseline</h4>
                            <img src="baseline/${result.name}.png" alt="Baseline">
                        </div>
                        <div class="image-container">
                            <h4>Current</h4>
                            <img src="current/${result.name}.png" alt="Current">
                        </div>
                        <div class="image-container">
                            <h4>Difference</h4>
                            <img src="${result.diffImagePath}" alt="Diff">
                        </div>
                    </div>
                ` : ''}
            `}
        </div>
    </div>
  `
}

/**
 * Create baseline screenshots directory structure
 */
export async function initializeBaselineStructure(baseDir: string) {
  const dirs = [
    path.join(baseDir, "baseline"),
    path.join(baseDir, "current"),
    path.join(baseDir, "diff"),
    path.join(baseDir, "reports"),
  ]

  for (const dir of dirs) {
    await mkdir(dir, { recursive: true })
  }
}
#!/usr/bin/env ts-node

import { ChildProcess, spawn } from "child_process"
import { promisify } from "util"

const sleep = promisify(setTimeout)

interface CommandResult {
  code: number
  stdout: string
  stderr: string
}

function runCommand(command: string, args: string[] = []): Promise<CommandResult> {
  return new Promise((resolve) => {
    const child = spawn(command, args, { shell: true })
    let stdout = ""
    let stderr = ""

    child.stdout?.on("data", (data) => {
      const output = data.toString()
      stdout += output
      process.stdout.write(output)
    })

    child.stderr?.on("data", (data) => {
      const output = data.toString()
      stderr += output
      process.stderr.write(output)
    })

    child.on("close", (code) => {
      resolve({ code: code || 0, stdout, stderr })
    })
  })
}

function runCommandBackground(
  command: string,
  args: string[] = []
): { process: ChildProcess; promise: Promise<CommandResult> } {
  const child = spawn(command, args, { shell: true })
  let stdout = ""
  let stderr = ""

  child.stdout?.on("data", (data) => {
    const output = data.toString()
    stdout += output
  })

  child.stderr?.on("data", (data) => {
    const output = data.toString()
    stderr += output
  })

  const promise = new Promise<CommandResult>((resolve) => {
    child.on("close", (code) => {
      resolve({ code: code || 0, stdout, stderr })
    })
  })

  return { process: child, promise }
}

async function main() {
  console.log("🚀 Starting deployment process...\n")

  console.log("📋 Running tests...")
  const testResult = await runCommand("npm", ["run", "test"])
  if (testResult.code !== 0) {
    console.error("❌ Tests failed! Deployment aborted.")
    process.exit(1)
  }
  console.log("✅ Tests passed!\n")

  console.log("🔍 Running type check...")
  const typecheckResult = await runCommand("npm", ["run", "typecheck"])
  if (typecheckResult.code !== 0) {
    console.error("❌ Type check failed! Deployment aborted.")
    process.exit(1)
  }
  console.log("✅ Type check passed!\n")

  console.log("🖥️  Starting server deployment...")
  const serverDeploy = runCommandBackground("npm", ["run", "push:server"])
  console.log("✅ Server deployment started!\n")

  console.log("⏱️  Waiting 5 seconds before starting web deployment...")
  await sleep(5000)

  console.log("🌐 Starting web deployment...")
  const webDeploy = runCommandBackground("npm", ["run", "push:web"])

  console.log("⏳ Web deployment started in background. Waiting for completion...\n")

  const resultsAll = await Promise.all([webDeploy.promise, serverDeploy.promise])

  if (resultsAll[0].code !== 0) {
    console.error("❌ Web deployment failed!")
    console.error("Web deployment output:")
    console.error(resultsAll[0].stderr)
    process.exit(1)
  }

  if (resultsAll[1].code !== 0) {
    console.error("❌ Server deployment failed!")
    console.error("Server deployment output:")
    console.error(resultsAll[1].stderr)
    process.exit(1)
  }

  console.log("✅ Web deployment completed!\n")
  console.log("🎉 All deployments completed successfully!")
}

main().catch((error) => {
  console.error("💥 Deployment script failed:", error)
  process.exit(1)
})

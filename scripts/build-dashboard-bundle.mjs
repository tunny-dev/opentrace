import { cpSync, existsSync, mkdirSync, renameSync, rmSync } from "node:fs"
import { resolve } from "node:path"
import { execSync } from "node:child_process"

console.log("=== Building SpurTrace Static Next.js Dashboard Bundle ===")

const dashboardDir = resolve("apps/dashboard")
const outDir = resolve("apps/dashboard/out")
const targetDir = resolve("packages/spurtrace/dist/dashboard-ui")
const apiDir = resolve("apps/dashboard/app/api")
const tempApiDir = resolve("apps/dashboard/temp_api_routes")

if (existsSync(outDir)) {
  rmSync(outDir, { recursive: true, force: true })
}

let apiMoved = false
if (existsSync(apiDir)) {
  console.log("Temporarily stashing app/api routes for static export...")
  renameSync(apiDir, tempApiDir)
  apiMoved = true
}

try {
  console.log("1. Running Next.js static export build for apps/dashboard...")
  execSync("npx next build", {
    cwd: dashboardDir,
    stdio: "inherit",
    env: {
      ...process.env,
      NEXT_EXPORT: "true",
      NEXT_PUBLIC_BASE_PATH: process.env.NEXT_PUBLIC_BASE_PATH || "/telemetry",
    },
  })
} finally {
  if (apiMoved && existsSync(tempApiDir)) {
    console.log("Restoring app/api routes...")
    renameSync(tempApiDir, apiDir)
  }
}

console.log("2. Copying static bundle to packages/spurtrace/dist/dashboard-ui...")
if (!existsSync(targetDir)) {
  mkdirSync(targetDir, { recursive: true })
}

cpSync(outDir, targetDir, { recursive: true })

console.log("✔ Successfully packaged SpurTrace Dashboard UI into spurtrace SDK!")

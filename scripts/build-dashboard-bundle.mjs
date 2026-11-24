import { cpSync, existsSync, mkdirSync, readdirSync, renameSync, rmSync } from "node:fs"
import { resolve, join } from "node:path"
import { execSync } from "node:child_process"

console.log("=== Building SpurTrace Static Next.js Dashboard Bundle ===")

const dashboardDir = resolve("apps/dashboard")
const outDir = resolve("apps/dashboard/out")
const targetDir = resolve("packages/spurtrace/dist/dashboard-ui")
const apiDir = resolve("apps/dashboard/app/api")

if (existsSync(outDir)) {
  rmSync(outDir, { recursive: true, force: true })
}

function findRouteFiles(dir) {
  let results = []
  if (!existsSync(dir)) return results
  const list = readdirSync(dir, { withFileTypes: true })
  for (const item of list) {
    const fullPath = join(dir, item.name)
    if (item.isDirectory()) {
      results = results.concat(findRouteFiles(fullPath))
    } else if (item.isFile() && item.name.startsWith("route.") && !item.name.endsWith(".bak")) {
      results.push(fullPath)
    }
  }
  return results
}

const stashedFiles = []
const routeFiles = findRouteFiles(apiDir)
if (routeFiles.length > 0) {
  console.log(`Temporarily stashing ${routeFiles.length} API route files for static export...`)
  for (const f of routeFiles) {
    const bak = f + ".bak"
    renameSync(f, bak)
    stashedFiles.push({ original: f, backup: bak })
  }
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
  if (stashedFiles.length > 0) {
    console.log(`Restoring ${stashedFiles.length} API route files...`)
    for (const item of stashedFiles) {
      if (existsSync(item.backup)) {
        try {
          renameSync(item.backup, item.original)
        } catch (e) {
          console.warn(`Failed to restore ${item.original}:`, e)
        }
      }
    }
  }
}

console.log("2. Copying static bundle to packages/spurtrace/dist/dashboard-ui...")
if (!existsSync(targetDir)) {
  mkdirSync(targetDir, { recursive: true })
}

cpSync(outDir, targetDir, { recursive: true })

const opentraceTarget = resolve("packages/opentrace/dist/dashboard-ui")
if (!existsSync(opentraceTarget)) {
  mkdirSync(opentraceTarget, { recursive: true })
}
cpSync(outDir, opentraceTarget, { recursive: true })

const emsWwwroot = resolve("D:/Senao/EMS/EMS/wwwroot/telemetry")
if (existsSync("D:/Senao/EMS/EMS/wwwroot")) {
  if (existsSync(emsWwwroot)) {
    rmSync(emsWwwroot, { recursive: true, force: true })
  }
  mkdirSync(emsWwwroot, { recursive: true })
  cpSync(outDir, emsWwwroot, { recursive: true })
  console.log("✔ Copied clean bundle to Senao EMS wwwroot/telemetry!")
}

console.log("✔ Successfully packaged SpurTrace Dashboard UI into spurtrace SDK!")

import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs"
import { resolve } from "node:path"
import { execSync } from "node:child_process"

console.log("=== Building SpurTrace Static Next.js Dashboard Bundle ===")

const dashboardDir = resolve("apps/dashboard")
const outDir = resolve("apps/dashboard/out")
const targetDir = resolve("packages/spurtrace/dist/dashboard-ui")

if (existsSync(outDir)) {
  rmSync(outDir, { recursive: true, force: true })
}

console.log("1. Running Next.js static export build for apps/dashboard...")
execSync("npx next build", {
  cwd: dashboardDir,
  stdio: "inherit",
  env: {
    ...process.env,
    NEXT_EXPORT: "true",
    NEXT_PUBLIC_BASE_PATH: "/_telemetry",
  },
})

console.log("2. Copying static bundle to packages/spurtrace/dist/dashboard-ui...")
if (!existsSync(targetDir)) {
  mkdirSync(targetDir, { recursive: true })
}

cpSync(outDir, targetDir, { recursive: true })

console.log("✔ Successfully packaged SpurTrace Dashboard UI into spurtrace SDK!")

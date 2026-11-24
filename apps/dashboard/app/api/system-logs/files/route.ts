import { NextResponse } from "next/server";
import { existsSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const rootDir = process.cwd();
    const candidateDirs = [
      rootDir,
      resolve(rootDir, "../.."),
    ];

    const files: any[] = [];
    for (const dir of candidateDirs) {
      if (!existsSync(/*turbopackIgnore: true*/ dir)) continue;
      const entries = readdirSync(/*turbopackIgnore: true*/ dir);
      for (const entry of entries) {
        if (entry.endsWith(".sqlite") || entry.endsWith(".log") || entry.endsWith(".db")) {
          const fullPath = resolve(dir, entry);
          const st = statSync(/*turbopackIgnore: true*/ fullPath);
          files.push({
            name: entry,
            path: entry,
            size: st.size,
            sizeFormatted: `${(st.size / 1024).toFixed(1)} KB`,
            updatedAt: st.mtime.toISOString(),
          });
        }
      }
    }

    return NextResponse.json(files);
  } catch (error: any) {
    return NextResponse.json([], { status: 200 });
  }
}

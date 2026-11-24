import { NextResponse } from "next/server";
import { DatabaseSync } from "node:sqlite";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function findDatabasePath(): string {
  if (process.env.SPURTRACE_SQLITE_PATH && existsSync(/*turbopackIgnore: true*/ process.env.SPURTRACE_SQLITE_PATH)) {
    return process.env.SPURTRACE_SQLITE_PATH;
  }
  const candidates = [
    resolve(process.cwd(), "opentrace.sqlite"),
    resolve(process.cwd(), "spurtrace.sqlite"),
    resolve(process.cwd(), "../../opentrace.sqlite"),
    resolve(process.cwd(), "../../spurtrace.sqlite"),
    resolve(process.cwd(), "../..", "opentrace.sqlite"),
  ];
  for (const candidate of candidates) {
    if (existsSync(/*turbopackIgnore: true*/ candidate)) return candidate;
  }
  return resolve(process.cwd(), "opentrace.sqlite");
}

export async function GET() {
  try {
    const dbPath = findDatabasePath();
    if (!existsSync(/*turbopackIgnore: true*/ dbPath)) {
      const today = new Date().toISOString().slice(0, 10);
      return NextResponse.json([today]);
    }
    const db = new DatabaseSync(dbPath);
    const rows = db.prepare(`
      SELECT DISTINCT substr(created_at, 1, 10) as log_date
      FROM sys_traces
      ORDER BY log_date DESC
    `).all() as Array<{ log_date: string }>;

    let dates = rows.map((r) => r.log_date).filter(Boolean);
    if (dates.length === 0) {
      dates = [new Date().toISOString().slice(0, 10)];
    }
    return NextResponse.json(dates);
  } catch (err: any) {
    return NextResponse.json([new Date().toISOString().slice(0, 10)]);
  }
}

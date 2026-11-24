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

export async function POST(request: Request) {
  try {
    const { sql, maxRows = 100 } = await request.json();
    if (!sql || typeof sql !== "string") {
      return NextResponse.json({ error: "Missing SQL statement." }, { status: 400 });
    }

    const trimmed = sql.trim();
    // Safety check: only allow SELECT or EXPLAIN queries in Studio
    if (!/^\s*(SELECT|EXPLAIN|PRAGMA)\b/i.test(trimmed)) {
      return NextResponse.json(
        { error: "Only read-only queries (SELECT, EXPLAIN) are permitted in SQL Studio." },
        { status: 403 }
      );
    }

    const dbPath = findDatabasePath();
    if (!existsSync(/*turbopackIgnore: true*/ dbPath)) {
      return NextResponse.json({ rows: [], columns: [], executionTimeMs: 0 });
    }

    const db = new DatabaseSync(dbPath);
    const start = performance.now();
    const rows = db.prepare(trimmed).all() as any[];
    const executionTimeMs = Math.round((performance.now() - start) * 100) / 100;

    const limitedRows = rows.slice(0, maxRows);
    const columns = limitedRows.length > 0 ? Object.keys(limitedRows[0]) : [];

    return NextResponse.json({
      rows: limitedRows,
      columns,
      totalRows: rows.length,
      executionTimeMs,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "SQL execution error" }, { status: 400 });
  }
}

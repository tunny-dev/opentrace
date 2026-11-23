import { NextResponse } from "next/server";
import {
  createSystemLogsSession,
  isValidSystemLogsSession,
  SYSTEM_LOGS_SESSION_COOKIE,
  SYSTEM_LOGS_SESSION_MAX_AGE,
  verifySystemLogsCredentials,
} from "@/lib/system-logs-auth";

function sessionCookie(value: string, maxAge: number) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SYSTEM_LOGS_SESSION_COOKIE}=${value}; Path=/api/system-logs; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`;
}

export async function GET(request: Request) {
  const value = request.headers.get("cookie")?.split(";").map((cookie) => cookie.trim()).find((cookie) => cookie.startsWith(`${SYSTEM_LOGS_SESSION_COOKIE}=`))?.slice(SYSTEM_LOGS_SESSION_COOKIE.length + 1);
  const authenticated = isValidSystemLogsSession(value);
  return NextResponse.json({ authenticated }, { status: authenticated ? 200 : 401, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const sessionSecret = process.env.SYSTEM_LOGS_SESSION_SECRET;
  const expectedUsername = process.env.SYSTEM_LOGS_ADMIN_USERNAME;
  const expectedPassword = process.env.SYSTEM_LOGS_ADMIN_PASSWORD;
  if (!sessionSecret || !expectedUsername || !expectedPassword) {
    return NextResponse.json(
      { error: "System logs authentication is not configured on the server." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  let body: { username?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!verifySystemLogsCredentials(body.username, body.password)) {
    return NextResponse.json({ error: "Invalid administrator credentials." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  const session = createSystemLogsSession();
  if (!session) {
    return NextResponse.json({ error: "System logs authentication is not configured on the server." }, { status: 503 });
  }

  return NextResponse.json(
    { authenticated: true },
    {
      headers: {
        "Cache-Control": "no-store",
        "Set-Cookie": sessionCookie(session, SYSTEM_LOGS_SESSION_MAX_AGE),
      },
    }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { authenticated: false },
    { headers: { "Cache-Control": "no-store", "Set-Cookie": sessionCookie("", 0) } }
  );
}

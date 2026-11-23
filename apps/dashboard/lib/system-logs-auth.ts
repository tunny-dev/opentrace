import { createHmac, timingSafeEqual } from "node:crypto";

export const SYSTEM_LOGS_SESSION_COOKIE = "system_logs_session";
export const SYSTEM_LOGS_SESSION_MAX_AGE = 8 * 60 * 60;

function getSessionSecret() {
  return process.env.SYSTEM_LOGS_SESSION_SECRET;
}

function sign(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function createSystemLogsSession() {
  const secret = getSessionSecret();
  if (!secret) return null;
  const issuedAt = Math.floor(Date.now() / 1000).toString();
  return `${issuedAt}.${sign(issuedAt, secret)}`;
}

export function isValidSystemLogsSession(value: string | undefined) {
  const secret = getSessionSecret();
  if (!secret || !value) return false;

  const separator = value.indexOf(".");
  if (separator < 1) return false;

  const issuedAt = value.slice(0, separator);
  const signature = value.slice(separator + 1);
  const timestamp = Number(issuedAt);
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isSafeInteger(timestamp) || timestamp > now || now - timestamp > SYSTEM_LOGS_SESSION_MAX_AGE) {
    return false;
  }

  return safeEqual(signature, sign(issuedAt, secret));
}

export function verifySystemLogsCredentials(username: unknown, password: unknown) {
  const expectedUsername = process.env.SYSTEM_LOGS_ADMIN_USERNAME;
  const expectedPassword = process.env.SYSTEM_LOGS_ADMIN_PASSWORD;
  if (!expectedUsername || !expectedPassword || typeof username !== "string" || typeof password !== "string") {
    return false;
  }

  return safeEqual(username, expectedUsername) && safeEqual(password, expectedPassword);
}

import { createHash, randomBytes, scrypt as nodeScrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import "./config.js";

const scrypt = promisify(nodeScrypt);

export const sessionCookieName = process.env.SESSION_COOKIE_NAME ?? "cms_auto_v3_session";
export const sessionTtlSeconds = Number(process.env.SESSION_TTL_SECONDS ?? `${60 * 60 * 24 * 7}`);

export function nowIso() {
  return new Date().toISOString();
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt, 64) as Buffer;
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [algorithm, salt, hashHex] = storedHash.split("$");
  if (algorithm !== "scrypt" || !salt || !hashHex) {
    return false;
  }

  const expected = Buffer.from(hashHex, "hex");
  const actual = await scrypt(password, salt, expected.length) as Buffer;

  if (expected.length !== actual.length) {
    return false;
  }

  return timingSafeEqual(expected, actual);
}

export function createSessionToken() {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function parseCookies(headerValue: string | undefined) {
  const cookies: Record<string, string> = {};
  if (!headerValue) {
    return cookies;
  }

  for (const part of headerValue.split(";")) {
    const [rawKey, ...rest] = part.trim().split("=");
    if (!rawKey || rest.length === 0) {
      continue;
    }
    cookies[rawKey] = decodeURIComponent(rest.join("="));
  }

  return cookies;
}

export function buildSessionCookie(token: string) {
  return [
    `${sessionCookieName}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    ...(process.env.NODE_ENV === "production" ? ["Secure"] : []),
    `Max-Age=${sessionTtlSeconds}`
  ].join("; ");
}

export function buildClearSessionCookie() {
  return [
    `${sessionCookieName}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    ...(process.env.NODE_ENV === "production" ? ["Secure"] : []),
    "Max-Age=0"
  ].join("; ");
}

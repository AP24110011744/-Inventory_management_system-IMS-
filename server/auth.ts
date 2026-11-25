import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { parse as parseCookies } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import { COOKIE_NAME } from "@shared/const";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;
export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

/** scrypt hash stored as `scrypt$<salt hex>$<hash hex>`. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string | null | undefined): Promise<boolean> {
  if (!stored) return false;
  const [scheme, saltHex, hashHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scrypt(password, Buffer.from(saltHex, "hex"), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

let devSecret: string | undefined;
function secretKey() {
  const configured = process.env.JWT_SECRET || process.env.MANUS_JWT_SECRET;
  if (configured) return new TextEncoder().encode(configured);
  if (process.env.NODE_ENV === "production") throw new Error("JWT_SECRET must be set in production.");
  if (!devSecret) {
    devSecret = randomBytes(32).toString("hex");
    console.warn("[Auth] JWT_SECRET not set; using a temporary secret. Sessions reset whenever the server restarts.");
  }
  return new TextEncoder().encode(devSecret);
}

export async function signSession(userId: number): Promise<string> {
  return new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor((Date.now() + SESSION_TTL_MS) / 1000))
    .sign(secretKey());
}

export async function verifySession(token: string | undefined): Promise<number | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    return typeof payload.uid === "number" ? payload.uid : null;
  } catch {
    return null;
  }
}

export function readSessionToken(req: Request): string | undefined {
  const header = req.headers.cookie;
  if (header) {
    const token = parseCookies(header)[COOKIE_NAME];
    if (token) return token;
  }
  return undefined;
}

export function validatePasswordStrength(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (password.length > 128) return "Password must be at most 128 characters.";
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return "Password must contain at least one letter and one number.";
  return null;
}

/** Tiny in-memory limiter for sign-in / sign-up attempts (per key, sliding window). */
const attempts = new Map<string, number[]>();
export function checkRateLimit(key: string, max = 8, windowMs = 15 * 60 * 1000): void {
  const now = Date.now();
  const recent = (attempts.get(key) ?? []).filter(t => now - t < windowMs);
  if (recent.length >= max) {
    const wait = Math.ceil((windowMs - (now - recent[0])) / 60000);
    throw new Error(`Too many attempts. Try again in about ${wait} minute${wait === 1 ? "" : "s"}.`);
  }
  recent.push(now);
  attempts.set(key, recent);
}
export function clearRateLimit(key: string) { attempts.delete(key); }

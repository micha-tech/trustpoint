import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest } from "next/server";

function adminSecret(): string | undefined {
  return process.env.DISPUTE_SECRET;
}

function safeEqual(supplied: string, expected: string): boolean {
  const expectedBuf = Buffer.from(expected);
  const suppliedBuf = Buffer.from(supplied);
  return suppliedBuf.length === expectedBuf.length && timingSafeEqual(suppliedBuf, expectedBuf);
}

function signSession(expiresAt: number): string {
  const secret = adminSecret();
  if (!secret) throw new Error("DISPUTE_SECRET environment variable is not set");
  return createHmac("sha256", secret).update(String(expiresAt)).digest("hex");
}

export function verifyAdminPassword(supplied: string): boolean {
  const expected = process.env.DISPUTE_SECRET;
  if (!expected) return false;
  return safeEqual(supplied, expected);
}

export function createAdminSessionValue(): string {
  const expiresAt = Date.now() + 8 * 60 * 60 * 1000;
  return `${expiresAt}.${signSession(expiresAt)}`;
}

function verifyAdminSession(value: string): boolean {
  try {
    const [expiresRaw, signature] = value.split(".");
    const expiresAt = Number(expiresRaw);
    if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;
    return safeEqual(signature ?? "", signSession(expiresAt));
  } catch {
    return false;
  }
}

export function verifyAdminSecret(req: NextRequest): boolean {
  const session = req.cookies.get("admin_session")?.value;
  if (session && verifyAdminSession(session)) return true;

  const supplied = req.headers.get("authorization")?.replace("Bearer ", "") ?? "";
  return verifyAdminPassword(supplied);
}

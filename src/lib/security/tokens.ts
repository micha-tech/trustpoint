import { createHmac, randomBytes } from "crypto";

const SIGNING_SECRET = () => process.env.SIGNING_SECRET ?? "";

// ──────────────────────────────────────────
// Signed tokens for milestone approvals
// Single-use, time-bound, HMAC-signed
// ──────────────────────────────────────────

export interface SignedPayload {
  milestoneId: string;
  jobId: string;
  action: string;
  exp: number; // unix ms
}

export function generateApprovalToken(milestoneId: string, jobId: string): string {
  const exp = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  const payload: SignedPayload = { milestoneId, jobId, action: "approve", exp };
  const data = JSON.stringify(payload);
  const hmac = createHmac("sha256", SIGNING_SECRET()).update(data).digest("hex");
  const token = Buffer.from(data).toString("base64url") + "." + hmac;
  return token;
}

export function verifyApprovalToken(token: string): SignedPayload {
  const parts = token.split(".");
  if (parts.length !== 2) throw new Error("Invalid token format");
  const [encoded, sig] = parts;
  const data = Buffer.from(encoded, "base64url").toString();
  const expected = createHmac("sha256", SIGNING_SECRET()).update(data).digest("hex");
  if (!safeCompare(sig, expected)) throw new Error("Invalid token signature");
  const payload: SignedPayload = JSON.parse(data);
  if (payload.action !== "approve") throw new Error("Invalid token action");
  if (Date.now() > payload.exp) throw new Error("Token expired");
  return payload;
}

// ──────────────────────────────────────────
// Constant-time comparison to prevent timing attacks
// ──────────────────────────────────────────

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

// ──────────────────────────────────────────
// Generate human-readable references
// ──────────────────────────────────────────

export function generateJobRef(): string {
  const rand = randomBytes(3).readUIntBE(0, 3).toString(16).toUpperCase().slice(0, 6);
  return `JOB-${rand}`;
}

export function generateRef(prefix: string): string {
  const rand = randomBytes(4).readUIntBE(0, 4).toString(16).toUpperCase();
  return `${prefix}-${rand}`;
}

export function generateClientAccessToken(jobId: string): string {
  const exp = Date.now() + 90 * 24 * 60 * 60 * 1000;
  const payload = { jobId, action: "client_access", exp };
  const data = JSON.stringify(payload);
  const hmac = createHmac("sha256", SIGNING_SECRET()).update(data).digest("hex");
  return Buffer.from(data).toString("base64url") + "." + hmac;
}

export function verifyClientAccessToken(token: string): { jobId: string } {
  const parts = token.split(".");
  if (parts.length !== 2) throw new Error("Invalid token format");
  const [encoded, sig] = parts;
  const data = Buffer.from(encoded, "base64url").toString();
  const expected = createHmac("sha256", SIGNING_SECRET()).update(data).digest("hex");
  if (!safeCompare(sig, expected)) throw new Error("Invalid token signature");
  const payload = JSON.parse(data);
  if (payload.action !== "client_access") throw new Error("Invalid token action");
  if (Date.now() > payload.exp) throw new Error("Token expired");
  return { jobId: payload.jobId };
}

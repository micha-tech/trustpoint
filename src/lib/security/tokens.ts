import { createHmac, randomBytes } from "crypto";

function signingSecret(): string {
  const secret = process.env.SIGNING_SECRET;
  if (!secret) {
    throw new Error("SIGNING_SECRET environment variable is not set");
  }
  return secret;
}

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

export function generateJobRef(): string {
  const rand = randomBytes(4).toString("hex").toUpperCase().slice(0, 8);
  return `JOB-${rand}`;
}

export function generateRef(prefix: string): string {
  const rand = randomBytes(12).toString("hex").toUpperCase();
  return `${prefix}-${rand}`;
}

export function generateClientAccessToken(jobId: string): string {
  const exp = Date.now() + 90 * 24 * 60 * 60 * 1000;
  const payload = { jobId, action: "client_access", exp };
  const data = JSON.stringify(payload);
  const hmac = createHmac("sha256", signingSecret()).update(data).digest("hex");
  return Buffer.from(data).toString("base64url") + "." + hmac;
}

export function generateClientVerificationToken(jobId: string, email: string): string {
  const exp = Date.now() + 24 * 60 * 60 * 1000;
  const payload = { jobId, email: email.trim().toLowerCase(), action: "client_verified", exp };
  const data = JSON.stringify(payload);
  const hmac = createHmac("sha256", signingSecret()).update(data).digest("hex");
  return Buffer.from(data).toString("base64url") + "." + hmac;
}

export function verifyClientAccessToken(token: string): { jobId: string } {
  const parts = token.split(".");
  if (parts.length !== 2) throw new Error("Invalid token format");
  const [encoded, sig] = parts;
  const data = Buffer.from(encoded, "base64url").toString();
  const expected = createHmac("sha256", signingSecret()).update(data).digest("hex");
  if (!safeCompare(sig, expected)) throw new Error("Invalid token signature");
  const payload = JSON.parse(data);
  if (payload.action !== "client_access") throw new Error("Invalid token action");
  if (Date.now() > payload.exp) throw new Error("Token expired");
  return { jobId: payload.jobId };
}

export function verifyClientVerificationToken(token: string): { jobId: string; email: string } {
  const parts = token.split(".");
  if (parts.length !== 2) throw new Error("Invalid token format");
  const [encoded, sig] = parts;
  const data = Buffer.from(encoded, "base64url").toString();
  const expected = createHmac("sha256", signingSecret()).update(data).digest("hex");
  if (!safeCompare(sig, expected)) throw new Error("Invalid token signature");
  const payload = JSON.parse(data);
  if (payload.action !== "client_verified") throw new Error("Invalid token action");
  if (Date.now() > payload.exp) throw new Error("Token expired");
  return { jobId: payload.jobId, email: payload.email };
}

export function hashVerificationCode(jobId: string, email: string, code: string): string {
  return createHmac("sha256", signingSecret())
    .update(`${jobId}:${email.trim().toLowerCase()}:${code}`)
    .digest("hex");
}

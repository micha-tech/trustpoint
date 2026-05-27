import { createHmac, timingSafeEqual } from "crypto";

function paystackSecret(): string {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    throw new Error("PAYSTACK_SECRET_KEY environment variable is not set");
  }
  return secret;
}

// ──────────────────────────────────────────
// Paystack webhook signature verification
// ──────────────────────────────────────────

export function verifyPaystackSignature(
  body: string,
  signatureHeader: string
): boolean {
  const hash = createHmac("sha512", paystackSecret())
    .update(body)
    .digest("hex");

  try {
    const sigBuf = Buffer.from(signatureHeader, "hex");
    const hashBuf = Buffer.from(hash, "hex");
    if (sigBuf.length !== hashBuf.length) return false;
    return timingSafeEqual(sigBuf, hashBuf);
  } catch {
    return false;
  }
}

// ──────────────────────────────────────────
// HMAC-ledger entry signing for audit integrity
// ──────────────────────────────────────────

export function signLedgerEntry(data: string): string {
  const secret = process.env.LEDGER_SECRET;
  if (!secret) {
    throw new Error("LEDGER_SECRET environment variable is not set");
  }
  return createHmac("sha256", secret)
    .update(data)
    .digest("hex");
}

export function verifyLedgerEntry(data: string, signature: string): boolean {
  const expected = signLedgerEntry(data);
  return safeCompare(signature, expected);
}

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

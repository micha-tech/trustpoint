import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { signLedgerEntry } from "@/lib/security/webhooks";

// ──────────────────────────────────────────
// Append-only ledger
// Every financial event is recorded immutably
// ──────────────────────────────────────────

export async function writeLedgerEntry(params: {
  jobId: string;
  event: string;
  actorId?: string;
  amount?: number;
  balance?: number;
  reference?: string;
  metadata?: Record<string, unknown>;
}) {
  const { jobId, event, actorId, amount, balance, reference, metadata } = params;
  const data = JSON.stringify({ jobId, event, actorId, amount, balance, reference, metadata });
  const signature = signLedgerEntry(data);

  return prisma.ledgerEntry.create({
    data: {
      jobId,
      event,
      actorId,
      amount,
      balance,
      reference,
      metadata: (metadata ?? {}) as Prisma.InputJsonValue,
      signature,
    },
  });
}

export async function getLedger(jobId: string) {
  return prisma.ledgerEntry.findMany({
    where: { jobId },
    orderBy: { createdAt: "asc" },
  });
}

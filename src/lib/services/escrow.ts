import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { transitionEscrow, EscrowState } from "@/lib/state-machines";
import { writeLedgerEntry } from "@/lib/services/ledger";

const MAX_RETRIES = 3;

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2025" &&
        attempt < MAX_RETRIES
      ) {
        continue;
      }
      throw e;
    }
  }
  throw new Error("Escrow operation failed after retries");
}

export async function getOrCreateEscrow(jobId: string) {
  let escrow = await prisma.escrowState.findUnique({ where: { jobId } });
  if (!escrow) {
    escrow = await prisma.escrowState.create({
      data: {
        jobId,
        status: EscrowState.UNFUNDED,
        totalAmount: 0,
        releasedAmount: 0,
        pendingAmount: 0,
        refundedAmount: 0,
      },
    });
  }
  return escrow;
}

export async function fundEscrow(jobId: string, amount: number) {
  return withRetry(async () => {
    const escrow = await getOrCreateEscrow(jobId);
    const next = transitionEscrow(escrow.status as EscrowState,
      escrow.totalAmount === 0 ? EscrowState.FUNDED : EscrowState.PARTIALLY_FUNDED);

    const updated = await prisma.escrowState.update({
      where: { id: escrow.id, version: escrow.version },
      data: {
        status: next,
        totalAmount: { increment: amount },
        pendingAmount: { increment: amount },
        version: { increment: 1 },
      },
    });

    await writeLedgerEntry({
      jobId,
      event: "escrow.funded",
      amount,
      balance: updated.totalAmount,
      reference: `escrow-${jobId}-${Date.now()}`,
      metadata: { previousVersion: escrow.version },
    });

    return updated;
  });
}

export async function releaseFromEscrow(
  jobId: string,
  amount: number,
  milestoneId: string
) {
  return withRetry(async () => {
    const escrow = await getOrCreateEscrow(jobId);
    if (escrow.pendingAmount < amount) {
      throw new Error("Insufficient escrow balance");
    }

    const next = transitionEscrow(
      escrow.status as EscrowState,
      escrow.totalAmount - escrow.releasedAmount === amount
        ? EscrowState.RELEASED
        : EscrowState.PARTIALLY_RELEASED
    );

    const updated = await prisma.escrowState.update({
      where: { id: escrow.id, version: escrow.version },
      data: {
        status: next,
        releasedAmount: { increment: amount },
        pendingAmount: { decrement: amount },
        version: { increment: 1 },
      },
    });

    await writeLedgerEntry({
      jobId,
      event: "escrow.released",
      amount: -amount,
      balance: updated.releasedAmount,
      reference: `release-${milestoneId}`,
      metadata: { milestoneId },
    });

    return updated;
  });
}

export async function refundEscrow(jobId: string) {
  return withRetry(async () => {
    const escrow = await getOrCreateEscrow(jobId);
    const next = transitionEscrow(escrow.status as EscrowState, EscrowState.REFUNDED);

    const updated = await prisma.escrowState.update({
      where: { id: escrow.id, version: escrow.version },
      data: {
        status: next,
        refundedAmount: escrow.pendingAmount,
        pendingAmount: 0,
        version: { increment: 1 },
      },
    });

    await writeLedgerEntry({
      jobId,
      event: "escrow.refunded",
      amount: -updated.refundedAmount,
      balance: 0,
    });

    return updated;
  });
}

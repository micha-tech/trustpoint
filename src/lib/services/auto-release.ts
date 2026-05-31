import { prisma } from "@/lib/prisma";
import { generateRef } from "@/lib/security/tokens";
import { signLedgerEntry } from "@/lib/security/webhooks";
import { initiateTransfer } from "@/lib/paystack";
import type { Prisma } from "@prisma/client";

const AUTO_RELEASE_HOURS = 48;

export async function maybeAutoRelease(jobId: string): Promise<boolean> {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      milestones: true,
      escrow: true,
      provider: { include: { providerProfile: true } },
    },
  });

  if (!job || !job.allApprovedAt || job.status === "DISPUTED" || job.status === "COMPLETED" || job.status === "CANCELLED") {
    return false;
  }

  const elapsed = Date.now() - job.allApprovedAt.getTime();
  if (elapsed < AUTO_RELEASE_HOURS * 60 * 60 * 1000) {
    return false;
  }

  const approvedMilestones = job.milestones.filter((m) => m.status === "APPROVED");
  if (approvedMilestones.length === 0) return false;

  const allTerminal = job.milestones.every((m) => ["APPROVED", "RELEASED"].includes(m.status));
  if (!allTerminal) return false;

  const providerProfile = job.provider?.providerProfile;
  if (!providerProfile?.recipientCode) return false;

  if (job.escrow?.status !== "FUNDED" && job.escrow?.status !== "PARTIALLY_RELEASED") {
    return false;
  }

  const batchTotal = approvedMilestones.reduce((sum, m) => sum + m.amount, 0);
  if (batchTotal <= 0) return false;

  const existingPayout = await prisma.payoutRelease.findFirst({
    where: { jobId: job.id, milestoneId: null, status: { not: "FAILED" } },
  });
  if (existingPayout) return false;

  const batchRef = generateRef("AUTO");
  const approvedIds = approvedMilestones.map((m) => m.id);

  try {
    await prisma.$transaction(async (tx) => {
      await tx.payoutRelease.create({
        data: {
          jobId: job.id,
          amount: batchTotal,
          status: "PENDING",
          recipientCode: providerProfile.recipientCode!,
          reference: batchRef,
        },
      });

      await tx.job.update({
        where: { id: job.id },
        data: { approvedAt: new Date(), status: "COMPLETED" },
      });

      await tx.ledgerEntry.create({
        data: {
          jobId: job.id,
          event: "payout.auto_release_initiated",
          actorId: job.providerId,
          amount: batchTotal,
          reference: batchRef,
          signature: signLedgerEntry(JSON.stringify({
            jobId: job.id, event: "payout.auto_release_initiated", amount: batchTotal, reference: batchRef,
          })),
          metadata: { milestoneIds: approvedIds } as Prisma.InputJsonValue,
        },
      });
    });

    const transfer = await initiateTransfer({
      amount: batchTotal,
      recipientCode: providerProfile.recipientCode,
      reference: batchRef,
      reason: `Auto-release: ${job.title}`,
    });

    await prisma.payoutRelease.update({
      where: { reference: batchRef },
      data: {
        status: transfer.status === "success" ? "COMPLETED" : "PROCESSING",
        transferCode: transfer.transferCode,
        completedAt: transfer.status === "success" ? new Date() : null,
      },
    });

    if (transfer.status === "success") {
      await prisma.milestone.updateMany({
        where: { id: { in: approvedIds } },
        data: { status: "RELEASED" },
      });
    }

    return true;
  } catch {
    await prisma.ledgerEntry.create({
      data: {
        jobId: job.id,
        event: "payout.auto_release_failed",
        amount: batchTotal,
        reference: batchRef,
        signature: signLedgerEntry(JSON.stringify({
          jobId: job.id, event: "payout.auto_release_failed", amount: batchTotal, reference: batchRef,
        })),
        metadata: { reason: "Auto-release transfer failed" } as Prisma.InputJsonValue,
      },
    });
    return false;
  }
}
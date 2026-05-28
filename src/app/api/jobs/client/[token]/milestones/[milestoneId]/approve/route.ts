import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyClientAccessToken, verifyClientVerificationToken, generateRef } from "@/lib/security/tokens";
import { signLedgerEntry } from "@/lib/security/webhooks";
import { validateOrigin } from "@/lib/middleware/origin";
import { initiateTransfer } from "@/lib/paystack";
import type { Prisma } from "@prisma/client";

function requireClientVerification(req: NextRequest, jobId: string, clientEmail: string | null) {
  const token = req.headers.get("x-client-verification") ?? "";
  const verified = verifyClientVerificationToken(token);
  if (verified.jobId !== jobId) throw new Error("UNAUTHORIZED");
  if (clientEmail && verified.email !== clientEmail.toLowerCase()) throw new Error("UNAUTHORIZED");
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string; milestoneId: string }> }
) {
  try {
    const originErr = validateOrigin(req);
    if (originErr) return originErr;

    const { token, milestoneId } = await params;
    const { jobId } = verifyClientAccessToken(token);

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        escrow: true,
        artisan: { include: { artisanProfile: true } },
        milestones: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    requireClientVerification(req, job.id, job.clientEmail);

    if (job.status === "DISPUTED") {
      return NextResponse.json({ error: "Cannot approve in a disputed job" }, { status: 400 });
    }

    const milestone = job.milestones.find((m) => m.id === milestoneId);
    if (!milestone) {
      return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
    }

    if (milestone.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Milestone has not been completed yet by the artisan" },
        { status: 400 }
      );
    }

    if (job.escrow?.status !== "FUNDED" && job.escrow?.status !== "PARTIALLY_RELEASED") {
      return NextResponse.json(
        { error: "Escrow is not in a releasable state" },
        { status: 400 }
      );
    }

    const artisanProfile = job.artisan?.artisanProfile;
    if (!artisanProfile?.recipientCode) {
      return NextResponse.json(
        { error: "The artisan has not set up their payout details yet. Ask them to update their profile." },
        { status: 400 }
      );
    }

    const escrow = job.escrow;
    if (escrow.pendingAmount < milestone.amount) {
      return NextResponse.json({ error: "Insufficient funds in escrow" }, { status: 400 });
    }

    let shouldBatch = false;
    let batchMilestoneIds: string[] = [];
    let batchTotal = 0;
    let batchRef = "";
    const payoutRef = generateRef("PO");
    const ledgerData = JSON.stringify({
      jobId: job.id, event: "milestone.approved", actorId: job.clientId,
      amount: milestone.amount, reference: `APPROVE-MS-${milestone.id.slice(0, 8)}`,
    });
    const ledgerSignature = signLedgerEntry(ledgerData);

    await prisma.$transaction(async (tx) => {
      const msClaim = await tx.milestone.updateMany({
        where: { id: milestone.id, status: "COMPLETED" },
        data: { status: "APPROVED" },
      });
      if (msClaim.count === 0) throw new Error("Milestone has already been approved");

      const newPending = escrow.pendingAmount - milestone.amount;
      const newEscrowStatus = newPending <= 0 ? "RELEASED" : "PARTIALLY_RELEASED";

      const escrowClaim = await tx.escrowState.updateMany({
        where: { jobId: job.id, pendingAmount: { gte: milestone.amount } },
        data: {
          status: newEscrowStatus,
          releasedAmount: { increment: milestone.amount },
          pendingAmount: { decrement: milestone.amount },
        },
      });
      if (escrowClaim.count === 0) throw new Error("Escrow update failed");

      await tx.payoutRelease.create({
        data: {
          jobId: job.id,
          milestoneId: milestone.id,
          amount: milestone.amount,
          status: "PENDING",
          recipientCode: artisanProfile.recipientCode!,
          reference: payoutRef,
        },
      });

      await tx.ledgerEntry.create({
        data: {
          jobId: job.id,
          event: "milestone.approved",
          actorId: job.clientId,
          amount: milestone.amount,
          reference: `APPROVE-MS-${milestone.id.slice(0, 8)}`,
          signature: ledgerSignature,
          metadata: { milestoneId: milestone.id, milestoneTitle: milestone.title } as Prisma.InputJsonValue,
        },
      });

      // Check if ALL milestones are now in terminal state (APPROVED or RELEASED)
      const allMilestones = await tx.milestone.findMany({
        where: { jobId: job.id },
        select: { id: true, status: true, amount: true },
      });
      const allTerminal = allMilestones.every((m) =>
        ["APPROVED", "RELEASED"].includes(m.status)
      );
      const approvedMs = allMilestones.filter((m) => m.status === "APPROVED");

      if (allTerminal && approvedMs.length > 0) {
        batchMilestoneIds = approvedMs.map((m) => m.id);
        batchTotal = approvedMs.reduce((sum, m) => sum + m.amount, 0);
        batchRef = generateRef("BATCH");

        await tx.job.update({
          where: { id: job.id },
          data: { approvedAt: new Date(), status: "COMPLETED" },
        });

        await tx.ledgerEntry.create({
          data: {
            jobId: job.id,
            event: "payout.batch_initiated",
            actorId: job.clientId,
            amount: batchTotal,
            reference: batchRef,
            signature: signLedgerEntry(JSON.stringify({
              jobId: job.id, event: "payout.batch_initiated", amount: batchTotal, reference: batchRef,
            })),
            metadata: { milestoneIds: approvedMs.map((m) => m.id) } as Prisma.InputJsonValue,
          },
        });
      }
    });

    // External Paystack call — outside transaction
    if (batchTotal > 0 && batchMilestoneIds.length > 0) {
      try {
        const transfer = await initiateTransfer({
          amount: batchTotal,
          recipientCode: artisanProfile.recipientCode,
          reference: batchRef,
          reason: `Batch payout for ${job.title}`,
        });

        await prisma.payoutRelease.updateMany({
          where: { jobId: job.id, milestoneId: { in: batchMilestoneIds } },
          data: {
            status: transfer.status === "success" ? "COMPLETED" : "PROCESSING",
            transferCode: transfer.transferCode,
            completedAt: transfer.status === "success" ? new Date() : null,
          },
        });

        if (transfer.status === "success") {
          await prisma.milestone.updateMany({
            where: { id: { in: batchMilestoneIds } },
            data: { status: "RELEASED" },
          });
        }
      } catch {
        await prisma.ledgerEntry.create({
          data: {
            jobId: job.id,
            event: "payout.batch_failed",
            amount: batchTotal,
            reference: batchRef,
            signature: signLedgerEntry(JSON.stringify({
              jobId: job.id, event: "payout.batch_failed", amount: batchTotal, reference: batchRef,
            })),
            metadata: { reason: "Transfer initiation failed" } as Prisma.InputJsonValue,
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    if (msg === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Client verification required" }, { status: 403 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

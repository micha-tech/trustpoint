import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyClientAccessToken } from "@/lib/security/tokens";
import { writeLedgerEntry } from "@/lib/services/ledger";
import { validateOrigin } from "@/lib/middleware/origin";
import { initiateTransfer } from "@/lib/paystack";
import { generateRef } from "@/lib/security/tokens";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const originErr = validateOrigin(req);
    if (originErr) return originErr;

    const { token } = await params;
    const { jobId } = verifyClientAccessToken(token);

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        escrow: true,
        artisan: { include: { artisanProfile: true } },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Artisan has not marked this job as complete yet" },
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

    const releaseAmount = Math.min(job.amount, job.escrow.pendingAmount);

    await prisma.$transaction(async (tx) => {
      await tx.escrowState.update({
        where: { jobId: job.id },
        data: {
          status: "RELEASED",
          releasedAmount: { increment: releaseAmount },
          pendingAmount: { decrement: releaseAmount },
        },
      });
      await tx.job.update({
        where: { id: job.id },
        data: { status: "COMPLETED", approvedAt: new Date() },
      });
    });

    await writeLedgerEntry({
      jobId: job.id,
      event: "job.approved",
      actorId: job.clientId,
      amount: releaseAmount,
      reference: `APPROVE-${job.ref}`,
    });

    const payoutRef = generateRef("PO");

    await prisma.payoutRelease.create({
      data: {
        jobId: job.id,
        amount: releaseAmount,
        status: "PENDING",
        recipientCode: artisanProfile.recipientCode,
        reference: payoutRef,
      },
    });

    try {
      const transfer = await initiateTransfer({
        amount: releaseAmount,
        recipientCode: artisanProfile.recipientCode,
        reference: payoutRef,
        reason: `Payout for ${job.title}`,
      });
      await prisma.payoutRelease.update({
        where: { reference: payoutRef },
        data: {
          status: transfer.status === "success" ? "COMPLETED" : "PROCESSING",
          transferCode: transfer.transferCode,
          completedAt: transfer.status === "success" ? new Date() : null,
        },
      });
    } catch {
      await prisma.payoutRelease.update({
        where: { reference: payoutRef },
        data: { status: "FAILED", failureReason: "Transfer initiation failed" },
      });
      await writeLedgerEntry({
        jobId: job.id,
        event: "payout.failed",
        amount: releaseAmount,
        reference: payoutRef,
        metadata: { reason: "Transfer initiation failed" },
      });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeLedgerEntry } from "@/lib/services/ledger";
import { refundPayment, initiateTransfer } from "@/lib/paystack";
import { generateRef } from "@/lib/security/tokens";
import { verifyAdminSecret } from "@/lib/security/admin";
import { validateOrigin } from "@/lib/middleware/origin";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const originErr = validateOrigin(req);
    if (originErr) return originErr;

    if (!verifyAdminSecret(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { resolution, note } = body;

    if (!resolution || !["ARTISAN", "CLIENT"].includes(resolution)) {
      return NextResponse.json(
        { error: "Resolution must be ARTISAN or CLIENT" },
        { status: 400 }
      );
    }

    const dispute = await prisma.dispute.findUnique({
      where: { id },
      include: {
        job: {
          include: {
            escrow: true,
            artisan: { include: { artisanProfile: true } },
          },
        },
      },
    });

    if (!dispute) {
      return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
    }

    if (dispute.status !== "OPEN" && dispute.status !== "UNDER_REVIEW") {
      return NextResponse.json(
        { error: "Dispute is already resolved" },
        { status: 400 }
      );
    }

    const job = dispute.job;
    const escrow = job.escrow;

    if (!escrow) {
      return NextResponse.json({ error: "No escrow found for this job" }, { status: 400 });
    }

    if (resolution === "ARTISAN") {
      if (!job.artisan?.artisanProfile?.recipientCode) {
        return NextResponse.json(
          { error: "Artisan has no payout recipient configured" },
          { status: 400 }
        );
      }

      const releaseAmount = Math.min(job.amount, escrow.pendingAmount);
      if (releaseAmount <= 0) {
        return NextResponse.json({ error: "Escrow has no releasable funds" }, { status: 400 });
      }

      await prisma.$transaction(async (tx) => {
        const disputeClaim = await tx.dispute.updateMany({
          where: { id: dispute.id, status: { in: ["OPEN", "UNDER_REVIEW"] } },
          data: {
            status: "RESOLVED_ARTISAN",
            resolution: note ?? "Resolved in favor of artisan",
            resolvedAt: new Date(),
          },
        });
        if (disputeClaim.count === 0) throw new Error("Dispute is already resolved");

        const escrowClaim = await tx.escrowState.updateMany({
          where: { jobId: job.id, pendingAmount: { gte: releaseAmount } },
          data: {
            status: "RELEASED",
            releasedAmount: { increment: releaseAmount },
            pendingAmount: { decrement: releaseAmount },
          },
        });
        if (escrowClaim.count === 0) throw new Error("Escrow is not in a releasable state");

        await tx.job.update({
          where: { id: job.id },
          data: { status: "COMPLETED", approvedAt: new Date() },
        });
      });

      await writeLedgerEntry({
        jobId: job.id,
        event: "escrow.released",
        amount: releaseAmount,
        reference: `RESOLVE-ARTISAN-${job.ref}`,
        metadata: { disputeId: dispute.id, resolution: "ARTISAN" },
      });

      const payoutRef = generateRef("PO");
      await prisma.payoutRelease.create({
        data: {
          jobId: job.id,
          amount: releaseAmount,
          status: "PENDING",
          recipientCode: job.artisan.artisanProfile.recipientCode,
          reference: payoutRef,
        },
      });

      try {
        const transfer = await initiateTransfer({
          amount: releaseAmount,
          recipientCode: job.artisan.artisanProfile.recipientCode,
          reference: payoutRef,
          reason: `Dispute resolution — payout for ${job.title}`,
        });
        await prisma.payoutRelease.update({
          where: { reference: payoutRef },
          data: {
            status: transfer.status === "success" ? "COMPLETED" : "PROCESSING",
            transferCode: transfer.transferCode,
            completedAt: transfer.status === "success" ? new Date() : null,
          },
        });
        await writeLedgerEntry({
          jobId: job.id,
          event: transfer.status === "success" ? "payout.completed" : "payout.processing",
          amount: releaseAmount,
          reference: payoutRef,
        });
      } catch {
        await prisma.payoutRelease.update({
          where: { reference: payoutRef },
          data: { status: "FAILED", failureReason: "Transfer failed during dispute resolution" },
        });
      }
    }

    if (resolution === "CLIENT") {
      const paidPaymentRefs = await prisma.paymentReference.findMany({
        where: { jobId: job.id, status: "success" },
        select: { reference: true },
      });

      await prisma.$transaction(async (tx) => {
        const disputeClaim = await tx.dispute.updateMany({
          where: { id: dispute.id, status: { in: ["OPEN", "UNDER_REVIEW"] } },
          data: {
            status: "RESOLVED_CLIENT",
            resolution: note ?? "Resolved in favor of client — refund issued",
            resolvedAt: new Date(),
          },
        });
        if (disputeClaim.count === 0) throw new Error("Dispute is already resolved");

        await tx.escrowState.update({
          where: { jobId: job.id },
          data: {
            status: "REFUNDED",
            refundedAmount: escrow.pendingAmount,
            pendingAmount: 0,
          },
        });
        await tx.job.update({
          where: { id: job.id },
          data: { status: "CANCELLED" },
        });
      });

      await writeLedgerEntry({
        jobId: job.id,
        event: "escrow.refunded",
        amount: -escrow.pendingAmount,
        reference: `RESOLVE-CLIENT-${job.ref}`,
        metadata: { disputeId: dispute.id, resolution: "CLIENT" },
      });

      for (const pr of paidPaymentRefs) {
        try {
          await refundPayment({
            transactionReference: pr.reference,
            reason: `Dispute resolution — refund for ${job.title}`,
          });
        } catch {
          if (process.env.NODE_ENV !== "production") {
            console.error("Refund failed for", pr.reference);
          }
        }
      }
    }

    return NextResponse.json({ success: true, resolution });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

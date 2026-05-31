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
        provider: { include: { providerProfile: true } },
        milestones: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    requireClientVerification(req, job.id, job.clientEmail);

    if (job.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Provider has not marked this job as complete yet" },
        { status: 400 }
      );
    }

    if (job.escrow?.status !== "FUNDED" && job.escrow?.status !== "PARTIALLY_RELEASED") {
      return NextResponse.json(
        { error: "Escrow is not in a releasable state" },
        { status: 400 }
      );
    }

    const providerProfile = job.provider?.providerProfile;
    if (!providerProfile?.recipientCode) {
      return NextResponse.json(
        { error: "The provider has not set up their payout details yet. Ask them to update their profile." },
        { status: 400 }
      );
    }

    // If job has milestones, approve all completed milestones
    const hasMilestones = job.milestones && job.milestones.length > 0;
    const completedMilestones = hasMilestones
      ? job.milestones.filter((m) => m.status === "COMPLETED")
      : [];

    if (hasMilestones && completedMilestones.length === 0) {
      return NextResponse.json(
        { error: "No completed milestones to approve" },
        { status: 400 }
      );
    }

    const releaseAmount = hasMilestones
      ? completedMilestones.reduce((sum, m) => sum + m.amount, 0)
      : Math.min(job.amount, job.escrow.pendingAmount);

    if (releaseAmount <= 0) {
      return NextResponse.json({ error: "Escrow has no releasable funds" }, { status: 400 });
    }

    const payoutRef = generateRef("PO");
    const ledgerData = JSON.stringify({
      jobId: job.id, event: "job.approved", actorId: job.clientId, amount: releaseAmount, reference: `APPROVE-${job.ref}`,
    });
    const ledgerSignature = signLedgerEntry(ledgerData);

    await prisma.$transaction(async (tx) => {
      const jobClaim = await tx.job.updateMany({
        where: { id: job.id, status: "COMPLETED", approvedAt: null },
        data: { approvedAt: new Date() },
      });
      if (jobClaim.count === 0) throw new Error("Job has already been approved");

      const escrowClaim = await tx.escrowState.updateMany({
        where: {
          jobId: job.id,
          status: { in: ["FUNDED", "PARTIALLY_RELEASED"] },
          pendingAmount: { gte: releaseAmount },
        },
        data: {
          status: releaseAmount >= job.escrow!.pendingAmount ? "RELEASED" : "PARTIALLY_RELEASED",
          releasedAmount: { increment: releaseAmount },
          pendingAmount: { decrement: releaseAmount },
        },
      });
      if (escrowClaim.count === 0) throw new Error("Escrow is not in a releasable state");

      if (hasMilestones) {
        await tx.milestone.updateMany({
          where: { id: { in: completedMilestones.map((m) => m.id) }, status: "COMPLETED" },
          data: { status: "APPROVED" },
        });
      }

      await tx.payoutRelease.create({
        data: {
          jobId: job.id,
          amount: releaseAmount,
          status: "PENDING",
          recipientCode: providerProfile.recipientCode!,
          reference: payoutRef,
        },
      });

      await tx.ledgerEntry.create({
        data: {
          jobId: job.id,
          event: "job.approved",
          actorId: job.clientId,
          amount: releaseAmount,
          reference: `APPROVE-${job.ref}`,
          signature: ledgerSignature,
          metadata: {} as Prisma.InputJsonValue,
        },
      });
    });

    try {
      const transfer = await initiateTransfer({
        amount: releaseAmount,
        recipientCode: providerProfile.recipientCode,
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
      if (transfer.status === "success" && hasMilestones) {
        await prisma.milestone.updateMany({
          where: { id: { in: completedMilestones.map((m) => m.id) } },
          data: { status: "RELEASED" },
        });
      }
    } catch {
      await prisma.payoutRelease.update({
        where: { reference: payoutRef },
        data: { status: "FAILED", failureReason: "Transfer initiation failed" },
      });
      const failLedgerData = JSON.stringify({
        jobId: job.id, event: "payout.failed", amount: releaseAmount, reference: payoutRef, metadata: { reason: "Transfer initiation failed" },
      });
      const failLedgerSignature = signLedgerEntry(failLedgerData);
      await prisma.ledgerEntry.create({
        data: {
          jobId: job.id,
          event: "payout.failed",
          amount: releaseAmount,
          reference: payoutRef,
          signature: failLedgerSignature,
          metadata: { reason: "Transfer initiation failed" } as Prisma.InputJsonValue,
        },
      });
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

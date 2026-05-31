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

    if (job.status === "DISPUTED") {
      return NextResponse.json({ error: "Cannot release payment in a disputed job" }, { status: 400 });
    }

    const approvedMilestones = job.milestones.filter((m) => m.status === "APPROVED");
    if (approvedMilestones.length === 0) {
      return NextResponse.json({ error: "No approved milestones to release" }, { status: 400 });
    }

    const existingPayout = await prisma.payoutRelease.findFirst({
      where: { jobId: job.id, status: { not: "FAILED" } },
    });
    if (existingPayout) {
      return NextResponse.json({ error: "Payment has already been released" }, { status: 400 });
    }

    const providerProfile = job.provider?.providerProfile;
    if (!providerProfile?.recipientCode) {
      return NextResponse.json(
        { error: "The provider has not set up their payout details yet." },
        { status: 400 }
      );
    }

    const batchTotal = approvedMilestones.reduce((sum, m) => sum + m.amount, 0);
    if (batchTotal <= 0) {
      return NextResponse.json({ error: "No funds to release" }, { status: 400 });
    }

    const batchRef = generateRef("RLS");
    const approvedIds = approvedMilestones.map((m) => m.id);

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
        data: { approvedAt: new Date() },
      });

      await tx.ledgerEntry.create({
        data: {
          jobId: job.id,
          event: "payout.manual_release_initiated",
          actorId: job.clientId,
          amount: batchTotal,
          reference: batchRef,
          signature: signLedgerEntry(JSON.stringify({
            jobId: job.id, event: "payout.manual_release_initiated", amount: batchTotal, reference: batchRef,
          })),
          metadata: { milestoneIds: approvedIds } as Prisma.InputJsonValue,
        },
      });
    });

    try {
      const transfer = await initiateTransfer({
        amount: batchTotal,
        recipientCode: providerProfile.recipientCode,
        reference: batchRef,
        reason: `Manual release: ${job.title}`,
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

      return NextResponse.json({ success: true, status: transfer.status });
    } catch {
      await prisma.payoutRelease.update({
        where: { reference: batchRef },
        data: { status: "FAILED", failureReason: "Transfer initiation failed" },
      });

      await prisma.ledgerEntry.create({
        data: {
          jobId: job.id,
          event: "payout.manual_release_failed",
          amount: batchTotal,
          reference: batchRef,
          signature: signLedgerEntry(JSON.stringify({
            jobId: job.id, event: "payout.manual_release_failed", amount: batchTotal, reference: batchRef,
          })),
          metadata: { reason: "Transfer initiation failed" } as Prisma.InputJsonValue,
        },
      });

      return NextResponse.json({ error: "Transfer initiation failed. You can retry." }, { status: 500 });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    if (msg === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Client verification required" }, { status: 403 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
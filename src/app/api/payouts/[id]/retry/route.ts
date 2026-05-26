import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth-server";
import { initiateTransfer } from "@/lib/paystack";
import { generateRef } from "@/lib/security/tokens";
import { writeLedgerEntry } from "@/lib/services/ledger";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getUserFromToken(token);
    const { id } = await params;

    const failedPayout = await prisma.payoutRelease.findUnique({
      where: { id },
    });

    if (!failedPayout) {
      return NextResponse.json({ error: "Payout not found" }, { status: 404 });
    }

    const job = await prisma.job.findUnique({
      where: { id: failedPayout.jobId },
      select: { artisanId: true, title: true, ref: true },
    });

    if (!job || job.artisanId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (failedPayout.status !== "FAILED") {
      return NextResponse.json({ error: "Only failed payouts can be retried" }, { status: 400 });
    }

    const artisanProfile = await prisma.artisanProfile.findUnique({
      where: { userId: user.id },
    });

    if (!artisanProfile?.recipientCode) {
      return NextResponse.json(
        { error: "Bank details not configured. Update your profile first." },
        { status: 400 }
      );
    }

    const newRef = generateRef("PO");
    const payout = await prisma.payoutRelease.create({
      data: {
        jobId: failedPayout.jobId,
        amount: failedPayout.amount,
        status: "PENDING",
        recipientCode: artisanProfile.recipientCode,
        reference: newRef,
      },
    });

    try {
      const transfer = await initiateTransfer({
        amount: failedPayout.amount,
        recipientCode: artisanProfile.recipientCode,
        reference: newRef,
        reason: `Retry payout for ${job.title}`,
      });

      await prisma.payoutRelease.update({
        where: { id: payout.id },
        data: {
          status: transfer.status === "success" ? "COMPLETED" : "PROCESSING",
          transferCode: transfer.transferCode,
          completedAt: transfer.status === "success" ? new Date() : null,
        },
      });

      await writeLedgerEntry({
        jobId: failedPayout.jobId,
        event: transfer.status === "success" ? "payout.completed" : "payout.processing",
        amount: failedPayout.amount,
        reference: newRef,
        metadata: { retryOf: failedPayout.reference },
      });

      return NextResponse.json({ success: true, status: transfer.status });
    } catch {
      await prisma.payoutRelease.update({
        where: { id: payout.id },
        data: { status: "FAILED", failureReason: "Transfer initiation failed on retry" },
      });

      await writeLedgerEntry({
        jobId: failedPayout.jobId,
        event: "payout.failed",
        amount: failedPayout.amount,
        reference: newRef,
        metadata: { retryOf: failedPayout.reference, reason: "Transfer initiation failed on retry" },
      });

      return NextResponse.json({ error: "Retry failed. Please try again." }, { status: 500 });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

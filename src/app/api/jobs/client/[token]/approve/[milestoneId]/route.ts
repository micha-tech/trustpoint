import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyClientAccessToken, verifyApprovalToken, generateRef } from "@/lib/security/tokens";
import { transitionMilestone, MilestoneState } from "@/lib/state-machines";
import { writeLedgerEntry } from "@/lib/services/ledger";
import { releaseFromEscrow } from "@/lib/services/escrow";
import { initiateTransfer } from "@/lib/paystack";
import { sendNotification, WHATSAPP_TEMPLATES } from "@/lib/notifications";

// POST /api/jobs/client/[token]/approve/[milestoneId]
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string; milestoneId: string }> }
) {
  try {
    const { token, milestoneId } = await params;
    const { jobId } = verifyClientAccessToken(token);

    // Verify single-use approval token from request body
    const body = await req.json();
    const approvalToken = body?.approvalToken;
    if (!approvalToken) {
      return NextResponse.json({ error: "Approval token required" }, { status: 400 });
    }
    const verified = verifyApprovalToken(approvalToken);
    if (verified.milestoneId !== milestoneId || verified.jobId !== jobId) {
      return NextResponse.json({ error: "Invalid approval token" }, { status: 403 });
    }

    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        job: { include: { artisan: { include: { artisanProfile: true } } } },
      },
    });

    if (!milestone || milestone.jobId !== jobId) {
      return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
    }

    if (milestone.status !== "COMPLETED") {
      return NextResponse.json({ error: "Milestone is not ready for approval" }, { status: 400 });
    }

    const newStatus = transitionMilestone(milestone.status as MilestoneState, "APPROVED");

    // Update milestone status
    await prisma.milestone.update({
      where: { id: milestoneId },
      data: { status: newStatus },
    });

    // Release from escrow
    await releaseFromEscrow(jobId, milestone.amount, milestoneId);

    // Initiate payout to artisan if they have a transfer recipient set up
    const profile = milestone.job.artisan.artisanProfile;
    if (profile?.recipientCode) {
      const payoutRef = generateRef("PO");
      await prisma.payoutRelease.create({
        data: {
          jobId,
          milestoneId,
          amount: milestone.amount,
          recipientCode: profile.recipientCode,
          reference: payoutRef,
          status: "QUEUED",
        },
      });

      try {
        const transfer = await initiateTransfer({
          amount: milestone.amount,
          recipientCode: profile.recipientCode,
          reference: payoutRef,
          reason: `Milestone: ${milestone.title}`,
        });

        await prisma.payoutRelease.update({
          where: { reference: payoutRef },
          data: { transferCode: transfer.transferCode, status: transfer.status === "success" ? "PROCESSING" : "PENDING" },
        });
      } catch {
        await prisma.payoutRelease.update({
          where: { reference: payoutRef },
          data: { status: "FAILED", failureReason: "Transfer initiation failed" },
        });
      }
    }

    // Record ledger entry
    await writeLedgerEntry({
      jobId,
      event: "milestone.approved",
      amount: milestone.amount,
      reference: milestoneId,
      metadata: { milestoneTitle: milestone.title },
    });

    // Notify artisan
    await sendNotification({
      userId: milestone.job.artisanId,
      channel: "IN_APP",
      title: "Milestone Approved",
      body: `${milestone.title} has been approved by the client. Payment on the way.`,
      reference: milestoneId,
    });

    return NextResponse.json({ success: true, status: newStatus });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

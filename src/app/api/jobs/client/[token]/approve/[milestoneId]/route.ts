import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyClientAccessToken, verifyApprovalToken } from "@/lib/security/tokens";
import { transitionMilestone, MilestoneState } from "@/lib/state-machines";
import { writeLedgerEntry } from "@/lib/services/ledger";
import { sendNotification, WHATSAPP_TEMPLATES } from "@/lib/notifications";

// POST /api/jobs/client/[token]/approve/[milestoneId]
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string; milestoneId: string }> }
) {
  try {
    const { token, milestoneId } = await params;
    const { jobId } = verifyClientAccessToken(token);

    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        job: { include: { artisan: true } },
        approvals: true,
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
      body: `${milestone.title} has been approved by the client.`,
      reference: milestoneId,
    });

    return NextResponse.json({ success: true, status: newStatus });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

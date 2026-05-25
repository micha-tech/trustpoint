import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyClientAccessToken } from "@/lib/security/tokens";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const { jobId } = verifyClientAccessToken(token);

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { escrow: true },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const body = await req.json();
    const { reason } = body;

    if (!reason?.trim()) {
      return NextResponse.json({ error: "Please describe the issue" }, { status: 400 });
    }

    // Create dispute
    const dispute = await prisma.dispute.create({
      data: {
        jobId: job.id,
        raisedBy: job.clientId,
        reason: reason.trim(),
        status: "OPEN",
      },
    });

    // Update job status
    await prisma.job.update({
      where: { id: job.id },
      data: { status: "DISPUTED" },
    });

    // Record ledger entry
    await prisma.ledgerEntry.create({
      data: {
        jobId: job.id,
        event: "job.disputed",
        actorId: job.clientId,
        reference: `DISPUTE-${dispute.id.slice(0, 8)}`,
        metadata: { reason: reason.trim() },
        signature: "dispute-raised",
      },
    });

    return NextResponse.json({ success: true, disputeId: dispute.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

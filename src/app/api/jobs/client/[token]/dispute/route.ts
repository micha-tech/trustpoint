import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyClientAccessToken } from "@/lib/security/tokens";
import { writeLedgerEntry } from "@/lib/services/ledger";
import { validateOrigin } from "@/lib/middleware/origin";

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
      include: { escrow: true, disputes: { where: { status: "OPEN" } } },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.status === "DRAFT" || job.status === "CANCELLED" || job.status === "COMPLETED") {
      return NextResponse.json(
        { error: "Cannot dispute a job in its current state" },
        { status: 400 }
      );
    }

    if (job.disputes.length > 0) {
      return NextResponse.json(
        { error: "An active dispute already exists for this job" },
        { status: 409 }
      );
    }

    const body = await req.json();
    const { reason } = body;

    if (!reason?.trim()) {
      return NextResponse.json({ error: "Please describe the issue" }, { status: 400 });
    }

    let disputeId: string;
    await prisma.$transaction(async (tx) => {
      const dispute = await tx.dispute.create({
        data: {
          jobId: job.id,
          raisedBy: job.clientId,
          reason: reason.trim(),
          status: "OPEN",
        },
      });
      disputeId = dispute.id;
      await tx.job.update({
        where: { id: job.id },
        data: { status: "DISPUTED" },
      });
    });

    await writeLedgerEntry({
      jobId: job.id,
      event: "job.disputed",
      actorId: job.clientId,
      reference: `DISPUTE-${disputeId!.slice(0, 8)}`,
      metadata: { reason: reason.trim() },
    });

    return NextResponse.json({ success: true, disputeId: disputeId! });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

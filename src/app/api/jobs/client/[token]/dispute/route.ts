import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyClientAccessToken } from "@/lib/security/tokens";
import { writeLedgerEntry } from "@/lib/services/ledger";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const origin = req.headers.get("origin");
    const host = req.headers.get("host") ?? req.nextUrl.host;
    const allowedOrigins = [
      host ? `https://${host}` : null,
      host ? `http://${host}` : null,
      "http://localhost:3000",
    ].filter(Boolean) as string[];
    if (!origin || !allowedOrigins.some((a) => origin === a)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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
    await writeLedgerEntry({
      jobId: job.id,
      event: "job.disputed",
      actorId: job.clientId,
      reference: `DISPUTE-${dispute.id.slice(0, 8)}`,
      metadata: { reason: reason.trim() },
    });

    return NextResponse.json({ success: true, disputeId: dispute.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

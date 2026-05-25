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
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? `https://${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}` : null,
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
      "http://localhost:3000",
    ].filter(Boolean) as string[];
    if (!origin || !allowedOrigins.some((a) => origin.startsWith(a))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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

    // Release job amount to artisan (fee stays as platform revenue)
    const releaseAmount = Math.min(job.amount, job.escrow.pendingAmount);

    await prisma.escrowState.update({
      where: { jobId: job.id },
      data: {
        status: "RELEASED",
        releasedAmount: { increment: releaseAmount },
        pendingAmount: { decrement: releaseAmount },
      },
    });

    // Update job status
    await prisma.job.update({
      where: { id: job.id },
      data: { status: "COMPLETED", approvedAt: new Date() },
    });

    // Record ledger entry
    await writeLedgerEntry({
      jobId: job.id,
      event: "job.approved",
      actorId: job.clientId,
      amount: releaseAmount,
      reference: `APPROVE-${job.ref}`,
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

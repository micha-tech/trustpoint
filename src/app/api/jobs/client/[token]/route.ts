import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyClientAccessToken } from "@/lib/security/tokens";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const { jobId } = verifyClientAccessToken(token);

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        escrow: true,
        artisan: { select: { name: true, phone: true } },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const j = job as Record<string, unknown>;
    return NextResponse.json({
      id: job.id,
      title: job.title,
      description: job.description,
      amount: job.amount,
      fee: job.fee,
      ref: job.ref,
      status: job.status,
      expectedCompletionDate: j.expectedCompletionDate ?? null,
      completedAt: j.completedAt ?? null,
      approvedAt: j.approvedAt ?? null,
      artisan: job.artisan,
      escrow: job.escrow,
      createdAt: job.createdAt,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Invalid or expired link";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

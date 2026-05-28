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
      select: {
        id: true,
        title: true,
        description: true,
        amount: true,
        fee: true,
        ref: true,
        status: true,
        clientEmail: true,
        expectedCompletionDate: true,
        completedAt: true,
        approvedAt: true,
        createdAt: true,
        artisan: { select: { name: true, phone: true } },
        escrow: true,
        milestones: { orderBy: { sortOrder: "asc" } },
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
      clientEmailSet: !!job.clientEmail,
      expectedCompletionDate: j.expectedCompletionDate ?? null,
      completedAt: j.completedAt ?? null,
      approvedAt: j.approvedAt ?? null,
      artisan: job.artisan,
      escrow: job.escrow,
      milestones: job.milestones,
      createdAt: job.createdAt,
    });
  } catch {
    return NextResponse.json({ error: "Invalid or expired link" }, { status: 400 });
  }
}

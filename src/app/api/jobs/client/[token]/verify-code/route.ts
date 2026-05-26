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

    const { email, code } = await req.json();
    if (!email || typeof email !== "string" || !code || typeof code !== "string") {
      return NextResponse.json({ error: "Email and code are required" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const record = await prisma.emailVerificationCode.findFirst({
      where: {
        jobId,
        email: normalizedEmail,
        code,
        verifiedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!record) {
      return NextResponse.json({ error: "Invalid or expired code." }, { status: 401 });
    }

    await prisma.emailVerificationCode.update({
      where: { id: record.id },
      data: { verifiedAt: new Date() },
    });

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
      verified: true,
      job: {
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
      },
    });
  } catch {
    return NextResponse.json({ error: "Could not verify code. Try again." }, { status: 500 });
  }
}

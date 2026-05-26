import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyClientAccessToken } from "@/lib/security/tokens";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const { jobId } = verifyClientAccessToken(token);

    const { email, code } = await _req.json();
    if (!email || typeof email !== "string" || !code || typeof code !== "string") {
      return NextResponse.json({ error: "Email and code are required" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const allCodes = await prisma.emailVerificationCode.findMany({
      where: {
        jobId,
        email: normalizedEmail,
        verifiedAt: null,
      },
      orderBy: { createdAt: "desc" },
    });

    const totalAttempts = allCodes.reduce((sum, c) => sum + c.attempts, 0);
    if (totalAttempts >= 5) {
      return NextResponse.json(
        { error: "Too many attempts. Request a new code." },
        { status: 429 }
      );
    }

    const latestValid = allCodes.find((c) => c.expiresAt > new Date()) ?? null;

    if (!latestValid || latestValid.code !== code) {
      if (latestValid) {
        await prisma.emailVerificationCode.update({
          where: { id: latestValid.id },
          data: { attempts: { increment: 1 } },
        });
      }
      return NextResponse.json(
        { error: "Invalid or expired code." },
        { status: 401 }
      );
    }

    await prisma.emailVerificationCode.update({
      where: { id: latestValid.id },
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
        expectedCompletionDate: job.expectedCompletionDate,
        completedAt: job.completedAt,
        approvedAt: job.approvedAt,
        artisan: job.artisan,
        escrow: job.escrow,
        createdAt: job.createdAt,
      },
    });
  } catch {
    return NextResponse.json({ error: "Could not verify code. Try again." }, { status: 500 });
  }
}

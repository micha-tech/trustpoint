import { NextRequest, NextResponse } from "next/server";
import { randomInt } from "crypto";
import { prisma } from "@/lib/prisma";
import { hashVerificationCode, verifyClientAccessToken } from "@/lib/security/tokens";
import { sendEmail } from "@/lib/resend";

function generateCode(): string {
  return randomInt(100000, 1000000).toString();
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const { jobId } = verifyClientAccessToken(token);

    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { clientEmail: true },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (!job.clientEmail) {
      return NextResponse.json(
        { error: "No client email on file. Contact the provider." },
        { status: 400 }
      );
    }

    if (normalizedEmail !== job.clientEmail.toLowerCase()) {
      return NextResponse.json(
        { error: "This email doesn't match the one on file." },
        { status: 403 }
      );
    }

    const lastCode = await prisma.emailVerificationCode.findFirst({
      where: { jobId, email: normalizedEmail, verifiedAt: null },
      orderBy: { createdAt: "desc" },
    });

    if (lastCode) {
      const elapsed = Date.now() - lastCode.createdAt.getTime();
      if (elapsed < 60000) {
        return NextResponse.json(
          { error: "Code already sent. Check your email or wait a minute." },
          { status: 429 }
        );
      }
    }

    const code = generateCode();
    const codeHash = hashVerificationCode(jobId, normalizedEmail, code);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.emailVerificationCode.create({
      data: {
        jobId,
        email: normalizedEmail,
        code: codeHash,
        expiresAt,
      },
    });

    await sendEmail({
      to: normalizedEmail,
      subject: "Your TrustPoint verification code",
      html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#1877f2;margin:0 0 16px">TrustPoint</h2>
        <p style="color:#1a1a1a;font-size:14px;line-height:1.5">Use this code to view your protected payment link:</p>
        <div style="background:#f5f5f5;border-radius:12px;padding:24px;text-align:center;margin:16px 0;font-size:32px;font-weight:700;letter-spacing:8px;color:#1a1a1a">${code}</div>
        <p style="color:#666;font-size:13px">This code expires in 15 minutes. If you didn't request this, you can ignore this email.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />
        <p style="color:#999;font-size:12px">TrustPoint — Secure payments for providers</p>
      </div>`,
    });

    return NextResponse.json({ sent: true });
  } catch {
    return NextResponse.json({ error: "Could not send code. Try again." }, { status: 500 });
  }
}

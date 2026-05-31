import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth-server";
import { writeLedgerEntry } from "@/lib/services/ledger";
import { sendEmail } from "@/lib/resend";
import { escapeHtml } from "@/lib/security/html";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getUserFromToken(token);
    const { id } = await params;

    const job = await prisma.job.findFirst({
      where: { id, artisanId: user.id },
      include: { escrow: true, provider: { select: { name: true } }, milestones: true },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.status !== "ACTIVE" && job.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { error: "Job is not in a completable state" },
        { status: 400 }
      );
    }

    const escrow = job.escrow;
    if (!escrow || escrow.status !== "FUNDED") {
      return NextResponse.json(
        { error: "Payment has not been confirmed yet" },
        { status: 400 }
      );
    }

    // Milestone-aware: mark all pending milestones as COMPLETED
    if (job.milestones && job.milestones.length > 0) {
      await prisma.milestone.updateMany({
        where: { jobId: job.id, status: { in: ["PENDING", "IN_PROGRESS"] } },
        data: { status: "COMPLETED" },
      });
    }

    await prisma.job.update({
      where: { id: job.id },
      data: { status: "COMPLETED", completedAt: new Date() },
    });

    await writeLedgerEntry({
      jobId: job.id,
      event: "job.completed",
      actorId: user.id,
      reference: `COMPLETE-${job.ref}`,
    });

    if (job.clientEmail) {
      const clientUrl = job.clientToken
        ? `${req.nextUrl.origin}/client/job/${job.clientToken}`
        : null;
      const providerName = escapeHtml(job.provider?.name ?? "Your provider");
      const jobTitle = escapeHtml(job.title);

      sendEmail({
        to: job.clientEmail,
        subject: `${job.provider?.name ?? "Your provider"} marked work as complete`,
        html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#1877f2;margin:0 0 16px">TrustPoint</h2>
          <p style="color:#1a1a1a;font-size:14px;line-height:1.5">
            ${providerName} has marked <strong>${jobTitle}</strong> as complete.
          </p>
          <p style="color:#1a1a1a;font-size:14px;line-height:1.5">
            Review the work and release the payment when you're satisfied.
          </p>
          ${clientUrl ? `<a href="${clientUrl}" style="display:inline-block;background:#1877f2;color:#fff;border-radius:8px;padding:12px 24px;margin:16px 0;text-decoration:none;font-size:14px;font-weight:600">Review & Release Payment</a>` : ""}
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />
          <p style="color:#999;font-size:12px">TrustPoint — Secure payments for providers</p>
        </div>`,
      });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

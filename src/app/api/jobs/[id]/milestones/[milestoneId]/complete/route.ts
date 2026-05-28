import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth-server";
import { writeLedgerEntry } from "@/lib/services/ledger";
import { sendEmail } from "@/lib/resend";
import { escapeHtml } from "@/lib/security/html";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getUserFromToken(token);
    const { id, milestoneId } = await params;

    const job = await prisma.job.findFirst({
      where: { id, artisanId: user.id },
      include: {
        escrow: true,
        artisan: { select: { name: true } },
        milestones: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.status === "DISPUTED") {
      return NextResponse.json({ error: "Cannot modify a disputed job" }, { status: 400 });
    }

    const milestone = job.milestones.find((m) => m.id === milestoneId);
    if (!milestone) {
      return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
    }

    if (milestone.status !== "PENDING" && milestone.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { error: "Milestone has already been completed or approved" },
        { status: 400 }
      );
    }

    const escrow = job.escrow;
    if (!escrow || escrow.status === "UNFUNDED") {
      return NextResponse.json({ error: "Payment has not been confirmed yet" }, { status: 400 });
    }

    await prisma.milestone.update({
      where: { id: milestone.id },
      data: { status: "COMPLETED" },
    });

    await writeLedgerEntry({
      jobId: job.id,
      event: "milestone.completed",
      actorId: user.id,
      amount: milestone.amount,
      reference: `MC-${job.ref}-${milestone.id.slice(0, 8)}`,
      metadata: { milestoneTitle: milestone.title, milestoneId: milestone.id },
    });

    const allComplete = job.milestones
      .filter((m) => m.id !== milestone.id)
      .every((m) => ["COMPLETED", "APPROVED", "RELEASED"].includes(m.status));
    if (allComplete) {
      await prisma.job.update({
        where: { id: job.id },
        data: { status: "COMPLETED", completedAt: new Date() },
      });
    } else {
      await prisma.job.update({
        where: { id: job.id },
        data: { status: "IN_PROGRESS" },
      });
    }

    if (job.clientEmail) {
      const clientUrl = job.clientToken
        ? `${req.nextUrl.origin}/client/job/${job.clientToken}`
        : null;
      const artisanName = escapeHtml(job.artisan?.name ?? "Your artisan");
      const jobTitle = escapeHtml(job.title);
      const msTitle = escapeHtml(milestone.title);

      sendEmail({
        to: job.clientEmail,
        subject: `${artisanName} completed a milestone: ${msTitle}`,
        html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#1877f2;margin:0 0 16px">TrustPoint</h2>
          <p style="color:#1a1a1a;font-size:14px;line-height:1.5">
            ${artisanName} completed the milestone <strong>${msTitle}</strong> for <strong>${jobTitle}</strong>.
          </p>
          <p style="color:#1a1a1a;font-size:14px;line-height:1.5">
            Review the work and release the payment for this milestone when you're satisfied.
          </p>
          ${clientUrl ? `<a href="${clientUrl}" style="display:inline-block;background:#1877f2;color:#fff;border-radius:8px;padding:12px 24px;margin:16px 0;text-decoration:none;font-size:14px;font-weight:600">Review & Release</a>` : ""}
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />
          <p style="color:#999;font-size:12px">TrustPoint — Secure payments for artisans</p>
        </div>`,
      });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

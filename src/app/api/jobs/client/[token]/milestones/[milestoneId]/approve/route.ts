import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyClientAccessToken, verifyClientVerificationToken } from "@/lib/security/tokens";
import { signLedgerEntry } from "@/lib/security/webhooks";
import { validateOrigin } from "@/lib/middleware/origin";
import { maybeAutoRelease } from "@/lib/services/auto-release";
import type { Prisma } from "@prisma/client";

function requireClientVerification(req: NextRequest, jobId: string, clientEmail: string | null) {
  const token = req.headers.get("x-client-verification") ?? "";
  const verified = verifyClientVerificationToken(token);
  if (verified.jobId !== jobId) throw new Error("UNAUTHORIZED");
  if (clientEmail && verified.email !== clientEmail.toLowerCase()) throw new Error("UNAUTHORIZED");
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string; milestoneId: string }> }
) {
  try {
    const originErr = validateOrigin(req);
    if (originErr) return originErr;

    const { token, milestoneId } = await params;
    const { jobId } = verifyClientAccessToken(token);

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        escrow: true,
        provider: { include: { providerProfile: true } },
        milestones: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    requireClientVerification(req, job.id, job.clientEmail);

    if (job.status === "DISPUTED") {
      return NextResponse.json({ error: "Cannot approve in a disputed job" }, { status: 400 });
    }

    const milestone = job.milestones.find((m) => m.id === milestoneId);
    if (!milestone) {
      return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
    }

    if (milestone.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Milestone has not been completed yet by the provider" },
        { status: 400 }
      );
    }

    const escrow = job.escrow;
    if (escrow && escrow.pendingAmount < milestone.amount) {
      return NextResponse.json({ error: "Insufficient funds in escrow" }, { status: 400 });
    }

    const ledgerSignature = signLedgerEntry(JSON.stringify({
      jobId: job.id, event: "milestone.approved", actorId: job.clientId,
      amount: milestone.amount, reference: `APPROVE-MS-${milestone.id.slice(0, 8)}`,
    }));

    let allJustApproved = false;

    await prisma.$transaction(async (tx) => {
      const msClaim = await tx.milestone.updateMany({
        where: { id: milestone.id, status: "COMPLETED" },
        data: { status: "APPROVED" },
      });
      if (msClaim.count === 0) throw new Error("Milestone has already been approved");

      if (escrow) {
        const newPending = escrow.pendingAmount - milestone.amount;
        const newEscrowStatus = newPending <= 0 ? "RELEASED" : "PARTIALLY_RELEASED";

        const escrowClaim = await tx.escrowState.updateMany({
          where: { jobId: job.id, pendingAmount: { gte: milestone.amount } },
          data: {
            status: newEscrowStatus,
            releasedAmount: { increment: milestone.amount },
            pendingAmount: { decrement: milestone.amount },
          },
        });
        if (escrowClaim.count === 0) throw new Error("Escrow update failed");
      }

      await tx.ledgerEntry.create({
        data: {
          jobId: job.id,
          event: "milestone.approved",
          actorId: job.clientId,
          amount: milestone.amount,
          reference: `APPROVE-MS-${milestone.id.slice(0, 8)}`,
          signature: ledgerSignature,
          metadata: { milestoneId: milestone.id, milestoneTitle: milestone.title } as Prisma.InputJsonValue,
        },
      });

      const allMilestones = await tx.milestone.findMany({
        where: { jobId: job.id },
        select: { id: true, status: true },
      });

      const allTerminal = allMilestones.every((m) =>
        ["APPROVED", "RELEASED"].includes(m.status)
      );

      if (allTerminal) {
        await tx.job.update({
          where: { id: job.id },
          data: { allApprovedAt: new Date(), status: "COMPLETED" },
        });
        allJustApproved = true;
      }
    });

    if (allJustApproved) {
      await maybeAutoRelease(job.id);
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    if (msg === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Client verification required" }, { status: 403 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
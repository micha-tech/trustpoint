import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth-server";

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
      include: { escrow: true },
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

    await prisma.job.update({
      where: { id: job.id },
      data: { status: "COMPLETED", completedAt: new Date() },
    });

    await prisma.ledgerEntry.create({
      data: {
        jobId: job.id,
        event: "job.completed",
        actorId: user.id,
        reference: `COMPLETE-${job.ref}`,
        signature: "artisan-complete",
      },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

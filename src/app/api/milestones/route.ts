import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth-server";
import { transitionMilestone, MilestoneState } from "@/lib/state-machines";
import { writeLedgerEntry } from "@/lib/services/ledger";
import { sendNotification, WHATSAPP_TEMPLATES } from "@/lib/notifications";

// GET /api/milestones — list milestones for a job
export async function GET(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get("jobId");
  if (!jobId) return NextResponse.json({ error: "jobId required" }, { status: 400 });

  const milestones = await prisma.milestone.findMany({
    where: { jobId },
    orderBy: { sortOrder: "asc" },
    include: { approvals: true },
  });

  return NextResponse.json(milestones);
}

// PATCH /api/milestones — update milestone status (artisan marks complete)
export async function PATCH(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getUserFromToken(token);
    const body = await req.json();
    const { milestoneId, status } = body;

    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: { job: { include: { client: true } } },
    });
    if (!milestone) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Only the artisan can mark milestones
    if (milestone.job.artisanId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const newState = transitionMilestone(
      milestone.status as MilestoneState,
      status as MilestoneState
    );

    await prisma.milestone.update({
      where: { id: milestoneId },
      data: { status: newState },
    });

    await writeLedgerEntry({
      jobId: milestone.jobId,
      event: `milestone.${status.toLowerCase()}`,
      actorId: user.id,
      reference: `milestone-${milestoneId}`,
    });

    // Notify the client
    if (status === "COMPLETED") {
      const template = WHATSAPP_TEMPLATES.milestone_completed({
        jobTitle: milestone.job.title,
        milestoneTitle: milestone.title,
      });
      await sendNotification({
        userId: milestone.job.clientId,
        channel: "WHATSAPP",
        title: "Milestone Complete",
        body: template.body,
        reference: milestoneId,
      });
    }

    return NextResponse.json({ ok: true, status: newState });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

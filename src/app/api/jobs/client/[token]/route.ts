import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyClientAccessToken, generateApprovalToken } from "@/lib/security/tokens";

// GET /api/jobs/client/[token] — public job view for clients
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
        milestones: { orderBy: { sortOrder: "asc" } },
        escrow: true,
        artisan: { select: { name: true } },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Generate approval tokens for completed milestones
    const milestonesWithTokens = await Promise.all(
      job.milestones.map(async (ms) => {
        if (ms.status === "COMPLETED") {
          const approvalToken = generateApprovalToken(ms.id, jobId);
          return { ...ms, approvalToken };
        }
        return { ...ms, approvalToken: null };
      })
    );

    return NextResponse.json({
      ...job,
      milestones: milestonesWithTokens,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Invalid or expired link";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

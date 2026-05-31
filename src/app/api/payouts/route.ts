import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth-server";

// GET /api/payouts — list payouts for a job
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getUserFromToken(token);
    const jobId = req.nextUrl.searchParams.get("jobId");
    if (!jobId) return NextResponse.json({ error: "jobId required" }, { status: 400 });

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { clientId: true, providerId: true },
    });
    if (!job || (job.clientId !== user.id && job.providerId !== user.id)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const payouts = await prisma.payoutRelease.findMany({
      where: { jobId },
      select: { id: true, amount: true, status: true, failureReason: true, createdAt: true, completedAt: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(payouts);
  } catch (e) {
    if (process.env.NODE_ENV !== "production") console.error("GET /api/payouts error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

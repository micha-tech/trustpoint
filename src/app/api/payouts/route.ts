import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth-server";

// GET /api/payouts — list payouts for a job
export async function GET(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get("jobId");
  if (!jobId) return NextResponse.json({ error: "jobId required" }, { status: 400 });

  const payouts = await prisma.payoutRelease.findMany({
    where: { jobId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(payouts);
}

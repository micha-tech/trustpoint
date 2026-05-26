import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ADMIN_SECRET = () => process.env.DISPUTE_SECRET ?? "";

function verifyAdmin(req: NextRequest): boolean {
  const auth = req.headers.get("authorization")?.replace("Bearer ", "");
  return auth === ADMIN_SECRET();
}

export async function GET(req: NextRequest) {
  try {
    if (!verifyAdmin(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [totalJobs, totalFees, completedJobs, feeEntries] = await Promise.all([
      prisma.job.count(),
      prisma.job.aggregate({ _sum: { fee: true } }),
      prisma.job.count({ where: { approvedAt: { not: null } } }),
      prisma.ledgerEntry.findMany({
        where: { event: "job.approved" },
        select: { amount: true, createdAt: true, reference: true },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);

    return NextResponse.json({
      totalJobs,
      totalFeesKobo: totalFees._sum.fee ?? 0,
      totalFeesFormatted: `₦${((totalFees._sum.fee ?? 0) / 100).toLocaleString()}`,
      completedJobs,
      recentApprovals: feeEntries.map((e) => ({
        amount: e.amount,
        formatted: `₦${((e.amount ?? 0) / 100).toLocaleString()}`,
        date: e.createdAt,
        reference: e.reference,
      })),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

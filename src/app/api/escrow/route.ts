import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth-server";

// GET /api/escrow — get escrow state for a job
export async function GET(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get("jobId");
  if (!jobId) return NextResponse.json({ error: "jobId required" }, { status: 400 });

  const escrow = await prisma.escrowState.findUnique({
    where: { jobId },
  });

  const ledger = await prisma.ledgerEntry.findMany({
    where: { jobId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ escrow, ledger });
}

// POST /api/escrow/refund — initiate refund
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await getUserFromToken(token);
    const body = await req.json();
    const { jobId } = body;

    const { refundEscrow } = await import("@/lib/services/escrow");
    const escrow = await refundEscrow(jobId);

    return NextResponse.json(escrow);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

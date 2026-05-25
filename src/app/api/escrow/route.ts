import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth-server";

// GET /api/escrow — get escrow state for a job
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getUserFromToken(token);
    const jobId = req.nextUrl.searchParams.get("jobId");
    if (!jobId) return NextResponse.json({ error: "jobId required" }, { status: 400 });

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { clientId: true, artisanId: true },
    });
    if (!job || (job.clientId !== user.id && job.artisanId !== user.id)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const escrow = await prisma.escrowState.findUnique({
      where: { jobId },
    });

    const ledger = await prisma.ledgerEntry.findMany({
      where: { jobId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ escrow, ledger });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST /api/escrow/refund — initiate refund
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getUserFromToken(token);
    const body = await req.json();
    const { jobId } = body;

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { clientId: true, artisanId: true },
    });
    if (!job || (job.clientId !== user.id && job.artisanId !== user.id)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { refundEscrow } = await import("@/lib/services/escrow");
    const escrow = await refundEscrow(jobId);

    return NextResponse.json(escrow);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

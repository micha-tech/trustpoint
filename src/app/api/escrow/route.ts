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
      select: { clientId: true, providerId: true },
    });
    if (!job || (job.clientId !== user.id && job.providerId !== user.id)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const escrow = await prisma.escrowState.findUnique({
      where: { jobId },
    });

    const rawLedger = await prisma.ledgerEntry.findMany({
      where: { jobId },
      orderBy: { createdAt: "asc" },
    });

    const ledger = rawLedger.map(({ actorId, metadata, signature, ...rest }) => ({
      ...rest,
      metadata: metadata ?? {},
    }));

    return NextResponse.json({ escrow, ledger });
  } catch (e) {
    if (process.env.NODE_ENV !== "production") console.error("GET /api/escrow error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Refunds are intentionally restricted to admin dispute resolution.
export async function POST(_req: NextRequest) {
  return NextResponse.json(
    { error: "Escrow refunds must be handled through dispute resolution" },
    { status: 405 }
  );
}

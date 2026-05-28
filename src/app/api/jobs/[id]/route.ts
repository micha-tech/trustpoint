import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth-server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getUserFromToken(token);
    const { id } = await params;

    const job = await prisma.job.findFirst({
      where: { id, OR: [{ clientId: user.id }, { artisanId: user.id }] },
      include: {
        escrow: true,
        client: { select: { name: true, email: true, phone: true } },
        artisan: { select: { name: true, phone: true } },
        disputes: { orderBy: { createdAt: "desc" }, take: 1 },
        milestones: { orderBy: { sortOrder: "asc" } },
      },
    });

    if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const [paymentReferences, virtualAccount, payoutReleases] = await Promise.all([
      prisma.paymentReference.findMany({
        where: { jobId: id },
        select: { reference: true, status: true },
      }),
      prisma.virtualAccount.findUnique({
        where: { jobId: id },
        select: { bankName: true, accountNumber: true, accountName: true },
      }),
      prisma.payoutRelease.findMany({
        where: { jobId: id },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const clientUrl = job.clientToken
      ? `${req.nextUrl.origin}/client/job/${job.clientToken}`
      : null;

    const { clientToken: _clientToken, ...safeJob } = job;
    return NextResponse.json({ ...safeJob, paymentReferences, virtualAccount, clientUrl, payoutReleases });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

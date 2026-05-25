import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth-server";
import { generateClientAccessToken } from "@/lib/security/tokens";

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
        milestones: { orderBy: { sortOrder: "asc" } },
        escrow: true,
        client: { select: { name: true, email: true, phone: true } },
        artisan: { select: { name: true, phone: true } },
        disputes: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const [paymentReferences, virtualAccount] = await Promise.all([
      prisma.paymentReference.findMany({
        where: { jobId: id },
        select: { reference: true, status: true },
      }),
      prisma.virtualAccount.findUnique({
        where: { jobId: id },
        select: { bankName: true, accountNumber: true, accountName: true },
      }),
    ]);

    const clientToken = generateClientAccessToken(job.id);
    const clientUrl = `${req.nextUrl.origin}/client/job/${clientToken}`;

    return NextResponse.json({ ...job, paymentReferences, virtualAccount, clientUrl });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

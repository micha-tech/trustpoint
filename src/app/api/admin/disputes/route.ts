import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminSecret } from "@/lib/security/admin";

export async function GET(req: NextRequest) {
  try {
    if (!verifyAdminSecret(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const disputes = await prisma.dispute.findMany({
      include: {
        job: { select: { title: true, ref: true, amount: true, status: true } },
        raiser: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json(disputes);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

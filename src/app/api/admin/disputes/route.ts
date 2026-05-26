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

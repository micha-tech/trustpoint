import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/payments/[reference] — payment page data (public, no auth)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;

    const paymentRef = await prisma.paymentReference.findUnique({
      where: { reference },
    });

    if (!paymentRef) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const job = await prisma.job.findUnique({
      where: { id: paymentRef.jobId },
      select: { title: true, ref: true, amount: true, fee: true, description: true },
    });

    return NextResponse.json({
      job,
      reference,
      status: paymentRef.status,
      amount: paymentRef.amount,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

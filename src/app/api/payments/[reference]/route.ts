import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/payments/[reference] — public payment page data
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

    const virtualAccount = await prisma.virtualAccount.findUnique({
      where: { reference },
      select: { bankName: true, accountNumber: true, accountName: true },
    });

    return NextResponse.json({
      job,
      virtualAccount,
      paymentLink: `https://paystack.com/pay/${reference}`,
      reference,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

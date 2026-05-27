import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPayment } from "@/lib/paystack";
import { fundEscrow } from "@/lib/services/escrow";
import { writeLedgerEntry } from "@/lib/services/ledger";
import { transitionJob, JobState } from "@/lib/state-machines";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;

    const paymentRef = await prisma.paymentReference.findUnique({
      where: { reference },
    });

    if (!paymentRef) {
      return NextResponse.json({ error: "Payment reference not found" }, { status: 404 });
    }

    if (paymentRef.status !== "pending") {
      return NextResponse.json({ ok: true, alreadyVerified: true });
    }

    const data = await verifyPayment(reference);
    if (data.status !== "success") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
    }

    if (data.amount !== paymentRef.amount) {
      return NextResponse.json({ error: "Payment amount mismatch" }, { status: 400 });
    }

    const jobId = paymentRef.jobId;

    const updated = await prisma.paymentReference.updateMany({
      where: { reference, status: "pending" },
      data: {
        status: "success",
        channel: data.channel,
        paidAt: new Date(),
        metadata: { ...(paymentRef.metadata as any), paystackData: data },
      },
    });

    if (updated.count === 0) {
      return NextResponse.json({ ok: true, alreadyVerified: true });
    }

    await fundEscrow(jobId, data.amount);

    const job = await prisma.job.findUniqueOrThrow({ where: { id: jobId } });
    const newStatus = transitionJob(job.status as JobState, JobState.ACTIVE);
    await prisma.job.update({ where: { id: jobId }, data: { status: newStatus } });

    await writeLedgerEntry({
      jobId,
      event: "payment.received",
      amount: data.amount,
      balance: data.amount,
      reference,
      metadata: { channel: data.channel },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

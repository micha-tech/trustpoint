import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPaystackSignature } from "@/lib/security/webhooks";
import { fundEscrow } from "@/lib/services/escrow";
import { writeLedgerEntry } from "@/lib/services/ledger";
import { transitionJob, JobState } from "@/lib/state-machines";

// ──────────────────────────────────────────
// Paystack webhook handler
// Idempotent, signature-verified, event-sourced
// ──────────────────────────────────────────

export async function POST(req: NextRequest) {
  // 1. Read raw body for signature verification
  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature") ?? "";

  if (!verifyPaystackSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  const eventId = payload.id;
  const eventType = payload.event;

  // 2. Idempotency check — skip if already processed
  const existing = await prisma.webhookEvent.findUnique({
    where: { eventId },
  });
  if (existing && existing.status === "processed") {
    return NextResponse.json({ ok: true, deduplicated: true });
  }

  // 3. Record incoming webhook
  const webhook = await prisma.webhookEvent.upsert({
    where: { eventId },
    update: { status: "processing" },
    create: {
      source: "paystack",
      eventId,
      eventType,
      rawBody: payload,
      status: "processing",
    },
  });

  try {
    // 4. Route by event type
    switch (eventType) {
      case "charge.success": {
        await handleChargeSuccess(payload.data);
        break;
      }
      case "transfer.success": {
        await handleTransferSuccess(payload.data);
        break;
      }
      case "transfer.failed": {
        await handleTransferFailed(payload.data);
        break;
      }
      default: {
        console.log(`Unhandled webhook event: ${eventType}`);
      }
    }

    await prisma.webhookEvent.update({
      where: { id: webhook.id },
      data: { status: "processed", processedAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    await prisma.webhookEvent.update({
      where: { id: webhook.id },
      data: { status: "failed" },
    });
    console.error("Webhook processing failed:", error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}

// ──────────────────────────────────────────
// Handle successful payment
// ──────────────────────────────────────────

async function handleChargeSuccess(data: any) {
  const reference: string = data.reference;
  const amount: number = data.amount; // in kobo
  const channel: string = data.channel;

  // Find the payment reference
  const paymentRef = await prisma.paymentReference.findUnique({
    where: { reference },
  });
  if (!paymentRef) throw new Error(`Unknown payment reference: ${reference}`);

  const jobId = paymentRef.jobId;

  // Update payment reference
  await prisma.paymentReference.update({
    where: { id: paymentRef.id },
    data: {
      status: "success",
      channel,
      paidAt: new Date(),
      metadata: { ...(paymentRef.metadata as any), paystackData: data },
    },
  });

  // Fund escrow
  await fundEscrow(jobId, amount);

  // Transition job to ACTIVE
  const job = await prisma.job.findUniqueOrThrow({ where: { id: jobId } });
  const newStatus = transitionJob(job.status as JobState, JobState.ACTIVE);
  await prisma.job.update({ where: { id: jobId }, data: { status: newStatus } });

  // Record ledger entry
  await writeLedgerEntry({
    jobId,
    event: "payment.received",
    amount,
    balance: amount,
    reference,
    metadata: { channel },
  });
}

// ──────────────────────────────────────────
// Handle payout transfer success/failure
// ──────────────────────────────────────────

async function handleTransferSuccess(data: any) {
  const reference: string = data.reference;
  const payout = await prisma.payoutRelease.findUnique({ where: { reference } });
  if (!payout) throw new Error(`Unknown payout reference: ${reference}`);

  await prisma.payoutRelease.update({
    where: { id: payout.id },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      transferCode: data.transfer_code,
    },
  });

  await writeLedgerEntry({
    jobId: payout.jobId,
    event: "payout.completed",
    amount: -payout.amount,
    reference,
  });
}

async function handleTransferFailed(data: any) {
  const reference: string = data.reference;
  const payout = await prisma.payoutRelease.findUnique({ where: { reference } });
  if (!payout) throw new Error(`Unknown payout reference: ${reference}`);

  await prisma.payoutRelease.update({
    where: { id: payout.id },
    data: { status: "FAILED", failureReason: data.reason },
  });

  await writeLedgerEntry({
    jobId: payout.jobId,
    event: "payout.failed",
    amount: payout.amount,
    reference,
    metadata: { reason: data.reason },
  });
}

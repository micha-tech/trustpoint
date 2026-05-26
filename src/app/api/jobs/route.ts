import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth-server";
import { generateJobRef, generateRef, generateClientAccessToken } from "@/lib/security/tokens";
import { createVirtualAccount, createPaymentLink, recordPaymentReference } from "@/lib/paystack";

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getUserFromToken(token);
    const body = await req.json();

    const { title, description, amount, clientEmail, expectedCompletionDate } = body;

    if (!title || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!process.env.PAYSTACK_SECRET_KEY) {
      return NextResponse.json({ error: "Payment service unavailable. Try again later." }, { status: 500 });
    }

    const ref = generateJobRef();
    const fee = Math.round(amount * 0.05);
    const payRef = generateRef("PAY");

    const clientToken = generateClientAccessToken(""); // id placeholder, regenerated after create
    const clientUrl = `${req.nextUrl.origin}/client/job/${clientToken}`;

    const job = await prisma.job.create({
      data: {
        title,
        description,
        amount,
        fee,
        ref,
        clientId: user.id,
        artisanId: user.id,
        clientEmail: clientEmail?.trim().toLowerCase(),
        clientToken,
        expectedCompletionDate: expectedCompletionDate ? new Date(expectedCompletionDate) : null,
      },
    });

    // Regenerate token with real jobId, persist it
    const finalToken = generateClientAccessToken(job.id);
    await prisma.job.update({
      where: { id: job.id },
      data: { clientToken: finalToken },
    });
    const finalClientUrl = `${req.nextUrl.origin}/client/job/${finalToken}`;

    let virtualAccount = null;
    try {
      virtualAccount = await createVirtualAccount({
        jobId: job.id,
        reference: payRef,
        customerEmail: user.email ?? "",
        customerName: user.name ?? "Client",
      });
    } catch {
      // DVA may fail; payment link is the fallback
    }

    let paymentLink;
    try {
      paymentLink = await createPaymentLink({
        amount: amount + fee,
        email: user.email ?? "",
        reference: payRef,
        callbackUrl: finalClientUrl,
      });
    } catch {
      // Payment link failed — save job so artisan can retry
      await prisma.job.update({
        where: { id: job.id },
        data: { status: "DRAFT" },
      });
      return NextResponse.json({
        id: job.id,
        title: job.title,
        description: job.description,
        amount: job.amount,
        fee: job.fee,
        ref: job.ref,
        status: "DRAFT",
        clientUrl: finalClientUrl,
        clientToken: finalToken,
        virtualAccount,
        paymentError: "Payment link generation failed. You can try again from the job page.",
      }, { status: 201 });
    }

    await recordPaymentReference({
      jobId: job.id,
      reference: payRef,
      amount: amount + fee,
      metadata: { authorizationUrl: paymentLink.authorizationUrl },
    });

    await prisma.job.update({
      where: { id: job.id },
      data: { status: "PENDING_PAYMENT" },
    });

    return NextResponse.json({
      id: job.id,
      title: job.title,
      description: job.description,
      amount: job.amount,
      fee: job.fee,
      ref: job.ref,
      status: "PENDING_PAYMENT",
      paymentLink: paymentLink.authorizationUrl,
      clientUrl: finalClientUrl,
      clientToken: finalToken,
      reference: payRef,
      virtualAccount,
    }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    console.error("POST /api/jobs error:", msg, e instanceof Error ? e.stack : "");
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getUserFromToken(token);

    const jobs = await prisma.job.findMany({
      where: {
        OR: [{ clientId: user.id }, { artisanId: user.id }],
      },
      include: { escrow: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(jobs);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

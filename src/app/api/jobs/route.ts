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

    const { title, description, amount, expectedCompletionDate } = body;

    if (!title || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const ref = generateJobRef();
    const fee = Math.round(amount * 0.05);
    const payRef = generateRef("PAY");

    const job = await prisma.job.create({
      data: {
        title,
        description,
        amount,
        fee,
        ref,
        clientId: user.id,
        artisanId: user.id,
        expectedCompletionDate: expectedCompletionDate ? new Date(expectedCompletionDate) : null,
      },
    });

    // Generate client token BEFORE creating payment link (need real URL)
    const clientToken = generateClientAccessToken(job.id);
    const clientUrl = `${req.nextUrl.origin}/client/job/${clientToken}`;

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

    const paymentLink = await createPaymentLink({
      amount: amount + fee,
      email: user.email ?? "",
      reference: payRef,
      callbackUrl: clientUrl,
    });

    await recordPaymentReference({
      jobId: job.id,
      reference: payRef,
      amount: amount + fee,
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
      clientUrl,
      clientToken,
      reference: payRef,
      virtualAccount,
    }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
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

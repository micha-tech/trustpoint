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

    await prisma.providerProfile.upsert({
      where: { userId: user.id },
      create: { userId: user.id },
      update: {},
    });

    const body = await req.json();
    const { title, description, milestones, clientEmail, expectedCompletionDate } = body;

    if (!title) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let milestoneInputs: { title: string; amount: number }[];
    if (milestones && Array.isArray(milestones) && milestones.length > 0) {
      milestoneInputs = milestones.map((m: { title?: string; amount?: number }, i: number) => {
        if (!m.title || !m.amount || !Number.isInteger(m.amount) || m.amount <= 0) {
          throw new Error(`Milestone ${i + 1} is invalid — each milestone needs a title and a positive whole number amount in kobo`);
        }
        return { title: m.title, amount: m.amount };
      });
    } else {
      const amount = body.amount;
      if (!amount || !Number.isInteger(amount) || amount <= 0 || amount > 100_000_000) {
        return NextResponse.json({ error: "Amount must be a positive whole number in kobo" }, { status: 400 });
      }
      milestoneInputs = [{ title: "Full payment", amount }];
    }

    const totalAmount = milestoneInputs.reduce((sum, m) => sum + m.amount, 0);
    if (totalAmount <= 0 || totalAmount > 100_000_000) {
      return NextResponse.json({ error: "Total amount must be between 1 and 100,000,000 kobo" }, { status: 400 });
    }

    if (!process.env.PAYSTACK_SECRET_KEY) {
      return NextResponse.json({ error: "Payment service unavailable. Try again later." }, { status: 500 });
    }

    const ref = generateJobRef();
    const fee = Math.round(totalAmount * 0.05);
    const payRef = generateRef("PAY");

    const job = await prisma.job.create({
      data: {
        title,
        description: description ?? "",
        amount: totalAmount,
        fee,
        ref,
        providerId: user.id,
        clientId: user.id,
        clientEmail: clientEmail?.trim().toLowerCase(),
        expectedCompletionDate: expectedCompletionDate ? new Date(expectedCompletionDate) : null,
        milestones: {
          create: milestoneInputs.map((m, i) => ({
            title: m.title,
            amount: m.amount,
            sortOrder: i,
          })),
        },
      },
    });

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
        amount: totalAmount + fee,
        email: user.email ?? "",
        reference: payRef,
        callbackUrl: finalClientUrl,
      });
    } catch {
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
        virtualAccount,
        paymentError: "Payment link generation failed. You can try again from the job page.",
      }, { status: 201 });
    }

    await recordPaymentReference({
      jobId: job.id,
      reference: payRef,
      amount: totalAmount + fee,
      metadata: { authorizationUrl: paymentLink.authorizationUrl },
    });

    await prisma.job.update({
      where: { id: job.id },
      data: { status: "PENDING_PAYMENT" },
    });

    const created = await prisma.job.findUnique({
      where: { id: job.id },
      include: { milestones: { orderBy: { sortOrder: "asc" } } },
    });

    return NextResponse.json({
      ...created,
      paymentLink: paymentLink.authorizationUrl,
      clientUrl: finalClientUrl,
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

    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10)));
    const skip = (page - 1) * limit;

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where: { providerId: user.id },
        include: { escrow: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.job.count({ where: { providerId: user.id } }),
    ]);

    return NextResponse.json({ jobs, total, page, limit });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

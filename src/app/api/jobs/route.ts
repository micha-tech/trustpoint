import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth-server";
import { generateJobRef, generateRef, generateClientAccessToken } from "@/lib/security/tokens";
import { createVirtualAccount, createPaymentLink, recordPaymentReference } from "@/lib/paystack";

// POST /api/jobs — create a new job
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getUserFromToken(token);
    const body = await req.json();

    const { title, description, amount, milestones } = body;

    if (!title || !amount || !milestones?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const totalMilestoneAmount = milestones.reduce((s: number, m: any) => s + m.amount, 0);
    if (totalMilestoneAmount !== amount) {
      return NextResponse.json(
        { error: "Milestone amounts must sum to job total" },
        { status: 400 }
      );
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
        milestones: {
          create: milestones.map((m: any, i: number) => ({
            title: m.title,
            description: m.description,
            amount: m.amount,
            sortOrder: i,
          })),
        },
      },
      include: { milestones: { orderBy: { sortOrder: "asc" } } },
    });

    // Generate payment setup
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

    const callbackUrl = `${req.nextUrl.origin}/client/job/PLACEHOLDER`;
    const paymentLink = await createPaymentLink({
      amount: amount + fee,
      email: user.email ?? "",
      reference: payRef,
      callbackUrl,
    });

    await recordPaymentReference({
      jobId: job.id,
      reference: payRef,
      amount: amount + fee,
    });

    const clientToken = generateClientAccessToken(job.id);

    // Update job status to PENDING_PAYMENT
    await prisma.job.update({
      where: { id: job.id },
      data: { status: "PENDING_PAYMENT" },
    });

    const clientUrl = `${req.nextUrl.origin}/client/job/${clientToken}`;

    return NextResponse.json({
      ...job,
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

// GET /api/jobs — list jobs for authenticated user
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getUserFromToken(token);

    const jobs = await prisma.job.findMany({
      where: {
        OR: [{ clientId: user.id }, { artisanId: user.id }],
      },
      include: {
        milestones: { orderBy: { sortOrder: "asc" } },
        escrow: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(jobs);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

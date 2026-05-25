import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPaymentLink, recordPaymentReference } from "@/lib/paystack";
import { generateRef } from "@/lib/security/tokens";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;

    const job = await prisma.job.findUnique({
      where: { ref: reference },
      select: {
        id: true,
        amount: true,
        fee: true,
        clientToken: true,
        artisan: { select: { email: true } },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const payRef = await prisma.paymentReference.findFirst({
      where: { jobId: job.id },
      orderBy: { createdAt: "desc" },
    });

    const storedUrl =
      (payRef?.metadata as Record<string, unknown> | null)
        ?.authorizationUrl as string | undefined;

    if (storedUrl) {
      return NextResponse.redirect(storedUrl, 302);
    }

    const ref = generateRef("PAY");
    const callbackUrl = `${_req.nextUrl.origin}/client/job/${job.clientToken ?? ""}`;
    const link = await createPaymentLink({
      amount: job.amount + job.fee,
      email: job.artisan.email ?? "customer@trustpoint.app",
      reference: ref,
      callbackUrl,
    });

    await recordPaymentReference({
      jobId: job.id,
      reference: ref,
      amount: job.amount + job.fee,
      metadata: { authorizationUrl: link.authorizationUrl },
    });

    return NextResponse.redirect(link.authorizationUrl, 302);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

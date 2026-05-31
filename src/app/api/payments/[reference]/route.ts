import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPaymentLink, recordPaymentReference } from "@/lib/paystack";
import { generateRef } from "@/lib/security/tokens";
import { getUserFromToken } from "@/lib/auth-server";
import { verifyClientAccessToken } from "@/lib/security/tokens";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const authHeader = req.headers.get("authorization");
    const bearerToken = authHeader?.replace("Bearer ", "");
    const queryToken = req.nextUrl.searchParams.get("token");

    if (!bearerToken && !queryToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (bearerToken) {
      const user = await getUserFromToken(bearerToken);
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    if (queryToken) {
      try {
        verifyClientAccessToken(queryToken);
      } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const { reference } = await params;

    const job = await prisma.job.findUnique({
      where: { ref: reference },
      select: {
        id: true,
        amount: true,
        fee: true,
        clientToken: true,
        provider: { select: { email: true } },
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
    const callbackUrl = `${req.nextUrl.origin}/client/job/${job.clientToken ?? ""}`;
    const link = await createPaymentLink({
      amount: job.amount + job.fee,
      email: job.provider.email ?? "customer@trustpoint.app",
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

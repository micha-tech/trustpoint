import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth-server";
import { createTransferRecipient, resolveBankAccount } from "@/lib/paystack";

function getUser(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return null;
  return getUserFromToken(token);
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const profile = await prisma.artisanProfile.findUnique({ where: { userId: user.id } });
    if (!profile || !profile.bankCode) {
      return NextResponse.json({ bankDetails: null });
    }

    return NextResponse.json({
      bankDetails: {
        bankName: profile.bankName,
        bankCode: profile.bankCode,
        bankAccount: profile.bankAccount,
        accountName: profile.businessName,
      },
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { bankCode, bankName, accountNumber } = await req.json();
    if (!bankCode || !bankName || !accountNumber) {
      return NextResponse.json({ error: "All bank fields are required" }, { status: 400 });
    }

    let accountName: string;
    try {
      const resolved = await resolveBankAccount(accountNumber, bankCode);
      accountName = resolved.account_name;
    } catch {
      return NextResponse.json({ error: "Could not verify account. Check the details." }, { status: 400 });
    }

    let recipientCode: string;
    try {
      const recipient = await createTransferRecipient({
        name: accountName,
        bankCode,
        accountNumber,
      });
      recipientCode = recipient.recipientCode;
    } catch {
      return NextResponse.json({ error: "Could not create payment recipient." }, { status: 500 });
    }

    await prisma.artisanProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        businessName: accountName,
        bankName,
        bankCode,
        bankAccount: accountNumber,
        recipientCode,
      },
      update: {
        businessName: accountName,
        bankName,
        bankCode,
        bankAccount: accountNumber,
        recipientCode,
      },
    });

    return NextResponse.json({ success: true, accountName, bankName, bankAccount: accountNumber });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

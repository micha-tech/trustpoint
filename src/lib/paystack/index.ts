import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { writeLedgerEntry } from "@/lib/services/ledger";

const PAYSTACK_BASE = "https://api.paystack.co";

function paystackSecret(): string {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    throw new Error("PAYSTACK_SECRET_KEY environment variable is not set");
  }
  return secret;
}

async function paystackFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${PAYSTACK_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${paystackSecret()}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const json = await res.json();
  if (!json.status) throw new Error(`Paystack error: ${json.message}`);
  return json.data;
}

export async function createVirtualAccount(params: {
  jobId: string;
  reference: string;
  customerEmail: string;
  customerName: string;
}) {
  const data = await paystackFetch("/dedicated_account", {
    method: "POST",
    body: JSON.stringify({
      customer: { email: params.customerEmail, name: params.customerName },
      preferred_bank: "wema-bank",
      reference: params.reference,
    }),
  });

  await prisma.virtualAccount.create({
    data: {
      jobId: params.jobId,
      reference: params.reference,
      bankName: data.bank?.name ?? "Wema Bank",
      accountNumber: data.account_number,
      accountName: data.account_name,
    },
  });

  return {
    bankName: data.bank?.name ?? "Wema Bank",
    accountNumber: data.account_number,
    accountName: data.account_name,
  };
}

export async function createPaymentLink(params: {
  amount: number;
  email: string;
  reference: string;
  callbackUrl: string;
}) {
  const data = await paystackFetch("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      amount: params.amount,
      email: params.email,
      reference: params.reference,
      callback_url: params.callbackUrl,
      channels: ["bank_transfer", "card"],
    }),
  });

  return { authorizationUrl: data.authorization_url, reference: data.reference };
}

export async function verifyPayment(reference: string) {
  return paystackFetch(`/transaction/verify/${encodeURIComponent(reference)}`);
}

export async function createTransferRecipient(params: {
  name: string;
  bankCode: string;
  accountNumber: string;
}) {
  const data = await paystackFetch("/transferrecipient", {
    method: "POST",
    body: JSON.stringify({
      type: "nuban",
      name: params.name,
      bank_code: params.bankCode,
      account_number: params.accountNumber,
      currency: "NGN",
    }),
  });

  return { recipientCode: data.recipient_code };
}

export async function listBanks() {
  return paystackFetch("/bank?currency=NGN");
}

export async function resolveBankAccount(accountNumber: string, bankCode: string) {
  return paystackFetch(`/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`);
}

export async function initiateTransfer(params: {
  amount: number;
  recipientCode: string;
  reference: string;
  reason?: string;
}) {
  const data = await paystackFetch("/transfer", {
    method: "POST",
    body: JSON.stringify({
      source: "balance",
      amount: params.amount,
      recipient: params.recipientCode,
      reference: params.reference,
      reason: params.reason ?? "TrustPoint payout",
    }),
  });
  return { transferCode: data.transfer_code, status: data.status };
}

export async function refundPayment(params: {
  transactionReference: string;
  amount?: number;
  reason?: string;
}) {
  const data = await paystackFetch("/refund", {
    method: "POST",
    body: JSON.stringify({
      transaction: params.transactionReference,
      amount: params.amount,
      reason: params.reason ?? "TrustPoint dispute resolution",
    }),
  });
  return { refundId: data.id, status: data.status };
}

export async function recordPaymentReference(params: {
  jobId: string;
  reference: string;
  amount: number;
  metadata?: Record<string, unknown>;
}) {
  return prisma.paymentReference.create({
    data: {
      jobId: params.jobId,
      reference: params.reference,
      amount: params.amount,
      status: "pending",
      metadata: (params.metadata ?? {}) as Prisma.InputJsonValue,
    },
  });
}

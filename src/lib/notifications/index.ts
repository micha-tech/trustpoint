import { prisma } from "@/lib/prisma";

type Channel = "WHATSAPP" | "SMS" | "EMAIL" | "IN_APP";

interface SendParams {
  userId: string;
  channel: Channel;
  title: string;
  body: string;
  reference?: string;
}

const WHATSAPP_TEMPLATES = {
  payment_received: ({ artisanName }: { artisanName: string }) => ({
    body: `Payment received! ${artisanName} has been notified and will start work on your job.`,
  }),
  payout_failed: ({ artisanName }: { artisanName: string }) => ({
    body: `Payout to ${artisanName} failed. We'll retry automatically. Contact support if this persists.`,
  }),
  job_completed: () => ({
    body: `Job completed! Thank you for using TrustPoint.`,
  }),
  dispute_opened: ({ jobRef }: { jobRef: string }) => ({
    body: `A dispute has been opened for ${jobRef}. Our team will review within 24 hours.`,
  }),
};

export async function sendNotification(params: SendParams) {
  const notif = await prisma.notification.create({
    data: {
      userId: params.userId,
      channel: params.channel,
      title: params.title,
      body: params.body,
      reference: params.reference,
      status: "pending",
    },
  });

  console.log(`[${params.channel}] To ${params.userId}: ${params.body}`);

  await prisma.notification.update({
    where: { id: notif.id },
    data: { status: "sent", sentAt: new Date() },
  });

  return notif;
}

export { WHATSAPP_TEMPLATES };

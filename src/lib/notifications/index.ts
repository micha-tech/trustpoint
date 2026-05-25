import { prisma } from "@/lib/prisma";

// ──────────────────────────────────────────
// Multi-channel notification service
// MVP: logs to DB; plug in WhatsApp/SMS/email later
// ──────────────────────────────────────────

type Channel = "WHATSAPP" | "SMS" | "EMAIL" | "IN_APP";

interface SendParams {
  userId: string;
  channel: Channel;
  title: string;
  body: string;
  reference?: string;
}

// ──────────────────────────────────────────
// WhatsApp template messages for key flows
// ──────────────────────────────────────────

const WHATSAPP_TEMPLATES = {
  payment_received: ({ artisanName }: { artisanName: string }) => ({
    body: `✅ Payment received! ${artisanName} has been notified and will start work on your job.`,
  }),
  milestone_completed: ({ jobTitle, milestoneTitle }: { jobTitle: string; milestoneTitle: string }) => ({
    body: `🔄 ${milestoneTitle} for "${jobTitle}" is marked complete. Tap to review and approve release of funds.`,
  }),
  milestone_approved: ({ milestoneTitle, amount }: { milestoneTitle: string; amount: number }) => ({
    body: `💰 ${milestoneTitle} approved! ₦${(amount / 100).toLocaleString()} has been released to the artisan.`,
  }),
  payout_failed: ({ artisanName }: { artisanName: string }) => ({
    body: `⚠️ Payout to ${artisanName} failed. We'll retry automatically. Contact support if this persists.`,
  }),
  job_completed: () => ({
    body: `🎉 Job completed! Thank you for using TrustPoint. We'd love your feedback.`,
  }),
  dispute_opened: ({ jobRef }: { jobRef: string }) => ({
    body: `⚖️ A dispute has been opened for ${jobRef}. Our team will review within 24 hours.`,
  }),
};

export async function sendNotification(params: SendParams) {
  // Persist to DB
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

  // MVP: log to console
  // Production: integrate with WhatsApp Business API / Twilio / SendGrid
  console.log(`[${params.channel}] To ${params.userId}: ${params.body}`);

  await prisma.notification.update({
    where: { id: notif.id },
    data: { status: "sent", sentAt: new Date() },
  });

  return notif;
}

export { WHATSAPP_TEMPLATES };

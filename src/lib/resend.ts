const RESEND_API = "https://api.resend.com";

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    if (process.env.NODE_ENV !== "production") {
      console.error("RESEND_API_KEY not set");
    }
    return;
  }

  const res = await fetch(`${RESEND_API}/emails`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "TrustPoint <onboarding@resend.dev>",
      to,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    if (process.env.NODE_ENV !== "production") {
      console.error("Resend error:", res.status, body);
    }
  }
}

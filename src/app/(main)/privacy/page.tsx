import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" />
        Back
      </Link>
      <h1 className="text-2xl font-bold text-foreground">Privacy Policy</h1>
      <p className="mt-1 text-sm text-muted-foreground">Last updated: May 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">1. Information We Collect</h2>
          <p>
            We collect your email address, name, and bank account details (for payouts). We also store project information, milestones, and evidence files you upload.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">2. How We Use Your Information</h2>
          <p>
            Your information is used to facilitate transactions, communicate project updates, and comply with financial regulations. We do not sell your personal data to third parties.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">3. Data Security</h2>
          <p>
            We use encryption and secure servers to protect your data. Payment information is handled directly by Paystack and is never stored on our servers.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">4. Data Retention</h2>
          <p>
            We retain your data for as long as your account is active. You may request deletion of your account and associated data by contacting support.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">5. Contact</h2>
          <p>
            For privacy-related inquiries, contact support at privacy@trustpoint.com.ng.
          </p>
        </section>
      </div>
    </div>
  );
}
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" />
        Back
      </Link>
      <h1 className="text-2xl font-bold text-foreground">Terms of Service</h1>
      <p className="mt-1 text-sm text-muted-foreground">Last updated: May 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">1. Service</h2>
          <p>
            TrustPoint provides a protected payment platform that connects providers and clients. We facilitate secure transactions by holding funds until work is approved by the client.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">2. Accounts</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account credentials. You must be at least 18 years old to use this service.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">3. Payments</h2>
          <p>
            All payments are processed through Paystack. TrustPoint holds funds in a protected state until the client confirms approval of the completed work. A platform fee of 5% is deducted from each transaction.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">4. Dispute Resolution</h2>
          <p>
            If a disagreement arises, either party may submit the issue for review. TrustPoint will review all evidence and make a fair determination. The decision may result in releasing payment to the provider or refunding the client.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">5. Limitation of Liability</h2>
          <p>
            TrustPoint acts as a payment facilitator. We are not liable for the quality of work performed or any disputes arising from the agreement between provider and client.
          </p>
        </section>
      </div>
    </div>
  );
}
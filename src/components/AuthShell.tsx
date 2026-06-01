import Link from "next/link";
import type { ReactNode } from "react";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { TrustPointLogo } from "@/components/TrustPointLogo";

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
};

const proofPoints = [
  "Client-funded projects before delivery",
  "Milestone approvals with evidence",
  "Protected release flow for both sides",
];

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl min-w-0 items-center gap-8 lg:grid-cols-[minmax(0,1fr)_25rem]">
        <section className="hidden lg:block">
          <Link href="/" className="inline-flex transition-opacity hover:opacity-85">
            <TrustPointLogo className="w-[13rem]" priority sizes="13rem" />
          </Link>
          <div className="mt-12 max-w-xl">
            <div className="mb-6 flex size-12 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <ShieldCheck className="size-6" />
            </div>
            <h1 className="text-4xl font-bold leading-tight text-foreground">
              Keep every digital project protected from the first payment.
            </h1>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              TrustPoint gives providers and clients a clear agreement, funded milestones, and a calmer approval path.
            </p>
            <div className="mt-8 space-y-3">
              {proofPoints.map((point) => (
                <div key={point} className="flex items-center gap-3 text-sm font-medium text-foreground">
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="w-full min-w-0">
          <div className="mb-6 text-center lg:hidden">
            <Link href="/" className="inline-block transition-opacity hover:opacity-85">
              <TrustPointLogo className="mx-auto w-[11rem]" priority sizes="11rem" />
            </Link>
          </div>

          <div className="min-w-0 overflow-hidden rounded-lg border border-border/75 bg-white/95 p-5 shadow-xl shadow-brand-900/10 sm:p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold leading-tight text-foreground">{title}</h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{subtitle}</p>
            </div>
            {children}
          </div>

          <div className="mt-5 text-center text-xs text-muted-foreground">{footer}</div>
        </section>
      </div>
    </div>
  );
}

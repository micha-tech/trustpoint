import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CheckCircle, Lock, Shield, Users } from "lucide-react";

const steps = [
  {
    icon: Users,
    title: "Create a Project",
    desc: "Define the work and agree on a price with your client.",
  },
  {
    icon: Lock,
    title: "Client Funds Escrow",
    desc: "The full amount is paid upfront. Funds held securely by TrustPoint.",
  },
  {
    icon: CheckCircle,
    title: "Release on Approval",
    desc: "Complete the work. Client approves. Funds released instantly.",
  },
];

const features = [
  {
    icon: Shield,
    title: "Payment Protection",
    desc: "Clients pay into escrow. Funds only released when both parties agree the job is done.",
  },
  {
    icon: Shield,
    title: "Simple & Transparent",
    desc: "No hidden fees. Clear status on every payment. Built for Nigeria.",
  },
  {
    icon: Shield,
    title: "Fast Setup",
    desc: "Create a job, share a link, get paid. No app needed for clients.",
  },
];

export default function Home() {
  return (
    <>
      <section className="relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden px-4">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-48 -top-48 size-[36rem] rounded-full bg-brand-500/8 blur-3xl" />
          <div className="absolute -bottom-48 -right-48 size-[36rem] rounded-full bg-brand-500/8 blur-3xl" />
        </div>

        <div className="mx-auto max-w-2xl text-center">
          <Image src="/logo.png" alt="TrustPoint" width={128} height={64} className="mx-auto mb-6 h-16 w-auto drop-shadow-lg" priority />
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold tracking-wide text-brand-700">
            <span className="size-1.5 rounded-full bg-brand-500" />
            Payment Protection for Artisans
          </span>
          <h1 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
            Paying an artisan
            <br />
            as easy as sending a link.
          </h1>
          <p className="mb-6 text-sm leading-relaxed text-muted-foreground sm:text-lg">
            TrustPoint holds payments in escrow and releases them
            when the job is done. No chasing invoices. No paying for unfinished work.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:bg-brand-600 hover:shadow-xl active:scale-[0.98] sm:w-auto"
            >
              Get Started Free
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-8 py-3.5 text-sm font-semibold text-foreground shadow-sm transition-all hover:bg-accent hover:shadow-md active:scale-[0.98] sm:w-auto"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-background px-4 py-16 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <span className="mb-2 inline-block text-xs font-semibold tracking-wide text-brand-600 uppercase">
              How it works
            </span>
            <h2 className="text-2xl font-bold text-foreground sm:text-4xl">
              Three simple steps
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              From agreement to payment, every transaction is secure and transparent.
            </p>
          </div>

          <div className="mx-auto mb-16 grid max-w-4xl gap-6 sm:grid-cols-3 sm:gap-8">
            {steps.map((s) => (
              <div key={s.title} className="relative text-center">
                <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 sm:size-14">
                  <s.icon className="size-5 sm:size-6" />
                </div>
                <h3 className="mb-1.5 text-base font-semibold text-foreground">{s.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-3 sm:gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-border bg-muted/30 p-5 transition-all hover:border-brand-100 hover:bg-brand-50/30 sm:p-6"
              >
                <div className="mb-3 flex size-8 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                  <f.icon className="size-4" />
                </div>
                <h3 className="mb-1.5 font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-muted/50 px-4 py-16 sm:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <span className="mb-2 inline-block text-xs font-semibold tracking-wide text-brand-600 uppercase">
            For everyone
          </span>
          <h2 className="mb-3 text-2xl font-bold text-foreground sm:text-4xl">
            Built for Nigerian artisans and their clients
          </h2>
          <p className="mb-6 text-sm leading-relaxed text-muted-foreground sm:text-lg">
            Whether you are a plumber, tailor, graphic designer, or contractor —
            TrustPoint makes sure everyone gets what they paid for.
          </p>
          <Link
            href="/register"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:bg-brand-600 hover:shadow-xl active:scale-[0.98] sm:w-auto"
          >
            Start protecting your payments
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border bg-background px-4 py-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 text-center sm:flex-row">
          <Image src="/logo.png" alt="TrustPoint" width={48} height={24} className="h-6 w-auto opacity-60" />
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} TrustPoint. All rights reserved.
          </p>
        </div>
      </footer>
    </>
  );
}

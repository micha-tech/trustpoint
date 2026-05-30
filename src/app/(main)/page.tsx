import Link from "next/link";
import Image from "next/image";
import { ArrowRight, FileText, Lock, ShieldCheck, ThumbsUp } from "lucide-react";

const steps = [
  {
    icon: FileText,
    title: "Create a protected project",
    desc: "Set milestones, agree on price, and share a secure payment link with your client.",
  },
  {
    icon: Lock,
    title: "Client secures payment",
    desc: "The client pays into a protected transaction. Funds are held safely until work is approved.",
  },
  {
    icon: ThumbsUp,
    title: "Approve and settle",
    desc: "The client reviews the completed work and releases payment. Both sides are protected.",
  },
];

export default function Home() {
  return (
    <>
      <section className="relative px-4 pb-16 pt-6 sm:pb-20 sm:pt-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Image src="/logo.png" alt="TrustPoint" width={160} height={80} className="h-14 w-auto" priority />
          <Link
            href="/login"
            className="rounded-lg px-3.5 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            Sign in
          </Link>
        </div>

        <div className="mx-auto mt-12 flex max-w-3xl flex-col items-center text-center sm:mt-16">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-brand-800 shadow-sm">
            <span className="size-2 rounded-full bg-brand-500" />
            Protected payments for real-world work
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            A secure environment for artisans and clients to transact with confidence.
          </h1>

          <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
            Create a protected payment link. The client pays into a secured transaction. Work gets done, approved, and settled.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:brightness-110 active:scale-[0.99]"
            >
              Create protected project
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-border bg-white/85 px-6 text-sm font-semibold text-foreground shadow-sm transition-all hover:border-brand-200 hover:bg-brand-50"
            >
              Open my workspace
            </Link>
          </div>

          <div className="mt-10 inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-2 text-sm font-medium text-brand-800">
            <ShieldCheck className="size-4 shrink-0 text-brand-600" />
            Built to protect both sides — artisans get paid, clients only pay for approved work.
          </div>
        </div>
      </section>

      <section className="border-y border-border/70 bg-white/80 px-4 py-14 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">How it works</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Three simple steps to a protected transaction.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {steps.map((step, i) => (
              <div key={step.title} className="relative rounded-xl border border-border/80 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <step.icon className="size-5" />
                  </div>
                  <span className="text-xs font-bold tracking-wider text-brand-500">STEP 0{i + 1}</span>
                </div>
                <h3 className="text-base font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border/70 bg-white/70 px-4 py-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-center sm:flex-row">
          <Image src="/logo.png" alt="TrustPoint" width={80} height={40} className="h-9 w-auto opacity-75" />
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} TrustPoint. Protected payments for real-world work.
          </p>
        </div>
      </footer>
    </>
  );
}

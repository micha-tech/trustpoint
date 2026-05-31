import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  CheckCircle2,
  FileSignature,
  Handshake,
  LockKeyhole,
  ShieldCheck,
  WalletCards,
  Waypoints,
} from "lucide-react";

const assurances = [
  {
    icon: ShieldCheck,
    title: "Payment held before work starts",
    desc: "Clients fund the project first. TrustPoint keeps the money protected until delivery is approved.",
  },
  {
    icon: Waypoints,
    title: "Milestones keep scope visible",
    desc: "Break work into deliverables, amounts, and approval moments so every side knows what comes next.",
  },
  {
    icon: FileSignature,
    title: "Terms are captured upfront",
    desc: "Signed agreements make expectations clear before files, designs, builds, or revisions begin.",
  },
  {
    icon: Handshake,
    title: "Evidence helps resolve issues",
    desc: "Upload proof of delivery and keep a clear trail when a project needs review.",
  },
];

const workflowSteps = [
  {
    icon: FileSignature,
    title: "Define",
    desc: "Scope, price, timeline, and milestones are agreed before the link is shared.",
  },
  {
    icon: LockKeyhole,
    title: "Protect",
    desc: "The client funds the project through a secure TrustPoint payment flow.",
  },
  {
    icon: WalletCards,
    title: "Release",
    desc: "Funds are released as work is approved, with evidence attached to each step.",
  },
];

function ProductPreview() {
  return (
    <div className="relative">
      <div className="rounded-lg border border-brand-100 bg-white shadow-xl shadow-brand-900/10">
        <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <ShieldCheck className="size-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Protection Ready</p>
              <p className="text-xs text-muted-foreground">Project TP-4821</p>
            </div>
          </div>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            Secured
          </span>
        </div>

        <div className="p-4">
          <div className="mb-4 flex items-baseline justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Client funded</p>
              <p className="mt-1 text-2xl font-bold text-foreground">NGN 540,000</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-muted-foreground">Released</p>
              <p className="mt-1 text-sm font-semibold text-brand-700">40%</p>
            </div>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-brand-50">
            <div className="h-full w-2/5 rounded-full bg-brand-500" />
          </div>

          <div className="mt-5 divide-y divide-border/70 rounded-lg border border-border/70">
            {[
              ["Discovery and wireframes", "Released", "NGN 160,000"],
              ["Product build", "In review", "NGN 240,000"],
              ["Launch support", "Queued", "NGN 140,000"],
            ].map(([title, status, amount]) => (
              <div key={title} className="grid grid-cols-[1fr_auto] gap-3 px-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{status}</p>
                </div>
                <p className="text-right text-sm font-semibold text-foreground">{amount}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute -bottom-5 left-5 right-5 hidden rounded-lg border border-brand-100 bg-brand-900 px-4 py-3 text-white shadow-lg shadow-brand-900/20 sm:block">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-white/65">Next approval</p>
            <p className="text-sm font-semibold">Product build awaiting client review</p>
          </div>
          <CheckCircle2 className="size-5 shrink-0 text-brand-200" />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <section className="px-4 pb-16 pt-4 sm:px-6 sm:pb-20 lg:px-8">
        <header className="mx-auto flex max-w-7xl items-center justify-between gap-3 py-2">
          <Link href="/" className="flex min-w-0 items-center gap-2 transition-opacity hover:opacity-85">
            <Image src="/logo.png" alt="TrustPoint" width={148} height={74} className="h-12 w-auto sm:h-14" priority />
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-white hover:text-foreground"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm shadow-brand-700/15 transition-colors hover:bg-brand-600"
            >
              Get started
              <ArrowRight className="hidden size-4 sm:block" />
            </Link>
          </div>
        </header>

        <div className="mx-auto grid max-w-7xl items-center gap-10 pt-12 sm:pt-16 lg:grid-cols-[minmax(0,1fr)_29rem] lg:gap-14">
          <div>
            <h1 className="max-w-3xl text-4xl font-bold leading-tight text-foreground sm:text-5xl lg:text-6xl">
              Protected payments for digital work
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              TrustPoint helps freelancers and agencies replace awkward payment follow-ups with funded projects, clear milestones, signed terms, and client approval flows.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm shadow-brand-700/15 transition-colors hover:bg-brand-600"
              >
                Start protecting your projects
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-border bg-white/95 px-6 text-sm font-semibold text-foreground shadow-sm transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-800"
              >
                Open workspace
              </Link>
            </div>

            <div className="mt-9 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
              {["Funded before delivery", "Milestone approvals", "Evidence-backed reviews"].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <ProductPreview />
        </div>
      </section>

      <section className="border-y border-border/70 bg-white/90 px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
            <div>
              <h2 className="text-2xl font-bold leading-tight text-foreground sm:text-3xl">
                The trust layer between proposal and payout
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                Keep the relationship professional from the first payment request to the final release.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {assurances.map((item) => (
                <div key={item.title} className="rounded-lg border border-border/75 bg-white p-5 shadow-sm shadow-slate-950/[0.03]">
                  <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                    <item.icon className="size-5" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-9 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-2xl font-bold text-foreground sm:text-3xl">How TrustPoint moves money safely</h2>
              <p className="mt-2 text-sm text-muted-foreground">Three visible checkpoints for providers and clients.</p>
            </div>
            <Link href="/register" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-800">
              Create a protected project
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {workflowSteps.map((step, index) => (
              <div key={step.title} className="rounded-lg border border-border/75 bg-white/95 p-5 shadow-sm shadow-slate-950/[0.03]">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                    <step.icon className="size-5" />
                  </div>
                  <span className="text-sm font-bold text-brand-200">0{index + 1}</span>
                </div>
                <h3 className="text-base font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border/70 bg-white/80 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-center sm:flex-row">
          <div className="flex items-center gap-4">
            <Image src="/logo.png" alt="TrustPoint" width={84} height={42} className="h-8 w-auto opacity-75" />
            <Link href="/terms" className="text-xs text-muted-foreground hover:text-foreground">Terms</Link>
            <Link href="/privacy" className="text-xs text-muted-foreground hover:text-foreground">Privacy</Link>
          </div>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} TrustPoint. Trust assurance for digital services.
          </p>
        </div>
      </footer>
    </>
  );
}

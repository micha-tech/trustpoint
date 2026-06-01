import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileText,
  Grip,
  HelpCircle,
  LockKeyhole,
  MessageSquare,
  Scale,
  ShieldCheck,
  UserCheck,
  Waypoints,
} from "lucide-react";
import { TrustPointLogo } from "@/components/TrustPointLogo";

const trustSignals: Array<{ icon: LucideIcon; title: string; desc: string }> = [
  {
    icon: LockKeyhole,
    title: "Funds held securely",
    desc: "Client payment is collected before delivery starts.",
  },
  {
    icon: CheckCircle2,
    title: "Milestone approval",
    desc: "Money releases only when agreed work is approved.",
  },
  {
    icon: FileText,
    title: "Evidence record",
    desc: "Scope, files, approvals, and issues stay in one record.",
  },
  {
    icon: Scale,
    title: "Dispute review",
    desc: "If things go wrong, both sides have a clear trail.",
  },
];

const workflowSteps = [
  {
    title: "Create the protected project",
    desc: "Define the scope, client contact, total value, and expected completion date.",
  },
  {
    title: "Break payment into milestones",
    desc: "Each milestone has a clear amount, deliverable, and approval point.",
  },
  {
    title: "Client funds the work",
    desc: "TrustPoint holds the payment while work progresses against the agreed record.",
  },
  {
    title: "Deliver, approve, release",
    desc: "The provider submits evidence. The client approves. Payment is released.",
  },
];

const providerPoints = [
  "Know the client has funded the job before you begin.",
  "Get paid by milestone instead of chasing final invoices.",
  "Keep proof of delivery attached to the agreement.",
];

const clientPoints = [
  "Avoid paying everything upfront without delivery proof.",
  "Approve each milestone when the work is actually complete.",
  "Raise an issue before funds are released if something is wrong.",
];

const faqs = [
  {
    q: "Does the client need to create an account?",
    a: "No. The client gets a secure link, verifies their email, reviews milestones, approves delivery, and releases payment without signing up.",
  },
  {
    q: "How are payments handled?",
    a: "Payments are processed through Paystack. TrustPoint records the agreement and holds the release flow until the client approves the work.",
  },
  {
    q: "What happens if there is a dispute?",
    a: "Either side can raise an issue. TrustPoint reviews the project record, milestones, evidence, and submitted context before deciding what happens next.",
  },
  {
    q: "What kind of work fits TrustPoint?",
    a: "Digital service work with clear deliverables: websites, software builds, design, branding, writing, marketing, consulting, and milestone projects.",
  },
];

function LandingHeader() {
  return (
    <header className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
      <Link href="/" className="min-w-0 shrink-0 transition-opacity hover:opacity-85">
        <TrustPointLogo size="sm" priority sizes="2.25rem" />
      </Link>

      <nav aria-label="Primary navigation" className="hidden items-center gap-7 lg:flex">
        <Link href="#protection" className="text-sm font-semibold text-slate-600 transition-colors hover:text-slate-950">
          Protection
        </Link>
        <Link href="#how-it-works" className="text-sm font-semibold text-slate-600 transition-colors hover:text-slate-950">
          How it works
        </Link>
        <Link href="#assurance" className="text-sm font-semibold text-slate-600 transition-colors hover:text-slate-950">
          Assurance
        </Link>
        <Link href="#faq" className="text-sm font-semibold text-slate-600 transition-colors hover:text-slate-950">
          FAQ
        </Link>
      </nav>

      <div className="flex shrink-0 items-center gap-2">
        <Link
          href="/login"
          className="hidden rounded-md px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950 sm:inline-flex"
        >
          Sign in
        </Link>
        <Link
          href="/register"
          className="inline-flex h-10 items-center justify-center rounded-md bg-slate-950 px-3 text-xs font-bold text-white shadow-sm shadow-slate-950/15 transition-colors hover:bg-brand-700 sm:px-4 sm:text-sm"
        >
          <span className="sm:hidden">Start</span>
          <span className="hidden sm:inline">Get protected</span>
        </Link>
      </div>
    </header>
  );
}

function SectionHeading({
  title,
  desc,
  align = "left",
}: {
  title: string;
  desc?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <h2 className="text-3xl font-bold leading-tight text-slate-950 sm:text-4xl">{title}</h2>
      {desc ? <p className="mt-4 text-base leading-7 text-slate-600">{desc}</p> : null}
    </div>
  );
}

function TrustSignal({ icon: Icon, title, desc }: { icon: LucideIcon; title: string; desc: string }) {
  return (
    <div className="flex min-w-0 gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-700">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-slate-950">{title}</p>
        <p className="mt-1 text-sm leading-5 text-slate-600">{desc}</p>
      </div>
    </div>
  );
}

function CompactTrustSignal({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 shadow-sm shadow-slate-950/[0.03]">
      <Icon className="size-4 shrink-0 text-brand-700" />
      <span className="text-xs font-bold leading-5 text-slate-700">{title}</span>
    </div>
  );
}

function TransactionPreview() {
  const milestones = [
    { name: "Project kickoff", amount: "NGN 100,000", state: "Released", done: true },
    { name: "Frontend delivery", amount: "NGN 150,000", state: "In review", done: false },
    { name: "Backend integration", amount: "NGN 150,000", state: "Protected", done: false },
  ];

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-950/10 sm:p-5">
      <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="min-w-0">
          <div className="mb-3 flex size-10 items-center justify-center rounded-md bg-brand-50 text-brand-700">
            <ShieldCheck className="size-5" />
          </div>
          <p className="text-xs font-bold uppercase text-slate-500">Protected transaction</p>
          <h3 className="mt-1 text-lg font-bold text-slate-950">Website redesign project</h3>
          <p className="mt-1 text-sm text-slate-500">Client funded: NGN 400,000</p>
        </div>
        <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">Active</span>
      </div>

      <div className="mt-4 rounded-md border border-brand-100 bg-brand-50/70 p-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-bold text-brand-900">Held before release</span>
          <span className="text-sm font-bold text-brand-800">NGN 300,000</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
          <div className="h-full w-1/4 rounded-full bg-brand-600" />
        </div>
        <p className="mt-2 text-xs leading-5 text-brand-900/80">Funds stay protected until the client approves the next milestone.</p>
      </div>

      <div className="mt-4 space-y-2">
        {milestones.map((milestone) => (
          <div key={milestone.name} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className={`flex size-8 shrink-0 items-center justify-center rounded-md ${milestone.done ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                {milestone.done ? <CheckCircle2 className="size-4" /> : <Grip className="size-4" />}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-950">{milestone.name}</p>
                <p className="text-xs text-slate-500">{milestone.amount}</p>
              </div>
            </div>
            <span className={`shrink-0 rounded-md px-2 py-1 text-xs font-bold ${milestone.done ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
              {milestone.state}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
        <FileText className="mt-0.5 size-4 shrink-0 text-slate-500" />
        <p className="text-xs font-semibold leading-5 text-slate-600">
          Scope, approval history, and delivery evidence are preserved for review.
        </p>
      </div>
    </div>
  );
}

function CheckList({ items, tone = "light" }: { items: string[]; tone?: "light" | "dark" }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item} className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
          <p className={`text-sm leading-6 ${tone === "dark" ? "text-slate-200" : "text-slate-700"}`}>{item}</p>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-950">
      <LandingHeader />

      <section className="px-4 pb-12 pt-7 sm:px-6 sm:pb-16 sm:pt-12 lg:px-8">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[minmax(0,1fr)_30rem] lg:gap-16">
          <div className="min-w-0">
            <h1 className="max-w-4xl text-4xl font-bold leading-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Protected payments for digital service work.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              TrustPoint holds funds, tracks milestones, and releases payment only when work is approved.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-brand-700 px-5 text-sm font-bold text-white shadow-lg shadow-brand-700/20 transition-colors hover:bg-slate-950 sm:w-auto sm:px-6"
              >
                Start a protected transaction
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-5 text-sm font-bold text-slate-950 shadow-sm transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-800 sm:w-auto sm:px-6"
              >
                See how protection works
              </Link>
            </div>

            <div className="mt-7 grid max-w-2xl grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              {trustSignals.slice(0, 4).map((signal) => (
                <CompactTrustSignal key={signal.title} icon={signal.icon} title={signal.title} />
              ))}
            </div>
          </div>

          <TransactionPreview />
        </div>
      </section>

      <section id="protection" className="border-y border-slate-200 bg-slate-50 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <SectionHeading
            title="Trust is easier when the money, work, and proof stay connected."
            desc="TrustPoint turns informal service agreements into a protected payment flow both sides can understand before work begins."
          />
          <div className="grid gap-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/[0.03] sm:grid-cols-2">
            {trustSignals.map((signal) => (
              <TrustSignal key={signal.title} {...signal} />
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <SectionHeading
              title="A clear release path from agreement to payment."
              desc="Every project follows a simple sequence: agree, fund, deliver, approve, release."
            />
            <Link href="/register" className="hidden shrink-0 items-center gap-2 text-sm font-bold text-brand-700 hover:text-slate-950 md:inline-flex">
              Start now
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="mt-10 grid gap-3 lg:grid-cols-4">
            {workflowSteps.map((step, index) => (
              <div key={step.title} className="relative rounded-md border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/[0.03]">
                <div className="mb-6 flex items-center justify-between">
                  <span className="flex size-9 items-center justify-center rounded-md bg-brand-50 text-sm font-bold text-brand-700">
                    {index + 1}
                  </span>
                  {index < workflowSteps.length - 1 ? <ArrowRight className="hidden size-4 text-slate-300 lg:block" /> : null}
                </div>
                <h3 className="text-base font-bold text-slate-950">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-950 px-4 py-14 text-white sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2 lg:items-stretch">
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-6 sm:p-8">
            <div className="mb-6 flex size-11 items-center justify-center rounded-md bg-white/10 text-emerald-300">
              <ShieldCheck className="size-5" />
            </div>
            <h2 className="text-2xl font-bold leading-tight sm:text-3xl">For providers: start with payment assurance.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              Work can begin with a funded agreement, not a promise buried in a chat thread.
            </p>
            <div className="mt-7">
              <CheckList items={providerPoints} tone="dark" />
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-6 sm:p-8">
            <div className="mb-6 flex size-11 items-center justify-center rounded-md bg-white/10 text-brand-200">
              <UserCheck className="size-5" />
            </div>
            <h2 className="text-2xl font-bold leading-tight sm:text-3xl">For clients: pay with protection.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              Funds are committed, but release stays tied to clear delivery and approval.
            </p>
            <div className="mt-7">
              <CheckList items={clientPoints} tone="dark" />
            </div>
          </div>
        </div>
      </section>

      <section id="assurance" className="px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <SectionHeading
            title="When there is a disagreement, the record is already there."
            desc="TrustPoint keeps the agreement, milestones, delivery evidence, and approval history together so disputes can be reviewed with context."
          />

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xl shadow-slate-950/[0.06]">
            <div className="grid gap-3">
              <div className="flex gap-3 rounded-md border border-slate-200 bg-slate-50 p-4">
                <Waypoints className="mt-0.5 size-5 shrink-0 text-brand-700" />
                <div>
                  <h3 className="text-sm font-bold text-slate-950">Shared agreement trail</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">Project scope, amounts, and milestone status stay visible to both sides.</p>
                </div>
              </div>
              <div className="flex gap-3 rounded-md border border-slate-200 bg-slate-50 p-4">
                <MessageSquare className="mt-0.5 size-5 shrink-0 text-brand-700" />
                <div>
                  <h3 className="text-sm font-bold text-slate-950">Issue submission</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">A client or provider can raise a problem before protected funds are released.</p>
                </div>
              </div>
              <div className="flex gap-3 rounded-md border border-slate-200 bg-slate-50 p-4">
                <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-950">Review before release</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">The payment process can pause while TrustPoint reviews the available record.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="border-y border-slate-200 bg-slate-50 px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <SectionHeading
            title="Questions providers and clients ask first."
            desc="TrustPoint is built for projects where both sides need confidence before money moves."
            align="center"
          />

          <div className="mt-10 space-y-3">
            {faqs.map((faq) => (
              <details key={faq.q} className="group rounded-md border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/[0.03] open:border-brand-200 open:ring-1 open:ring-brand-200">
                <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-bold text-slate-950 [&::-webkit-details-marker]:hidden">
                  {faq.q}
                  <HelpCircle className="size-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-sm leading-6 text-slate-600">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-md bg-brand-50 text-brand-700">
            <LockKeyhole className="size-6" />
          </div>
          <h2 className="text-3xl font-bold leading-tight text-slate-950 sm:text-4xl">
            Set up protection before the next project starts.
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Create a protected transaction, share the client link, and keep payment tied to approved work.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-brand-700 px-6 text-sm font-bold text-white shadow-lg shadow-brand-700/20 transition-colors hover:bg-slate-950 sm:w-auto"
            >
              Start a protected transaction
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-slate-300 px-6 text-sm font-bold text-slate-950 transition-colors hover:bg-slate-50 sm:w-auto"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white px-4 py-7 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <Link href="#protection" className="text-sm font-semibold text-slate-500 hover:text-slate-950">
              Protection
            </Link>
            <Link href="#how-it-works" className="text-sm font-semibold text-slate-500 hover:text-slate-950">
              How it works
            </Link>
            <Link href="#assurance" className="text-sm font-semibold text-slate-500 hover:text-slate-950">
              Assurance
            </Link>
            <Link href="#faq" className="text-sm font-semibold text-slate-500 hover:text-slate-950">
              FAQ
            </Link>
            <Link href="/terms" className="text-sm font-semibold text-slate-500 hover:text-slate-950">
              Terms
            </Link>
            <Link href="/privacy" className="text-sm font-semibold text-slate-500 hover:text-slate-950">
              Privacy
            </Link>
          </div>
          <p className="text-sm text-slate-500">&copy; {new Date().getFullYear()} TrustPoint. Protected transactions for digital work.</p>
        </div>
      </footer>
    </div>
  );
}

import Link from "next/link";
import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  FileText,
  Handshake,
  LockKeyhole,
  Scale,
  ShieldCheck,
  UploadCloud,
  UserCheck,
  Waypoints,
} from "lucide-react";

const painPoints = [
  "Freelancers fear delayed or unpaid invoices.",
  "Clients fear poor delivery after payment.",
  "Both sides argue over unclear expectations.",
  "Evidence gets scattered across WhatsApp, email, and chats.",
  "Disputes become emotional instead of resolvable.",
];

const workflowSteps = [
  {
    title: "Create a transaction",
    desc: "Open a protected workspace for the client, freelancer, project value, and timeline.",
  },
  {
    title: "Define scope and milestones",
    desc: "Record what will be delivered, when it is due, and what acceptance means.",
  },
  {
    title: "Both parties agree",
    desc: "Give each side one shared record before work or payment pressure begins.",
  },
  {
    title: "Track delivery and evidence",
    desc: "Attach files, links, updates, approvals, and proof to the transaction timeline.",
  },
  {
    title: "Complete, release, or resolve",
    desc: "Close cleanly when work is accepted, or use the record to resolve a dispute.",
  },
];

const features: Array<{ icon: LucideIcon; title: string; desc: string }> = [
  {
    icon: FileText,
    title: "Structured agreement",
    desc: "Turn loose chats into a clear record of scope, dates, deliverables, and acceptance terms.",
  },
  {
    icon: Waypoints,
    title: "Milestone tracking",
    desc: "Split a project into visible checkpoints so delivery and payment expectations stay aligned.",
  },
  {
    icon: UploadCloud,
    title: "Evidence preservation",
    desc: "Keep proof of work, revision notes, approvals, and files tied to the transaction.",
  },
  {
    icon: UserCheck,
    title: "Participant verification",
    desc: "Make it clearer who is involved before a freelancer or client commits to the work.",
  },
  {
    icon: Clock3,
    title: "Transaction timeline",
    desc: "See what changed, who acted, and when key project moments happened.",
  },
  {
    icon: Scale,
    title: "Dispute-ready records",
    desc: "Replace scattered screenshots with a structured trail that can be reviewed calmly.",
  },
];

const transactionRows = [
  ["Scope recorded", "Lagos web app MVP", "Complete"],
  ["Milestone 1", "Wireframes + product flow", "Accepted"],
  ["Milestone 2", "Frontend build evidence", "In review"],
  ["Milestone 3", "Launch support", "Queued"],
];

const trustSignals: Array<{ icon: LucideIcon; label: string }> = [
  { icon: ClipboardCheck, label: "Scope locked" },
  { icon: UserCheck, label: "ID checked" },
  { icon: UploadCloud, label: "Evidence saved" },
  { icon: Scale, label: "Dispute-ready" },
];

function LandingHeader() {
  return (
    <header className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
      <Link href="/" className="flex min-w-0 items-center gap-2 transition-opacity hover:opacity-85">
        <Image src="/logo.png" alt="TrustPoint" width={144} height={72} className="h-11 w-auto sm:h-12" priority />
      </Link>

      <nav aria-label="Primary navigation" className="hidden items-center gap-6 md:flex">
        <Link href="#why-trustpoint" className="text-sm font-semibold text-slate-600 transition-colors hover:text-slate-950">
          About
        </Link>
        <Link href="#how-it-works" className="text-sm font-semibold text-slate-600 transition-colors hover:text-slate-950">
          How it works
        </Link>
        <Link href="#contact" className="text-sm font-semibold text-slate-600 transition-colors hover:text-slate-950">
          Contact
        </Link>
      </nav>

      <div className="flex shrink-0 items-center gap-2">
        <Link
          href="/login"
          className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-white hover:text-slate-950 sm:inline-flex"
        >
          Sign in
        </Link>
        <Link
          href="/register"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm shadow-slate-950/15 transition-colors hover:bg-brand-700"
        >
          Start a protected transaction
        </Link>
      </div>
    </header>
  );
}

function HeroTransactionPreview() {
  return (
    <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
      <div className="absolute -left-4 top-8 hidden h-24 w-24 rounded-lg border border-emerald-200 bg-emerald-50/90 shadow-sm shadow-emerald-950/5 lg:block" />
      <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl shadow-slate-900/12">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <ShieldCheck className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-950">Protected transaction</p>
              <p className="truncate text-xs font-medium text-slate-500">Lagos web app project</p>
            </div>
          </div>
          <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">Demo record</span>
        </div>

        <div className="grid gap-0 lg:grid-cols-[1fr_11rem]">
          <div className="p-4 sm:p-5">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["Project value", "₦500,000"],
                ["Parties", "Client + developer"],
                ["Status", "Evidence review"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-slate-200 bg-white p-3">
                  <p className="text-xs font-semibold text-slate-500">{label}</p>
                  <p className="mt-1 text-sm font-bold text-slate-950">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-lg border border-slate-200">
              {transactionRows.map(([title, detail, status], index) => (
                <div
                  key={title}
                  className="grid gap-2 border-b border-slate-200 px-3 py-3 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_7.5rem] sm:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[11px] font-bold text-slate-600">
                        {index + 1}
                      </span>
                      <p className="truncate text-sm font-bold text-slate-950">{title}</p>
                    </div>
                    <p className="mt-1 truncate pl-8 text-xs font-medium text-slate-500">{detail}</p>
                  </div>
                  <p className="pl-8 text-xs font-bold text-slate-700 sm:pl-0 sm:text-right">{status}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="border-t border-slate-200 bg-slate-950 p-4 text-white lg:border-l lg:border-t-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Trust signals</p>
            <div className="mt-4 space-y-3">
              {trustSignals.map((signal) => (
                <div key={signal.label} className="flex items-center gap-2 text-sm font-semibold">
                  <signal.icon className="size-4 shrink-0 text-emerald-300" />
                  <span>{signal.label}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function SectionHeading({
  label,
  title,
  desc,
}: {
  label?: string;
  title: string;
  desc?: string;
}) {
  return (
    <div className="max-w-3xl">
      {label ? <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-700">{label}</p> : null}
      <h2 className="mt-2 text-3xl font-bold leading-tight text-slate-950 sm:text-4xl">{title}</h2>
      {desc ? <p className="mt-4 text-base leading-7 text-slate-600">{desc}</p> : null}
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc }: { icon: LucideIcon; title: string; desc: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/[0.03]">
      <div className="flex size-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
        <Icon className="size-5" />
      </div>
      <h3 className="mt-5 text-base font-bold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{desc}</p>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-950">
      <LandingHeader />

      <section className="px-4 pb-14 pt-8 sm:px-6 sm:pb-16 sm:pt-14 lg:px-8">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[minmax(0,1fr)_31rem] lg:gap-16">
          <div className="min-w-0">
            <h1 className="max-w-4xl text-4xl font-bold leading-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Secure freelance projects before money changes hands.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              TrustPoint helps clients and freelancers record expectations, agree on milestones, preserve evidence, and reduce payment or delivery disputes.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-brand-700 px-5 text-sm font-bold text-white shadow-lg shadow-brand-700/20 transition-colors hover:bg-slate-950 sm:px-6"
              >
                Start a protected transaction
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 text-sm font-bold text-slate-950 shadow-sm transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-800 sm:px-6"
              >
                See how it works
              </Link>
            </div>

            <div className="mt-8 flex max-w-2xl items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
              <p className="text-sm font-semibold leading-6 text-slate-700">
                Built for developers, designers, creators, consultants, and clients handling paid digital work.
              </p>
            </div>
          </div>

          <HeroTransactionPreview />
        </div>
      </section>

      <section id="why-trustpoint" className="border-y border-slate-200 bg-slate-50 px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-9 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <SectionHeading
              title="Freelance work breaks when trust is unclear."
              desc="Digital projects often start inside chat threads. When expectations, proof, and approval steps are not recorded, a normal project can turn into a payment or delivery dispute."
            />

            <div className="grid gap-3">
              {painPoints.map((point) => (
                <div key={point} className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/[0.03]">
                  <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" />
                  <p className="text-sm font-semibold leading-6 text-slate-700">{point}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
          <SectionHeading
            label="A common transaction"
            title="A client hires a developer for ₦500,000."
            desc="The client wants assurance that work will be delivered. The developer wants assurance that payment will not disappear. TrustPoint creates a structured transaction where the scope, milestones, delivery evidence, and acceptance steps are recorded."
          />

          <div className="rounded-lg border border-slate-200 bg-slate-950 p-5 text-white shadow-xl shadow-slate-950/10 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-white/55">Example project</p>
                <h3 className="mt-2 text-2xl font-bold">Lagos SaaS dashboard build</h3>
              </div>
              <div className="rounded-lg bg-white/10 px-4 py-3 text-left sm:text-right">
                <p className="text-xs font-semibold text-white/55">Project value</p>
                <p className="mt-1 text-xl font-bold">₦500,000</p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                ["Client assurance", "Delivery is tracked before acceptance."],
                ["Developer assurance", "The agreed record is visible before work begins."],
                ["Shared accountability", "Scope, proof, and decisions stay in one place."],
              ].map(([title, desc]) => (
                <div key={title} className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
                  <p className="text-sm font-bold">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-white/65">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-y border-slate-200 bg-white px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <SectionHeading
              title="How it works"
              desc="A simple workflow for turning a risky freelance project into a protected transaction."
            />
            <Link href="/register" className="inline-flex items-center gap-2 text-sm font-bold text-brand-700 hover:text-slate-950">
              Start a protected transaction
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="mt-10 grid gap-3 lg:grid-cols-5">
            {workflowSteps.map((step, index) => (
              <div key={step.title} className="relative rounded-lg border border-slate-200 bg-slate-50 p-5">
                <div className="mb-5 flex items-center justify-between">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-white text-sm font-bold text-brand-700 shadow-sm shadow-slate-950/[0.04]">
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

      <section className="bg-slate-50 px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            title="What TrustPoint provides"
            desc="The MVP focuses on the records and checkpoints that make freelance transactions easier to trust and easier to resolve."
          />

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/[0.04] sm:p-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <div className="flex size-12 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <Handshake className="size-6" />
            </div>
            <h2 className="mt-6 text-3xl font-bold leading-tight text-slate-950 sm:text-4xl">
              More than escrow. More than project management.
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Escrow protects money. Project tools track tasks. TrustPoint combines agreements, milestones, evidence, identity, and accountability into one structured transaction environment.
            </p>
          </div>

          <div className="grid gap-3">
            {[
              ["Escrow", "Money protection without the full work record."],
              ["Project management", "Tasks and deadlines without transaction accountability."],
              ["TrustPoint", "Agreement, milestones, evidence, identity, and dispute-ready records together."],
            ].map(([title, desc], index) => (
              <div
                key={title}
                className={`rounded-lg border p-4 ${
                  index === 2
                    ? "border-brand-200 bg-brand-50 text-brand-950"
                    : "border-slate-200 bg-slate-50 text-slate-700"
                }`}
              >
                <div className="flex items-start gap-3">
                  {index === 2 ? (
                    <ShieldCheck className="mt-0.5 size-5 shrink-0 text-brand-700" />
                  ) : (
                    <CircleDollarSign className="mt-0.5 size-5 shrink-0 text-slate-400" />
                  )}
                  <div>
                    <p className="text-sm font-bold">{title}</p>
                    <p className="mt-1 text-sm leading-6 opacity-80">{desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="bg-slate-950 px-4 py-14 text-white sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div>
            <div className="flex size-12 items-center justify-center rounded-lg bg-white/10 text-emerald-300">
              <LockKeyhole className="size-6" />
            </div>
            <h2 className="mt-6 max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">
              Have a live project you want to protect?
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/68">
              Use TrustPoint for your next client or freelance transaction. Start with a simple protected workflow designed to reduce uncertainty before work begins.
            </p>
          </div>

          <Link
            href="/register"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-white px-6 text-sm font-bold text-slate-950 shadow-lg shadow-black/20 transition-colors hover:bg-brand-50"
          >
            Start a protected transaction
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white px-4 py-7 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <Image src="/logo.png" alt="TrustPoint" width={96} height={48} className="h-9 w-auto opacity-80" />
            <Link href="#why-trustpoint" className="text-sm font-semibold text-slate-500 hover:text-slate-950">
              About
            </Link>
            <Link href="#contact" className="text-sm font-semibold text-slate-500 hover:text-slate-950">
              Contact
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

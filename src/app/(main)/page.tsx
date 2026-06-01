import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  FileText,
  HelpCircle,
  LockKeyhole,
  MessageSquare,
  Scale,
  ShieldCheck,
  UserCheck,
  Wallet,
} from "lucide-react";
import { TrustPointLogo } from "@/components/TrustPointLogo";

const pains: Array<{ icon: LucideIcon; title: string; desc: string }> = [
  {
    icon: Wallet,
    title: "Freelancers fear non-payment",
    desc: "Invoices get delayed after work has already been delivered.",
  },
  {
    icon: AlertTriangle,
    title: "Clients fear poor delivery",
    desc: "Paying upfront can feel risky when output is uncertain.",
  },
  {
    icon: MessageSquare,
    title: "Expectations get scattered",
    desc: "Scope, approvals, and proof live across WhatsApp, email, and chats.",
  },
  {
    icon: Scale,
    title: "Disputes become emotional",
    desc: "Without a clear record, both sides argue from memory instead of evidence.",
  },
];

const flowSteps: Array<{ icon: LucideIcon; title: string; desc: string }> = [
  {
    icon: FileText,
    title: "Create transaction",
    desc: "Set the project, parties, amount, and timeline.",
  },
  {
    icon: ClipboardCheck,
    title: "Define milestones",
    desc: "Break the work into clear delivery checkpoints.",
  },
  {
    icon: UserCheck,
    title: "Both parties agree",
    desc: "Client and freelancer accept the protected workflow.",
  },
  {
    icon: ShieldCheck,
    title: "Track evidence",
    desc: "Files, notes, and approvals stay attached to the record.",
  },
  {
    icon: CircleDollarSign,
    title: "Complete or resolve",
    desc: "Release after approval or use the record to review an issue.",
  },
];

const features: Array<{ icon: LucideIcon; title: string; desc: string }> = [
  {
    icon: FileText,
    title: "Structured agreement",
    desc: "Scope, amounts, delivery expectations, and acceptance steps in one place.",
  },
  {
    icon: ClipboardCheck,
    title: "Milestone tracking",
    desc: "Clear stages show what is funded, delivered, reviewed, and approved.",
  },
  {
    icon: ShieldCheck,
    title: "Evidence preservation",
    desc: "Work samples, files, links, and notes stay tied to each milestone.",
  },
  {
    icon: UserCheck,
    title: "Participant verification",
    desc: "Each side operates through a recorded project identity and access flow.",
  },
  {
    icon: LockKeyhole,
    title: "Transaction timeline",
    desc: "Actions create a simple chronology for approvals and issues.",
  },
  {
    icon: Scale,
    title: "Dispute-ready records",
    desc: "If a project breaks down, the evidence is already organized.",
  },
];

const faqs = [
  {
    q: "Is TrustPoint a payment processor?",
    a: "No. TrustPoint is a trust orchestration layer. Payment can move through rails such as Paystack or Monnify while TrustPoint manages the agreement, milestones, evidence, approval, and dispute record.",
  },
  {
    q: "Who should use TrustPoint first?",
    a: "Freelancers, developers, designers, creators, consultants, and clients handling paid digital service work where trust is not fully established yet.",
  },
  {
    q: "Does the client need an account?",
    a: "The client can use a secure project link to review expectations, verify access, approve delivery, or raise an issue.",
  },
  {
    q: "What happens if delivery is disputed?",
    a: "The transaction record keeps scope, milestones, evidence, and actions together so the issue can be reviewed with context.",
  },
];

function LandingHeader() {
  return (
    <header className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-3.5 sm:gap-3 sm:px-6 sm:py-4 lg:px-8">
      <Link href="/" className="min-w-0 shrink-0 transition-opacity hover:opacity-85">
        <TrustPointLogo size="md" priority />
      </Link>

      <nav aria-label="Primary navigation" className="hidden items-center gap-7 lg:flex">
        <Link href="#pain" className="text-sm font-semibold text-slate-600 transition-colors hover:text-slate-950">
          Problems
        </Link>
        <Link href="#scenario" className="text-sm font-semibold text-slate-600 transition-colors hover:text-slate-950">
          Scenario
        </Link>
        <Link href="#how-it-works" className="text-sm font-semibold text-slate-600 transition-colors hover:text-slate-950">
          How it works
        </Link>
        <Link href="#features" className="text-sm font-semibold text-slate-600 transition-colors hover:text-slate-950">
          Features
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
          className="inline-flex h-9 items-center justify-center rounded-md bg-slate-950 px-3 text-xs font-bold text-white shadow-sm shadow-slate-950/15 transition-colors hover:bg-brand-700 sm:h-10 sm:px-4 sm:text-sm"
        >
          <span className="sm:hidden">Start</span>
          <span className="hidden sm:inline">Start a protected transaction</span>
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
      <h2 className="text-2xl font-bold leading-tight text-slate-950 sm:text-4xl">{title}</h2>
      {desc ? <p className="mt-4 text-base leading-7 text-slate-600">{desc}</p> : null}
    </div>
  );
}

function ProtectedTransactionVisual() {
  const status = [
    { label: "Agreement", active: true },
    { label: "Funded", active: true },
    { label: "Evidence", active: true },
    { label: "Approval", active: false },
    { label: "Release", active: false },
  ];

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-xl shadow-slate-950/[0.08] sm:p-5">
      <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <div className="flex size-9 items-center justify-center rounded-md bg-brand-50 text-brand-700">
            <ShieldCheck className="size-4" />
          </div>
          <p className="mt-3 text-xs font-bold uppercase text-slate-500">Protected transaction</p>
          <h3 className="mt-1 text-base font-bold text-slate-950 sm:text-lg">Website redesign project</h3>
        </div>
        <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">Active</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-bold text-slate-500">Client funded</p>
          <p className="mt-1 text-xl font-extrabold text-slate-950">₦500,000</p>
          <p className="mt-1 text-xs font-semibold text-emerald-700">Funds are protected</p>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-bold text-slate-500">Next milestone</p>
          <p className="mt-1 text-sm font-bold text-slate-950">Design and UI delivery</p>
          <p className="mt-1 text-xs font-semibold text-amber-700">In review</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-5 gap-1.5">
        {status.map((item) => (
          <div key={item.label} className="text-center">
            <div className={`mx-auto flex size-8 items-center justify-center rounded-full text-xs font-bold ${item.active ? "bg-brand-700 text-white" : "bg-slate-100 text-slate-500"}`}>
              {item.active ? <CheckCircle2 className="size-4" /> : item.label[0]}
            </div>
            <p className="mt-1 text-[10px] font-bold leading-3 text-slate-500">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs font-bold uppercase text-slate-500">Milestone evidence</p>
        <div className="mt-2 space-y-2">
          {["homepage-v2.png", "style-guide.pdf", "preview.mp4"].map((file) => (
            <div key={file} className="flex items-center gap-2 rounded-md bg-white px-2.5 py-2 text-xs font-semibold text-slate-700">
              <FileText className="size-3.5 text-brand-700" />
              {file}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PaymentRailStrip() {
  return (
    <div className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="grid gap-3 rounded-lg border border-brand-100 bg-brand-50/70 p-4 sm:grid-cols-[1fr_auto] sm:items-center sm:p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-brand-700" />
          <div>
            <p className="text-sm font-bold text-brand-950">TrustPoint is not the payment rail.</p>
            <p className="mt-1 text-sm leading-6 text-brand-900/80">
              Payments can run through trusted rails like Paystack and Monnify. TrustPoint protects the agreement, evidence, approval, and dispute record around the money.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:w-56">
          <div className="rounded-md border border-brand-100 bg-white px-3 py-2 text-center text-sm font-bold text-slate-700">Paystack</div>
          <div className="rounded-md border border-brand-100 bg-white px-3 py-2 text-center text-sm font-bold text-slate-700">Monnify</div>
        </div>
      </div>
    </div>
  );
}

function PainCard({ icon: Icon, title, desc }: { icon: LucideIcon; title: string; desc: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/[0.03]">
      <div className="flex size-10 items-center justify-center rounded-md bg-brand-50 text-brand-700">
        <Icon className="size-5" />
      </div>
      <h3 className="mt-4 text-base font-bold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{desc}</p>
    </div>
  );
}

function ScenarioDiagram() {
  return (
    <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-700">A concrete scenario</p>
        <h2 className="mt-2 text-2xl font-bold leading-tight text-slate-950 sm:text-4xl">A ₦500,000 website project should not run on blind trust.</h2>
        <p className="mt-4 text-base leading-7 text-slate-600">
          The client wants delivery assurance. The developer wants payment assurance. TrustPoint creates a structured transaction where expectations, milestones, evidence, and acceptance steps are recorded.
        </p>
        <Link href="#how-it-works" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-brand-700 hover:text-slate-950">
          See the protected flow
          <ArrowRight className="size-4" />
        </Link>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xl shadow-slate-950/[0.06] sm:p-5">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <UserCheck className="size-5 text-slate-700" />
            <p className="mt-2 text-sm font-bold text-slate-950">Client</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">Needs work delivered before release.</p>
          </div>
          <div className="flex size-11 items-center justify-center rounded-full bg-brand-700 text-white">
            <ShieldCheck className="size-5" />
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <Building2 className="size-5 text-slate-700" />
            <p className="mt-2 text-sm font-bold text-slate-950">Developer</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">Needs confidence payment will not vanish.</p>
          </div>
        </div>

        <div className="mt-4 rounded-md border border-brand-100 bg-brand-50 p-4 text-center">
          <p className="text-xs font-bold uppercase text-brand-700">TrustPoint record</p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {["Scope", "Milestones", "Evidence", "Approval"].map((item) => (
              <div key={item} className="rounded-md bg-white px-2 py-2 text-xs font-bold text-brand-900 shadow-sm">{item}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc }: { icon: LucideIcon; title: string; desc: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/[0.03]">
      <div className="flex size-10 items-center justify-center rounded-md bg-brand-50 text-brand-700">
        <Icon className="size-5" />
      </div>
      <h3 className="mt-4 text-base font-bold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{desc}</p>
    </div>
  );
}

function DifferenceTable() {
  const rows = [
    ["Protects money", true, true, false],
    ["Records agreement", false, true, true],
    ["Preserves evidence", false, true, true],
    ["Dispute-ready timeline", false, true, false],
  ];

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm shadow-slate-950/[0.03]">
      <div className="grid grid-cols-4 border-b border-slate-200 bg-slate-50 text-center text-xs font-bold text-slate-500">
        <div className="p-3 text-left">Capability</div>
        <div className="p-3">Escrow</div>
        <div className="bg-brand-50 p-3 text-brand-800">TrustPoint</div>
        <div className="p-3">Project tools</div>
      </div>
      {rows.map(([label, escrow, trustpoint, project]) => (
        <div key={String(label)} className="grid grid-cols-4 border-b border-slate-100 text-center text-sm last:border-b-0">
          <div className="p-3 text-left font-semibold text-slate-700">{label}</div>
          {[escrow, trustpoint, project].map((value, index) => (
            <div key={index} className={`p-3 ${index === 1 ? "bg-brand-50/50" : ""}`}>
              {value ? <CheckCircle2 className="mx-auto size-4 text-emerald-600" /> : <span className="text-slate-300">No</span>}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-950">
      <LandingHeader />

      <section className="px-4 pb-10 pt-5 sm:px-6 sm:pb-16 sm:pt-12 lg:px-8">
        <div className="mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-[minmax(0,1fr)_31rem] lg:gap-16">
          <div className="min-w-0">
            <h1 className="max-w-4xl text-[2.35rem] font-bold leading-[1.03] text-slate-950 min-[380px]:text-4xl sm:text-5xl lg:text-6xl">
              Secure freelance projects before money changes hands.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:mt-5 sm:text-lg sm:leading-8">
              TrustPoint helps clients and freelancers record expectations, agree on milestones, preserve evidence, and reduce payment or delivery disputes.
            </p>

            <div className="mt-6 flex flex-col gap-2.5 sm:mt-7 sm:flex-row sm:gap-3">
              <Link
                href="/register"
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-brand-700 px-4 text-sm font-bold text-white shadow-lg shadow-brand-700/20 transition-colors hover:bg-slate-950 sm:min-h-12 sm:w-auto sm:px-6"
              >
                Start a protected transaction
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-bold text-slate-950 shadow-sm transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-800 sm:min-h-12 sm:w-auto sm:px-6"
              >
                See how it works
              </Link>
            </div>

            <div className="mt-6 flex items-start gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand-700" />
              <p className="text-sm font-semibold leading-6 text-slate-700">
                Built for developers, designers, creators, consultants, and clients handling paid digital work.
              </p>
            </div>
          </div>

          <ProtectedTransactionVisual />
        </div>

        <PaymentRailStrip />
      </section>

      <section id="pain" className="border-y border-slate-200 bg-slate-50 px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            title="Freelance work breaks when trust is unclear."
            desc="The risk is not only payment. It is unclear expectations, missing proof, and no reliable record when something goes wrong."
            align="center"
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {pains.map((pain) => (
              <PainCard key={pain.title} {...pain} />
            ))}
          </div>
        </div>
      </section>

      <section id="scenario" className="px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <ScenarioDiagram />
        </div>
      </section>

      <section id="how-it-works" className="border-y border-slate-200 bg-slate-50 px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            title="A simple 5-step protected flow."
            desc="From expectations to release, each step leaves a clear record."
            align="center"
          />

          <div className="mt-10 grid gap-3 lg:grid-cols-5">
            {flowSteps.map((step, index) => (
              <div key={step.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/[0.03]">
                <div className="flex items-center justify-between">
                  <span className="flex size-8 items-center justify-center rounded-md bg-brand-700 text-sm font-bold text-white">{index + 1}</span>
                  <step.icon className="size-5 text-brand-700" />
                </div>
                <h3 className="mt-5 text-base font-bold text-slate-950">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            title="Everything you need to work with confidence."
            desc="TrustPoint focuses on the transaction record: what was agreed, what was delivered, who approved, and what evidence exists."
            align="center"
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <SectionHeading
              title="More than escrow. More than project management."
              desc="Escrow protects money. Project tools track tasks. TrustPoint combines agreements, milestones, evidence, identity, and accountability into one structured transaction environment."
            />
            <div className="mt-6 space-y-3">
              {["We do not just hold money.", "We protect the agreement, evidence, and release decision.", "We reduce disputes before they become expensive."].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                  <p className="text-sm font-semibold leading-6 text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </div>
          <DifferenceTable />
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-lg bg-brand-700 p-6 text-center text-white shadow-xl shadow-brand-700/20 sm:p-9">
          <h2 className="text-2xl font-bold leading-tight sm:text-4xl">Have a live project you want to protect?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-brand-50 sm:text-base">
            Use TrustPoint for your next client or freelance transaction. Start with a simple protected workflow designed to reduce uncertainty before work begins.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-white px-6 text-sm font-bold text-brand-800 transition-colors hover:bg-brand-50"
            >
              Start a protected transaction
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex min-h-12 items-center justify-center rounded-md border border-white/30 px-6 text-sm font-bold text-white transition-colors hover:bg-white/10"
            >
              See how it works
            </Link>
          </div>
        </div>
      </section>

      <section id="faq" className="border-y border-slate-200 bg-slate-50 px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <SectionHeading
            title="Questions before the first protected transaction."
            desc="A clearer record makes it easier for both sides to proceed with confidence."
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

      <footer className="border-t border-slate-200 bg-white px-4 py-7 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <TrustPointLogo size="xs" />
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <Link href="/terms" className="text-sm font-semibold text-slate-500 hover:text-slate-950">
              About
            </Link>
            <Link href="/profile" className="text-sm font-semibold text-slate-500 hover:text-slate-950">
              Contact
            </Link>
            <Link href="/terms" className="text-sm font-semibold text-slate-500 hover:text-slate-950">
              Terms
            </Link>
            <Link href="/privacy" className="text-sm font-semibold text-slate-500 hover:text-slate-950">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

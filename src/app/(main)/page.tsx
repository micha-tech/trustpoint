import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileText,
  Grip,
  Handshake,
  HelpCircle,
  LockKeyhole,
  MessageSquare,
  Scale,
  ShieldCheck,
  UserCheck,
  Waypoints,
} from "lucide-react";
import { TrustPointLogo } from "@/components/TrustPointLogo";

const painPoints = [
  "You deliver the work. The client doesn't pay.",
  "You pay upfront. The work never arrives.",
  "Scope creeps. Milestones blur. Chats get lost.",
  "Disputes turn into he-said-she-said with no record.",
];

const examples = [
  {
    role: "A developer",
    project: "building a website for ₦300,000",
    pain: "wants payment assurance before writing code",
    outcome: "Client approves milestones. Payment releases on delivery.",
  },
  {
    role: "A designer",
    project: "creating branding for ₦150,000",
    pain: "needs scope locked before revisions spiral",
    outcome: "Deliverables tracked. Revisions documented. No surprises.",
  },
  {
    role: "A consultant",
    project: "delivering a strategy engagement",
    pain: "wants clear acceptance criteria before presenting",
    outcome: "Evidence attached. Client confirms. Payment released.",
  },
];

const workflowSteps = [
  {
    title: "Set up the project",
    desc: "Name the scope, add the client's email, define the total value.",
  },
  {
    title: "Add milestones",
    desc: "Break the work into phases with amounts, due dates, and descriptions.",
  },
  {
    title: "Share the client link",
    desc: "The client gets a secure link. No account needed on their end.",
  },
  {
    title: "Deliver and prove it",
    desc: "Upload evidence for each milestone. The client reviews and approves.",
  },
  {
    title: "Get paid",
    desc: "Payment releases on approval or auto-releases after 48 hours.",
  },
];

const features: Array<{ icon: LucideIcon; title: string; desc: string }> = [
  {
    icon: FileText,
    title: "Get paid",
    desc: "Milestone-based release means you get paid when work is approved — not before, not months later.",
  },
  {
    icon: ShieldCheck,
    title: "Avoid scams",
    desc: "Clients don't pay upfront for unproven work. Providers don't deliver without payment assurance.",
  },
  {
    icon: Scale,
    title: "Prevent disputes",
    desc: "Scope, milestones, and evidence are locked in one shared record. No more he-said-she-said.",
  },
  {
    icon: UserCheck,
    title: "Protect agreements",
    desc: "Turn WhatsApp chats and email chains into a structured agreement both sides can see.",
  },
  {
    icon: Grip,
    title: "Reduce uncertainty",
    desc: "Milestones make progress visible. Both sides always know what's due and what's done.",
  },
  {
    icon: MessageSquare,
    title: "Resolve faster",
    desc: "When issues come up, the full evidence trail is ready for review. No chasing screenshots.",
  },
];

const faqs = [
  {
    q: "Does the client need to create an account?",
    a: "No. The client receives a secure link. They verify their email, review milestones, approve delivery, and release payment — all without signing up.",
  },
  {
    q: "How are payments handled?",
    a: "Funds are held securely by TrustPoint via Paystack. They are released to the provider only when the client approves each milestone. If all milestones are approved, payment auto-releases after 48 hours.",
  },
  {
    q: "What happens if there is a dispute?",
    a: "Both sides can submit their case. TrustPoint reviews the recorded agreement, milestones, evidence, and communication timeline to reach a fair resolution.",
  },
  {
    q: "Can I use TrustPoint for fixed-price milestone projects?",
    a: "Yes. That is exactly what it is built for. Break any fixed-price project into milestones, attach evidence to each one, and let the client approve phase by phase.",
  },
  {
    q: "What kind of work works best with TrustPoint?",
    a: "Digital services: website development, app builds, branding, design, content creation, consulting, marketing campaigns — any project with clear deliverables and milestones.",
  },
];

function LandingHeader() {
  return (
    <header className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
      <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2 transition-opacity hover:opacity-85">
        <TrustPointLogo
          className="w-[7.75rem] sm:w-[10rem] lg:w-[11.5rem]"
          priority
          sizes="(max-width: 640px) 7.75rem, (max-width: 1024px) 10rem, 11.5rem"
        />
      </Link>

      <nav aria-label="Primary navigation" className="hidden items-center gap-6 lg:flex">
        <Link href="#pain" className="text-sm font-semibold text-slate-600 transition-colors hover:text-slate-950">
          The problem
        </Link>
        <Link href="#how-it-works" className="text-sm font-semibold text-slate-600 transition-colors hover:text-slate-950">
          How it works
        </Link>
        <Link href="#examples" className="text-sm font-semibold text-slate-600 transition-colors hover:text-slate-950">
          Examples
        </Link>
        <Link href="#faq" className="text-sm font-semibold text-slate-600 transition-colors hover:text-slate-950">
          FAQ
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
          className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-950 px-3 text-xs font-semibold text-white shadow-sm shadow-slate-950/15 transition-colors hover:bg-brand-700 sm:px-4 sm:text-sm"
        >
          <span className="sm:hidden">Start</span>
          <span className="hidden sm:inline">Start a protected transaction</span>
        </Link>
      </div>
    </header>
  );
}

function MilestoneMockup() {
  const rows = [
    { label: "Wireframes", status: "Approved", amount: "₦100,000" },
    { label: "Frontend build", status: "In review", amount: "₦150,000" },
    { label: "Backend API", status: "In review", amount: "₦150,000" },
    { label: "Launch support", status: "Queued", amount: "₦100,000" },
  ];
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
            <ShieldCheck className="size-4" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-950">Protected transaction</p>
            <p className="text-xs text-slate-500">Lagos SaaS dashboard · ₦500,000</p>
          </div>
        </div>
        <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">Active</span>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Milestones</p>
          <p className="text-xs text-slate-500">2 of 4 approved</p>
        </div>
        <div className="mt-3 space-y-2">
          {rows.map((r) => {
            const isApproved = r.status === "Approved";
            return (
              <div key={r.label} className={`flex items-center justify-between rounded-lg border p-3 ${isApproved ? "border-emerald-200 bg-emerald-50/50" : "border-slate-200"}`}>
                <div>
                  <p className="text-sm font-semibold text-slate-950">{r.label}</p>
                  <p className="text-xs text-slate-500">{r.amount}</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${isApproved ? "bg-emerald-100 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>
                  {r.status}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
            <CheckCircle2 className="size-4 text-amber-600" />
            <p className="text-xs font-semibold text-amber-800">1 milestone awaiting your review</p>
          </div>
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
              Stop losing money to unclear client agreements and payment disputes.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              Record expectations, track milestones, and protect both sides before work begins.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-brand-700 px-5 text-sm font-bold text-white shadow-lg shadow-brand-700/20 transition-colors hover:bg-slate-950 sm:px-6"
              >
                Use TrustPoint for your next project
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
                Built for developers, designers, consultants, and creators — and the clients who hire them.
              </p>
            </div>
          </div>

          <MilestoneMockup />
        </div>
      </section>

      <section id="pain" className="border-y border-slate-200 bg-slate-50 px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-9 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <SectionHeading
              title="Freelance transactions are built on trust. And trust gets messy."
              desc="Digital projects start in DMs, WhatsApp, and email chains. No scope. No milestones. No record. When something goes wrong, there is nothing to point to."
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

      <section id="how-it-works" className="px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <SectionHeading
              title="How it works"
              desc="Set up a protected transaction in 5 minutes."
            />
            <Link href="/register" className="hidden shrink-0 items-center gap-2 text-sm font-bold text-brand-700 hover:text-slate-950 md:inline-flex">
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

          <div className="mt-8 text-center md:hidden">
            <Link
              href="/register"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-brand-700 px-6 text-sm font-bold text-white shadow-lg shadow-brand-700/20 transition-colors hover:bg-slate-950"
            >
              Start a protected transaction
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <section id="examples" className="border-y border-slate-200 bg-slate-50 px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            title="Use this for your next project"
            desc="TrustPoint works best when you set it up before work begins. Here is what it looks like in practice."
          />

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {examples.map((ex) => (
              <div key={ex.role} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/[0.03]">
                <div className="flex size-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <Handshake className="size-5" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-950">
                  {ex.role} {ex.project}
                </h3>
                <div className="mt-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                    <p className="text-sm text-slate-600">{ex.pain}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                    <p className="text-sm text-slate-600">{ex.outcome}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/register"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-brand-700 px-6 text-sm font-bold text-white shadow-lg shadow-brand-700/20 transition-colors hover:bg-slate-950"
            >
              Start Protected Transaction
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            title="What TrustPoint provides"
            desc="Outcomes, not infrastructure."
          />

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="border-y border-slate-200 bg-slate-50 px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <SectionHeading
            title="Frequently asked questions"
            desc="The most common questions about how TrustPoint works."
          />

          <div className="mt-10 space-y-3">
            {faqs.map((faq) => (
              <details key={faq.q} className="group rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/[0.03] open:border-brand-200 open:ring-1 open:ring-brand-200">
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

      <section className="bg-slate-950 px-4 py-14 text-white sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-lg bg-white/10 text-emerald-300">
              <LockKeyhole className="size-6" />
            </div>
            <h2 className="mt-6 text-3xl font-bold leading-tight sm:text-4xl">
              Have a live project right now?
            </h2>
            <p className="mt-4 text-base leading-7 text-white/68">
              A developer building a website for a client. A designer creating brand assets. A consultant delivering a strategy engagement. Set up a protected transaction before work starts.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-white px-6 text-sm font-bold text-slate-950 shadow-lg shadow-black/20 transition-colors hover:bg-brand-50"
              >
                Use TrustPoint for your next project
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-white/20 px-6 text-sm font-bold text-white transition-colors hover:bg-white/10"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white px-4 py-7 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <Link href="#pain" className="text-sm font-semibold text-slate-500 hover:text-slate-950">
              The problem
            </Link>
            <Link href="#how-it-works" className="text-sm font-semibold text-slate-500 hover:text-slate-950">
              How it works
            </Link>
            <Link href="#examples" className="text-sm font-semibold text-slate-500 hover:text-slate-950">
              Examples
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

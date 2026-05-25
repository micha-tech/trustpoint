import Link from "next/link";

const steps = [
  { step: "01", title: "Create a Job", desc: "Define the work, set milestones, and agree on a price with your client." },
  { step: "02", title: "Client Funds Escrow", desc: "Client pays the full amount upfront. Funds are held securely by TrustPoint." },
  { step: "03", title: "Release on Approval", desc: "Complete milestones. Client approves. Funds are released instantly." },
];

const features = [
  { title: "Milestone Payments", desc: "Split large projects into funded milestones. Pay as work is completed and approved." },
  { title: "Escrow Protection", desc: "Funds are held securely and only released when both parties agree milestones are met." },
  { title: "Simple & Transparent", desc: "No hidden fees. Clear status on every payment. Built for Nigerian artisans and clients." },
];

export default function Home() {
  return (
    <>
      <section className="relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden px-4 sm:min-h-screen">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-48 -top-48 size-[36rem] rounded-full bg-brand-500/8 blur-3xl" />
          <div className="absolute -bottom-48 -right-48 size-[36rem] rounded-full bg-brand-500/8 blur-3xl" />
        </div>

        <div className="mx-auto max-w-2xl text-center">
          <img src="/logo.png" alt="TrustPoint" className="mx-auto mb-6 h-10 w-auto sm:mb-8" />
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold tracking-wide text-brand-700 sm:px-4 sm:py-1.5">
            <span className="size-1.5 rounded-full bg-brand-500" />
            Payment Protection for Artisans
          </span>
          <h1 className="mb-4 text-3xl font-bold tracking-tight text-gray-900 sm:mb-5 sm:text-5xl lg:text-6xl">
            Get paid safely.
            <br />
            Pay with confidence.
          </h1>
          <p className="mb-6 text-sm leading-relaxed text-gray-500 sm:mb-8 sm:text-lg sm:leading-relaxed">
            TrustPoint holds payments in escrow and releases them
            milestone-by-milestone. Artisans never chase unpaid invoices.
            Clients never pay for unfinished work.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:bg-brand-600 hover:shadow-xl hover:shadow-brand-500/30 active:scale-[0.98] sm:w-auto sm:py-3"
            >
              Get Started Free
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-8 py-3.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50 hover:shadow-md active:scale-[0.98] sm:w-auto sm:py-3"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-gray-200/60 bg-white px-4 py-16 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center sm:mb-16">
            <span className="mb-2 inline-block text-xs font-semibold tracking-wide text-brand-600 uppercase">How it works</span>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-4xl">
              Three simple steps
            </h2>
            <p className="mt-2 text-sm text-gray-500 sm:mt-3 sm:text-base max-w-md mx-auto">
              From agreement to payment, TrustPoint keeps every transaction secure and transparent.
            </p>
          </div>

          <div className="mx-auto mb-16 grid max-w-4xl gap-6 sm:mb-20 sm:grid-cols-3 sm:gap-8">
            {steps.map((s) => (
              <div key={s.step} className="relative text-center">
                <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-sm font-bold text-brand-700 sm:mb-4 sm:size-14">
                  {s.step}
                </div>
                <h3 className="mb-1.5 text-base font-semibold text-gray-900 sm:mb-2 sm:text-lg">{s.title}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-3 sm:gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-gray-100 bg-gray-50/50 p-5 transition-all hover:border-brand-100 hover:bg-brand-50/30 hover:shadow-sm sm:p-6"
              >
                <div className="mb-3 flex size-8 items-center justify-center rounded-lg bg-brand-100 text-brand-700 transition-colors group-hover:bg-brand-200">
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="mb-1.5 font-semibold text-gray-900 sm:mb-2">{f.title}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-gray-200/60 bg-gray-50 px-4 py-16 sm:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <span className="mb-2 inline-block text-xs font-semibold tracking-wide text-brand-600 uppercase">For everyone</span>
          <h2 className="mb-3 text-2xl font-bold text-gray-900 sm:mb-4 sm:text-4xl">
            Built for Nigerian artisans and their clients
          </h2>
          <p className="mb-6 text-sm leading-relaxed text-gray-500 sm:mb-8 sm:text-lg">
            Whether you are a plumber, tailor, graphic designer, or contractor —
            TrustPoint makes sure everyone gets what they paid for.
          </p>
          <Link
            href="/register"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:bg-brand-600 hover:shadow-xl hover:shadow-brand-500/30 active:scale-[0.98] sm:w-auto sm:py-3"
          >
            Start Protecting Your Payments
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

      <footer className="border-t border-gray-200/60 bg-white px-4 py-6 sm:py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 text-center sm:flex-row">
          <img src="/logo.png" alt="TrustPoint" className="h-6 w-auto opacity-60 sm:h-7" />
          <p className="text-xs text-gray-400">&copy; {new Date().getFullYear()} TrustPoint. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}

import Link from "next/link";

const features = [
  {
    title: "Secure Verification",
    desc: "Multi-document identity verification with bank-grade encryption and compliance.",
  },
  {
    title: "Real-time Status",
    desc: "Track your verification progress with live updates and instant notifications.",
  },
  {
    title: "Privacy First",
    desc: "Your data is encrypted end-to-end. We never share your information without consent.",
  },
];

export default function Home() {
  return (
    <>
      <section className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center overflow-hidden px-4">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-32 -top-32 size-96 rounded-full bg-brand-500/10 blur-3xl" />
          <div className="absolute -bottom-32 -right-32 size-96 rounded-full bg-brand-500/10 blur-3xl" />
        </div>

        <div className="mx-auto max-w-2xl text-center">
          <span className="mb-4 inline-block rounded-full bg-brand-50 px-4 py-1.5 text-xs font-semibold tracking-wide text-brand-700">
            Identity Verification Platform
          </span>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Trusted identity
            <br />
            for everyone
          </h1>
          <p className="mb-8 text-base leading-relaxed text-gray-500 sm:text-lg">
            Verify identities in minutes, not days. TrustPoint combines
            AI-powered document analysis with human review for the most
            reliable verification platform.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className="w-full rounded-xl bg-brand-500 px-8 py-3 text-center text-sm font-semibold text-white shadow-sm shadow-brand-500/25 transition-all hover:bg-brand-600 hover:shadow-md hover:shadow-brand-500/30 sm:w-auto"
            >
              Get Started Free
            </Link>
            <Link
              href="/login"
              className="w-full rounded-xl border border-gray-200 bg-white px-8 py-3 text-center text-sm font-semibold text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50 hover:shadow-md sm:w-auto"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-gray-200/60 bg-white px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Why TrustPoint?
            </h2>
            <p className="mt-2 text-gray-500">
              Built for security, designed for speed
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-gray-100 bg-gray-50/50 p-6 transition-all hover:border-gray-200 hover:shadow-sm"
              >
                <h3 className="mb-2 font-semibold text-gray-900">{f.title}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

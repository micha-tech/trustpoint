"use client";

import { useAuth } from "@/components/AuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Link from "next/link";

const cards = [
  {
    href: "/artisan/dashboard",
    title: "Artisan Dashboard",
    desc: "Manage jobs, milestones, and receive payments",
    icon: (
      <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    href: "/profile",
    title: "Profile",
    desc: "Manage your account details",
    icon: (
      <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
];

function DashboardContent() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:py-12">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl font-bold text-gray-900 sm:text-3xl">
          Hello, {user?.email?.split("@")[0] ?? "there"}
        </h1>
        <p className="mt-0.5 text-sm text-gray-500">Welcome to TrustPoint</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-brand-200 hover:shadow-md"
          >
            <div className="absolute -right-6 -top-6 size-16 rounded-full bg-brand-50/50 transition-all group-hover:scale-150" />
            <div className="relative mb-3 flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-100 sm:mb-4">
              {c.icon}
            </div>
            <h2 className="relative text-sm font-semibold text-gray-900 sm:text-base">{c.title}</h2>
            <p className="relative mt-1 text-sm leading-relaxed text-gray-500">{c.desc}</p>
          </Link>
        ))}

        <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm opacity-60 sm:p-5">
          <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-gray-100 text-gray-400 sm:mb-4">
            <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          </div>
          <h2 className="text-sm font-semibold text-gray-400 sm:text-base">Client View</h2>
          <p className="mt-1 text-sm leading-relaxed text-gray-400">
            Opens when an artisan shares a job link with you
          </p>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

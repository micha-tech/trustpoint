"use client";

import { useAuth } from "@/components/AuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Link from "next/link";

const actions = [
  {
    href: "/verify",
    title: "Identity Verification",
    desc: "Upload and verify your identity documents",
    icon: (
      <svg className="size-6 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
  {
    href: "/profile",
    title: "Profile",
    desc: "Manage your account and view details",
    icon: (
      <svg className="size-6 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
];

function DashboardContent() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          Hello, {user?.email?.split("@")[0] ?? "there"}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome to your TrustPoint dashboard
        </p>
      </div>

      <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-50">
            <svg className="size-6 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Verification Status</p>
            <p className="text-sm text-gray-500">
              {user?.emailVerified
                ? "Email verified"
                : "Email not verified — check your inbox"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {actions.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-brand-200 hover:shadow-md"
          >
            <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-brand-50 transition-colors group-hover:bg-brand-100">
              {a.icon}
            </div>
            <h2 className="font-semibold text-gray-900">{a.title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-gray-500">
              {a.desc}
            </p>
          </Link>
        ))}
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

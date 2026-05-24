"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";

function ProfileContent() {
  const { user } = useAuth();

  const details = [
    { label: "Email", value: user?.email ?? "—" },
    { label: "User ID", value: user?.uid ?? "—" },
    { label: "Email Verified", value: user?.emailVerified ? "Yes" : "No" },
    { label: "Joined", value: user?.metadata.creationTime ?? "—" },
  ];

  return (
    <div className="mx-auto max-w-lg px-4 py-8 sm:py-12">
      <div className="mb-8 flex items-center gap-4">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-xl font-bold text-brand-600">
          {user?.email?.charAt(0).toUpperCase() ?? "?"}
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
            Profile
          </h1>
          <p className="text-sm text-gray-500">Manage your account details</p>
        </div>
      </div>

      <div className="divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white shadow-sm">
        {details.map((d) => (
          <div
            key={d.label}
            className="flex items-center justify-between px-5 py-4"
          >
            <span className="text-sm text-gray-500">{d.label}</span>
            <span className="text-sm font-medium text-gray-900">{d.value}</span>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <Link
          href="/verify"
          className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm transition-all hover:border-brand-200 hover:shadow-md"
        >
          <div>
            <p className="text-sm font-medium text-gray-900">
              Identity Verification
            </p>
            <p className="text-sm text-gray-500">
              {user?.emailVerified
                ? "Verify your identity documents"
                : "Verify your email first"}
            </p>
          </div>
          <svg
            className="size-5 shrink-0 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}

"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/components/AuthProvider";

function ProfileContent() {
  const { user } = useAuth();

  const details = [
    { label: "Email", value: user?.email ?? "—" },
    { label: "Email Verified", value: user?.emailVerified ? "Yes" : "No" },
    { label: "Member Since", value: user?.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "—" },
  ];

  const initial = user?.email?.charAt(0).toUpperCase() ?? "?";

  return (
    <div className="mx-auto max-w-lg px-4 py-6 sm:py-12">
      <div className="mb-6 flex items-center gap-4 sm:mb-8">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-base font-bold text-white shadow-sm sm:size-14 sm:text-lg">
          {initial}
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900 sm:text-2xl">Profile</h1>
          <p className="text-sm text-gray-500">Manage your account details</p>
        </div>
      </div>

      <div className="divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white shadow-sm">
        {details.map((d) => (
          <div key={d.label} className="flex items-center justify-between px-5 py-4">
            <span className="text-sm text-gray-500">{d.label}</span>
            <span className="text-right text-sm font-medium text-gray-900">{d.value}</span>
          </div>
        ))}
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

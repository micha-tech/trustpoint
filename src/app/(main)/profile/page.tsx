"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/components/AuthProvider";
import { Card, CardContent } from "@/components/ui/card";

function ProfileContent() {
  const { user } = useAuth();

  const details = [
    { label: "Phone", value: user?.phoneNumber ?? "—" },
    { label: "Email", value: user?.email ?? "—" },
    { label: "Email Verified", value: user?.emailVerified ? "Yes" : "No" },
    { label: "Member Since", value: user?.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "—" },
  ];

  const initial = (user?.phoneNumber ?? user?.email ?? "?").charAt(0).toUpperCase();

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <div className="mb-6 flex items-center gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-base font-bold text-white shadow-sm sm:size-14 sm:text-lg">
          {initial}
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">Profile</h1>
          <p className="text-sm text-muted-foreground">Manage your account details</p>
        </div>
      </div>

      <Card>
        <CardContent className="divide-y divide-border p-0">
          {details.map((d) => (
            <div key={d.label} className="flex items-center justify-between px-5 py-4">
              <span className="text-sm text-muted-foreground">{d.label}</span>
              <span className="text-right text-sm font-medium text-foreground">{d.value}</span>
            </div>
          ))}
        </CardContent>
      </Card>
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

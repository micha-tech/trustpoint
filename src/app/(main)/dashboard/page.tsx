"use client";

import { useAuth } from "@/components/AuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, User, Users } from "lucide-react";

const cards = [
  {
    href: "/artisan/dashboard",
    title: "Artisan Dashboard",
    desc: "Manage jobs, milestones, and receive payments",
    icon: Briefcase,
  },
  {
    href: "/profile",
    title: "Profile",
    desc: "Manage your account details",
    icon: User,
  },
];

function DashboardContent() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">
          Hello, {user?.email?.split("@")[0] ?? "there"}
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Welcome to TrustPoint</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map((c) => (
          <Link key={c.href} href={c.href}>
            <Card className="transition-all hover:border-brand-200 hover:shadow-md">
              <CardContent className="p-5">
                <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <c.icon className="size-5" />
                </div>
                <h2 className="text-sm font-semibold text-foreground">{c.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{c.desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}

        <Card className="opacity-60">
          <CardContent className="p-5">
            <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Users className="size-5" />
            </div>
            <h2 className="text-sm font-semibold text-muted-foreground">Client View</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Opens when an artisan shares a job link with you
            </p>
          </CardContent>
        </Card>
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

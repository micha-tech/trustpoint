"use client";

import { useAuth } from "@/components/AuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { BadgeCheck, Briefcase, ShieldCheck, User, Users } from "lucide-react";

const cards = [
  {
    href: "/artisan/dashboard",
    title: "Protected Projects",
    desc: "Create links, track milestones, and manage client approvals.",
    icon: Briefcase,
  },
  {
    href: "/profile",
    title: "Trust Profile",
    desc: "Keep your account and payout details ready for settlement.",
    icon: User,
  },
];

function DashboardContent() {
  const { user } = useAuth();

  const displayName = user?.email?.split("@")[0] ?? user?.phoneNumber ?? "there";

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <section className="mb-6 rounded-2xl border border-brand-100 bg-white/85 p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800">
              <ShieldCheck className="size-3.5" />
              TrustPoint workspace
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Hello, {displayName}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Manage protected project links, approvals, evidence, and payout readiness from one calm place.
            </p>
          </div>
          <div className="rounded-xl bg-foreground p-4 text-white sm:min-w-56">
            <div className="flex items-center gap-2 text-xs font-semibold text-white/70">
              <BadgeCheck className="size-4 text-brand-300" />
              Protection mode
            </div>
            <p className="mt-2 text-xl font-bold">Ready</p>
            <p className="mt-1 text-xs text-white/60">Secure links and approvals enabled</p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.href} href={c.href}>
            <Card className="h-full transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md">
              <CardContent className="p-5">
                <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <c.icon className="size-5" />
                </div>
                <h2 className="text-base font-semibold text-foreground">{c.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{c.desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}

        <Card className="h-full opacity-75">
          <CardContent className="p-5">
            <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Users className="size-5" />
            </div>
            <h2 className="text-base font-semibold text-muted-foreground">Client Review</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Opens from a secure project link shared with a client.
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

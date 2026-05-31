"use client";

import { useAuth } from "@/components/AuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { AppContainer, StatusPill } from "@/components/ui/trustpoint-shell";
import { ArrowRight, BadgeCheck, Briefcase, ShieldCheck, User, Users, WalletCards } from "lucide-react";

const cards = [
  {
    href: "/provider/dashboard",
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
    <AppContainer>
      <section className="mb-6 overflow-hidden rounded-lg border border-brand-100 bg-white/95 shadow-sm shadow-brand-900/5">
        <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-center">
          <div>
            <StatusPill className="mb-4 bg-brand-50 text-brand-800">
              <ShieldCheck className="size-3.5" />
              TrustPoint workspace
            </StatusPill>
            <h1 className="text-2xl font-bold leading-tight text-foreground sm:text-3xl">
              Hello, {displayName}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Manage protected project links, approvals, evidence, and settlement readiness from one calm place.
            </p>
          </div>

          <div className="rounded-lg bg-brand-950 p-4 text-white">
            <div className="flex items-center gap-2 text-xs font-semibold text-white/70">
              <BadgeCheck className="size-4 text-brand-200" />
              Protection status
            </div>
            <p className="mt-2 text-xl font-bold">Ready</p>
            <p className="mt-1 text-xs leading-5 text-white/65">Secure links, client approvals, and payouts are enabled.</p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.href} href={c.href}>
            <Card className="h-full transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md">
              <CardContent className="p-5">
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                    <c.icon className="size-5" />
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground" />
                </div>
                <h2 className="text-base font-semibold text-foreground">{c.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{c.desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}

        <Card className="h-full opacity-75">
          <CardContent className="p-5">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Users className="size-5" />
              </div>
              <WalletCards className="size-4 text-muted-foreground" />
            </div>
            <h2 className="text-base font-semibold text-muted-foreground">Client Review</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Opens from a secure project link shared with a client.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppContainer>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

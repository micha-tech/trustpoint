"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/components/AuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AppContainer, StatusPill } from "@/components/ui/trustpoint-shell";
import { Plus, Briefcase, RefreshCcw, ShieldCheck, Clock3, WalletCards } from "lucide-react";
import { getStatusLabel, getStatusStyle } from "@/lib/job-status";

type Job = {
  id: string;
  title: string;
  ref: string;
  status: string;
  amount: number;
  escrow: { status: string; totalAmount: number; releasedAmount: number } | null;
  approvedAt: string | null;
};

const STATUS_ORDER = [
  "ACTIVE",
  "IN_PROGRESS",
  "PENDING_PAYMENT",
  "COMPLETED",
  "DISPUTED",
  "DRAFT",
  "CANCELLED",
];

function groupJobs(jobs: Job[]): Record<string, Job[]> {
  const groups: Record<string, Job[]> = {};
  for (const s of STATUS_ORDER) groups[s] = [];
  for (const j of jobs) {
    if (groups[j.status]) groups[j.status].push(j);
  }
  const result: Record<string, Job[]> = {};
  for (const s of STATUS_ORDER) {
    if (groups[s].length > 0) result[s] = groups[s];
  }
  return result;
}

function ProviderDashboard() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchJobs = async (p = page) => {
    if (!user) return;
    setError(false);
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/jobs?page=${p}&limit=${limit}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs);
        setTotal(data.total);
        setPage(data.page);
      } else setError(true);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchJobs(1); }, [user]);

  const displayName = user?.email?.split("@")[0] ?? user?.phoneNumber ?? "";
  const groups = useMemo(() => groupJobs(jobs), [jobs]);
  const totalProtected = jobs.reduce((sum, job) => sum + job.amount, 0);
  const securedCount = jobs.filter((job) => job.escrow?.status === "FUNDED" || job.escrow?.status === "RELEASED").length;
  const awaitingCount = jobs.filter((job) => job.status === "PENDING_PAYMENT").length;

  if (loading) {
    return (
      <AppContainer className="max-w-5xl">
        <div className="mb-6 h-9 w-56 animate-pulse rounded-lg bg-muted" />
        <div className="grid gap-3 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </AppContainer>
    );
  }

  if (error) {
    return (
      <AppContainer className="max-w-5xl">
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Briefcase className="size-6" />
          </div>
          <p className="text-sm text-muted-foreground">Could not load jobs. Check your connection.</p>
          <Button variant="outline" onClick={() => fetchJobs()}>
            <RefreshCcw className="size-4" />
            Try Again
          </Button>
        </div>
      </AppContainer>
    );
  }

  return (
    <AppContainer className="max-w-5xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <StatusPill className="mb-3 bg-brand-50 text-brand-800">
            <ShieldCheck className="size-3.5" />
            Protected Projects
          </StatusPill>
          <h1 className="text-2xl font-bold leading-tight text-foreground sm:text-3xl">
            {displayName ? `Hello, ${displayName}` : "Hello"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Track funded work, approvals, and settlement progress across every client link.
          </p>
        </div>
        <Link href="/provider/jobs/new" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto">
            <Plus className="size-4" />
            New protected project
          </Button>
        </Link>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {[
          { label: "Projects", value: jobs.length.toLocaleString(), detail: "Total protected links", icon: Briefcase },
          { label: "Secured", value: securedCount.toLocaleString(), detail: "Funded or settled", icon: ShieldCheck },
          { label: "Protected value", value: `NGN ${(totalProtected / 100).toLocaleString()}`, detail: `${awaitingCount} awaiting payment`, icon: WalletCards },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex size-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <stat.icon className="size-4" />
                </div>
                <Clock3 className="size-4 text-muted-foreground" />
              </div>
              <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
              <p className="mt-1 truncate text-xl font-bold text-foreground">{stat.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{stat.detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {jobs.length === 0 && (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-16">
            <div className="flex size-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Briefcase className="size-6" />
            </div>
            <p className="max-w-sm text-center text-sm leading-6 text-muted-foreground">
              No projects yet. Create your first protected payment link and send it to a client.
            </p>
            <Link href="/provider/jobs/new">
              <Button>
                <Plus className="size-4" />
                New protected project
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        {Object.entries(groups).map(([status, groupJobs]) => (
          <div key={status}>
            <h2 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
              {getStatusLabel(status)}
            </h2>
            <div className="space-y-3">
              {groupJobs.map((job) => {
                const progress = job.escrow && job.escrow.totalAmount > 0
                  ? (job.escrow.releasedAmount / job.escrow.totalAmount) * 100
                  : 0;

                return (
                  <Link key={job.id} href={`/provider/jobs/${job.id}`}>
                    <Card className="transition-all hover:border-brand-200 hover:shadow-md focus-visible:ring-2 focus-visible:ring-brand-500">
                      <CardContent className="p-4 sm:p-5">
                        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0 flex-1">
                            <h2 className="truncate text-sm font-semibold text-foreground">{job.title}</h2>
                            <p className="mt-0.5 text-xs text-muted-foreground">{job.ref}</p>
                          </div>
                          <span
                            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${getStatusStyle(job.status, job.approvedAt)}`}
                          >
                            {getStatusLabel(job.status, job.approvedAt)}
                          </span>
                        </div>

                        <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                          <span className="font-semibold text-foreground">
                            NGN {(job.amount / 100).toLocaleString()}
                          </span>
                          <span className="text-muted-foreground">
                            {job.escrow?.status === "FUNDED" ? "Payment secured" : job.escrow?.status === "RELEASED" ? "Settled" : "Awaiting payment"}
                          </span>
                        </div>

                        {job.escrow && job.escrow.totalAmount > 0 && (
                          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-brand-500 transition-all duration-500"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {total > limit && (
        <div className="mt-6 flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Page {page} of {Math.ceil(total / limit)} ({total} total)
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => fetchJobs(page - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page * limit >= total} onClick={() => fetchJobs(page + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </AppContainer>
  );
}

export default function ProviderDashboardPage() {
  return (
    <ProtectedRoute>
      <ProviderDashboard />
    </ProtectedRoute>
  );
}

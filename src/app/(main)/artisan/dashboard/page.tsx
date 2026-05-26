"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/components/AuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Briefcase, Loader2, RefreshCcw } from "lucide-react";
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

function ArtisanDashboard() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchJobs = async () => {
    if (!user) return;
    setError(false);
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/jobs", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setJobs(await res.json());
      else setError(true);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchJobs(); }, [user]);

  const displayName = user?.email?.split("@")[0] ?? user?.phoneNumber ?? "";

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-6 h-7 w-48 animate-pulse rounded bg-muted" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <Briefcase className="size-6" />
          </div>
          <p className="text-sm text-muted-foreground">Could not load jobs. Check your connection.</p>
          <Button variant="outline" onClick={fetchJobs}>
            <RefreshCcw className="size-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const groups = useMemo(() => groupJobs(jobs), [jobs]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            {displayName ? `Hello, ${displayName}` : "Hello"}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {jobs.length} project{jobs.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/artisan/jobs/new" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto">
            <Plus className="size-4" />
            New Project
          </Button>
        </Link>
      </div>

      {jobs.length === 0 && (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-16">
            <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Briefcase className="size-6" />
            </div>
            <p className="text-sm text-muted-foreground">
              No projects yet. Start by creating your first one.
            </p>
            <Link href="/artisan/jobs/new">
              <Button>
                <Plus className="size-4" />
                New Project
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        {Object.entries(groups).map(([status, groupJobs]) => (
          <div key={status}>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {getStatusLabel(status)}
            </h2>
            <div className="space-y-3">
              {groupJobs.map((job) => {
                const progress = job.escrow && job.escrow.totalAmount > 0
                  ? (job.escrow.releasedAmount / job.escrow.totalAmount) * 100
                  : 0;

                return (
                  <Link key={job.id} href={`/artisan/jobs/${job.id}`}>
                    <Card className="transition-all hover:border-brand-200 hover:shadow-md focus-visible:ring-2 focus-visible:ring-brand-500">
                      <CardContent className="p-5">
                        <div className="mb-3 flex items-start justify-between gap-3">
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

                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold text-foreground">
                            ₦{(job.amount / 100).toLocaleString()}
                          </span>
                          <span className="text-muted-foreground">
                            {job.escrow?.status === "FUNDED" ? "Secured" : job.escrow?.status === "RELEASED" ? "Paid out" : "Awaiting payment"}
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
    </div>
  );
}

export default function ArtisanDashboardPage() {
  return (
    <ProtectedRoute>
      <ArtisanDashboard />
    </ProtectedRoute>
  );
}

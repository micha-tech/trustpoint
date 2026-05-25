"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Briefcase, Loader2 } from "lucide-react";

type Job = {
  id: string;
  title: string;
  ref: string;
  status: string;
  amount: number;
  escrow: { status: string; totalAmount: number; releasedAmount: number } | null;
};

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  PENDING_PAYMENT: "bg-amber-50 text-amber-700",
  ACTIVE: "bg-blue-50 text-blue-700",
  IN_PROGRESS: "bg-indigo-50 text-indigo-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-red-50 text-red-700",
  DISPUTED: "bg-orange-50 text-orange-700",
};

function ArtisanDashboard() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchJobs = async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/jobs", { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) setJobs(await res.json());
      } catch {
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, [user]);

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Hello, {user?.phoneNumber ?? user?.email?.split("@")[0] ?? "artisan"}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {jobs.length} job{jobs.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/artisan/jobs/new" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto">
            <Plus className="size-4" />
            New Job
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
              No jobs yet. Create your first job to get started.
            </p>
            <Link href="/artisan/jobs/new">
              <Button>
                <Plus className="size-4" />
                Create Job
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {jobs.map((job) => {
          const progress = job.escrow && job.escrow.totalAmount > 0
            ? (job.escrow.releasedAmount / job.escrow.totalAmount) * 100
            : 0;

          return (
            <Link key={job.id} href={`/artisan/jobs/${job.id}`}>
              <Card className="transition-all hover:border-brand-200 hover:shadow-md">
                <CardContent className="p-5">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-sm font-semibold text-foreground">{job.title}</h2>
                      <p className="mt-0.5 text-xs text-muted-foreground">{job.ref}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[job.status] ?? "bg-muted text-muted-foreground"}`}
                    >
                      {job.status.replace("_", " ")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-foreground">
                      ₦{(job.amount / 100).toLocaleString()}
                    </span>
                    <span className="text-muted-foreground">
                      {job.escrow?.status === "FUNDED" ? "Payment secured" : job.escrow?.status === "RELEASED" ? "Paid out" : "Awaiting payment"}
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
  );
}

export default function ArtisanDashboardPage() {
  return (
    <ProtectedRoute>
      <ArtisanDashboard />
    </ProtectedRoute>
  );
}

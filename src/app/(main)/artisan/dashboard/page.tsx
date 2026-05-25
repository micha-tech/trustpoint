"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Link from "next/link";

type Job = {
  id: string;
  title: string;
  ref: string;
  status: string;
  amount: number;
  milestones: { id: string; status: string }[];
  escrow: { status: string; totalAmount: number; releasedAmount: number } | null;
};

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
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
    fetch("/api/jobs", { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
      .then((r) => r.ok ? r.json() : [])
      .then(setJobs)
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:py-12">
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
            Hello, {user?.email?.split("@")[0] ?? "artisan"}
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {jobs.length} job{jobs.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/artisan/jobs/new"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:bg-brand-600 hover:shadow-xl hover:shadow-brand-500/30 active:scale-[0.98] sm:w-auto sm:py-2.5"
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Job
        </Link>
      </div>

      {jobs.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 px-6 py-16 text-center sm:p-12">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
            <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500">No jobs yet. Create your first job to get started.</p>
        </div>
      )}

      <div className="space-y-3">
        {jobs.map((job) => {
          const completed = job.milestones.filter((m) => m.status === "RELEASED").length;
          const total = job.milestones.length;
          const progress = job.escrow && job.escrow.totalAmount > 0
            ? (job.escrow.releasedAmount / job.escrow.totalAmount) * 100
            : 0;

          return (
            <Link
              key={job.id}
              href={`/artisan/jobs/${job.id}`}
              className="group block rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-brand-200 hover:shadow-md"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-sm font-semibold text-gray-900 sm:text-base">{job.title}</h2>
                  <p className="mt-0.5 text-xs text-gray-400">{job.ref}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[job.status] ?? "bg-gray-50 text-gray-600"}`}
                >
                  {job.status.replace("_", " ")}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-gray-900">
                  ₦{(job.amount / 100).toLocaleString()}
                </span>
                {total > 0 && (
                  <span className="text-gray-400">
                    {completed}/{total} milestone{total !== 1 ? "s" : ""} paid
                  </span>
                )}
              </div>

              {job.escrow && total > 0 && (
                <div className="mt-3">
                  <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-brand-500 transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
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

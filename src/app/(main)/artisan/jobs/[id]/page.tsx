"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Link from "next/link";

type Milestone = {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  status: string;
  sortOrder: number;
};

type Job = {
  id: string;
  title: string;
  ref: string;
  description: string | null;
  amount: number;
  fee: number;
  status: string;
  milestones: Milestone[];
  escrow: { status: string; totalAmount: number; releasedAmount: number; pendingAmount: number } | null;
  paymentReferences: { reference: string; status: string }[];
  virtualAccount: { bankName: string; accountNumber: string; accountName: string } | null;
  clientUrl: string;
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  PENDING_PAYMENT: "bg-amber-50 text-amber-700",
  ACTIVE: "bg-blue-50 text-blue-700",
  IN_PROGRESS: "bg-indigo-50 text-indigo-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-red-50 text-red-700",
  DISPUTED: "bg-orange-50 text-orange-700",
};

const MS_DOT: Record<string, string> = {
  PENDING: "bg-gray-300",
  IN_PROGRESS: "bg-brand-500",
  COMPLETED: "bg-amber-400",
  APPROVED: "bg-emerald-400",
  RELEASED: "bg-emerald-500",
  DISPUTED: "bg-orange-500",
};

const MS_BORDER: Record<string, string> = {
  PENDING: "border-gray-200",
  IN_PROGRESS: "border-brand-300 bg-brand-50/30",
  COMPLETED: "border-amber-300 bg-amber-50/30",
  APPROVED: "border-emerald-300 bg-emerald-50/30",
  RELEASED: "border-emerald-400 bg-emerald-50/50",
  DISPUTED: "border-orange-300 bg-orange-50/30",
};

const MS_TEXT: Record<string, string> = {
  PENDING: "text-gray-400",
  IN_PROGRESS: "text-brand-600",
  COMPLETED: "text-amber-600",
  APPROVED: "text-emerald-600",
  RELEASED: "text-emerald-700",
  DISPUTED: "text-orange-600",
};

function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const loadJob = () => {
    const token = localStorage.getItem("token");
    fetch(`/api/jobs/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : null)
      .then(setJob)
      .catch(() => setJob(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadJob(); }, [id]);

  const handleMilestoneComplete = async (milestoneId: string) => {
    const token = localStorage.getItem("token");
    await fetch("/api/milestones", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ milestoneId, status: "COMPLETED" }),
    });
    loadJob();
  };

  const copyLink = () => {
    if (job?.clientUrl) {
      navigator.clipboard.writeText(job.clientUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <p className="text-gray-500">Job not found</p>
      </div>
    );
  }

  const escrowProgress = job.escrow && job.escrow.totalAmount > 0
    ? (job.escrow.releasedAmount / job.escrow.totalAmount) * 100
    : 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <Link
        href="/artisan/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-700"
      >
        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Dashboard
      </Link>

      <div className="mb-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-bold text-gray-900">{job.title}</h1>
            <p className="mt-0.5 text-xs text-gray-400">{job.ref}</p>
          </div>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[job.status] ?? "bg-gray-50 text-gray-600"}`}
          >
            {job.status.replace("_", " ")}
          </span>
        </div>
        {job.description && (
          <p className="mt-3 text-sm leading-relaxed text-gray-500">{job.description}</p>
        )}
      </div>

      {/* Client link — shown when job is waiting for payment */}
      {job.clientUrl && job.status === "PENDING_PAYMENT" && (
        <div className="mb-6 rounded-2xl border border-brand-200 bg-brand-50 p-5 shadow-sm">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-brand-800">
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Share this link with your client
          </h3>
          <div className="flex items-center gap-2 overflow-hidden rounded-lg border border-brand-200 bg-white pl-3 pr-1">
            <span className="min-w-0 flex-1 truncate py-2 text-xs text-gray-600">{job.clientUrl}</span>
            <button
              onClick={copyLink}
              className="shrink-0 rounded-lg bg-brand-500 px-4 py-2 text-xs font-medium text-white transition-all hover:bg-brand-600 active:scale-[0.95]"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      )}

      {/* Payment details — shown when payment info exists */}
      {(job.paymentReferences?.length > 0 || job.virtualAccount) && (
        <div className="mb-6 space-y-3">
          {job.virtualAccount && (
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-900">
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Bank Transfer Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Bank</span>
                  <span className="font-medium text-gray-900">{job.virtualAccount.bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Account Number</span>
                  <span className="font-mono font-bold text-gray-900">{job.virtualAccount.accountNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Account Name</span>
                  <span className="font-medium text-gray-900">{job.virtualAccount.accountName}</span>
                </div>
              </div>
            </div>
          )}
          {job.paymentReferences.map((pr) => (
            <div key={pr.reference} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div>
                <p className="text-xs text-gray-500">Payment Reference</p>
                <p className="text-sm font-mono font-medium text-gray-900">{pr.reference}</p>
              </div>
              <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-600">{pr.status}</span>
            </div>
          ))}
        </div>
      )}

      {/* Escrow card */}
      {job.escrow && (
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-900">Escrow</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-400">Total</p>
              <p className="font-semibold text-gray-900">₦{(job.escrow.totalAmount / 100).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Released</p>
              <p className="font-semibold text-emerald-600">₦{(job.escrow.releasedAmount / 100).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Pending</p>
              <p className="font-semibold text-brand-600">₦{(job.escrow.pendingAmount / 100).toLocaleString()}</p>
            </div>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-brand-500 transition-all duration-500"
              style={{ width: `${escrowProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Milestones */}
      <div className="mb-6">
        <h2 className="mb-3 text-sm font-medium text-gray-900">Milestones</h2>
        <div className="space-y-2">
          {job.milestones.map((ms) => (
            <div
              key={ms.id}
              className={`rounded-xl border p-4 transition-all ${MS_BORDER[ms.status] ?? "border-gray-200"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className={`size-2 shrink-0 rounded-full ${MS_DOT[ms.status] ?? "bg-gray-300"}`} />
                    <span className="text-sm font-medium text-gray-900">{ms.title}</span>
                  </div>
                  {ms.description && (
                    <p className="mt-1 text-xs text-gray-500 ml-4">{ms.description}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-sm font-semibold text-gray-900">
                    ₦{(ms.amount / 100).toLocaleString()}
                  </span>
                  {ms.status === "IN_PROGRESS" && (
                    <button
                      onClick={() => handleMilestoneComplete(ms.id)}
                      className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-all hover:bg-brand-600 active:scale-[0.95]"
                    >
                      Complete
                    </button>
                  )}
                </div>
              </div>
              <span className={`mt-2 inline-block text-xs font-medium ${MS_TEXT[ms.status] ?? "text-gray-400"}`}>
                {ms.status === "COMPLETED" ? "Awaiting client approval" : ms.status.replace("_", " ")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function JobDetailPage() {
  return (
    <ProtectedRoute>
      <JobDetail />
    </ProtectedRoute>
  );
}

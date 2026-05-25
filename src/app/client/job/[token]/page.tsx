"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type Milestone = {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  status: string;
  sortOrder: number;
  approvalToken: string | null;
};

type JobData = {
  id: string;
  title: string;
  ref: string;
  description: string | null;
  amount: number;
  status: string;
  milestones: Milestone[];
  escrow: { status: string; totalAmount: number; releasedAmount: number; pendingAmount: number } | null;
  artisan: { name: string };
};

const DOT_COLORS: Record<string, string> = {
  PENDING: "bg-gray-300",
  IN_PROGRESS: "bg-brand-500",
  COMPLETED: "bg-amber-400",
  APPROVED: "bg-emerald-400",
  RELEASED: "bg-emerald-500",
  DISPUTED: "bg-orange-500",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In progress",
  COMPLETED: "Awaiting your approval",
  APPROVED: "Approved — releasing payment",
  RELEASED: "Paid",
  DISPUTED: "Disputed",
};

export default function ClientJobPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<JobData | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);

  const loadJob = () => {
    fetch(`/api/jobs/client/${token}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadJob(); }, [token]);

  const handleApprove = async (milestoneId: string) => {
    setApproving(milestoneId);
    try {
      const res = await fetch(`/api/jobs/client/${token}/approve/${milestoneId}`, {
        method: "POST",
      });
      if (res.ok) loadJob();
    } finally {
      setApproving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
            <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-gray-900">Link not valid</h1>
          <p className="mt-2 text-sm text-gray-500">
            This payment link may have expired or is invalid. Ask the artisan to share a new link.
          </p>
        </div>
      </div>
    );
  }

  const approvedCount = data.milestones.filter((m) => m.status === "APPROVED" || m.status === "RELEASED").length;
  const total = data.milestones.length;

  return (
    <div className="mx-auto min-h-screen max-w-lg px-4 py-8">
      <div className="mb-8 text-center">
        <Link href="/" className="inline-block transition-opacity hover:opacity-80">
          <img src="/logo.png" alt="TrustPoint" className="mx-auto h-16 w-auto sm:h-20" />
        </Link>
      </div>

      {/* Job header */}
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="mb-1 text-xs text-gray-400">{data.ref}</p>
        <h1 className="text-xl font-bold text-gray-900">{data.title}</h1>
        {data.description && (
          <p className="mt-2 text-sm leading-relaxed text-gray-500">{data.description}</p>
        )}
        <p className="mt-3 text-sm text-gray-500">
          Artisan: <span className="font-medium text-gray-900">{data.artisan?.name ?? "Assigned"}</span>
        </p>
      </div>

      {/* Progress */}
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-900">Progress</h2>
          <span className="text-xs text-gray-400">{approvedCount}/{total} approved</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${total > 0 ? (approvedCount / total) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Escrow */}
      {data.escrow && (
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-900">Payment</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">
              ₦{(data.escrow.totalAmount / 100).toLocaleString()}
            </span>
            <span className="text-sm text-gray-500">
              {data.escrow.releasedAmount > 0
                ? `${(data.escrow.releasedAmount / 100).toLocaleString()} released`
                : data.escrow.status === "FUNDED" ? "in escrow" : "awaiting payment"}
            </span>
          </div>
        </div>
      )}

      {/* Milestones */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-gray-900">Milestones</h2>
        {data.milestones.map((ms) => {
          const needsApproval = ms.status === "COMPLETED";
          const isDone = ms.status === "APPROVED" || ms.status === "RELEASED";

          return (
            <div
              key={ms.id}
              className={`rounded-xl border p-4 transition-all ${
                needsApproval
                  ? "border-brand-300 bg-brand-50/40"
                  : isDone
                    ? "border-emerald-200 bg-emerald-50/30"
                    : "border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className={`size-2 shrink-0 rounded-full ${DOT_COLORS[ms.status] ?? "bg-gray-300"}`} />
                    <span className={`text-sm font-medium ${isDone ? "text-emerald-700" : "text-gray-900"}`}>
                      {ms.title}
                    </span>
                  </div>
                  {ms.description && (
                    <p className="mt-1 text-xs text-gray-500 ml-4">{ms.description}</p>
                  )}
                </div>
                <span className="shrink-0 text-sm font-semibold text-gray-900">
                  ₦{(ms.amount / 100).toLocaleString()}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span className={`text-xs font-medium ${isDone ? "text-emerald-600" : needsApproval ? "text-amber-600" : "text-gray-400"}`}>
                  {STATUS_LABELS[ms.status] ?? ms.status}
                </span>

                {needsApproval && (
                  <button
                    onClick={() => handleApprove(ms.id)}
                    disabled={approving === ms.id}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-[0.95] disabled:opacity-60"
                  >
                    {approving === ms.id ? (
                      <span className="size-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : (
                      <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    Approve & Release
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 text-center text-xs text-gray-400">
        <p>Powered by <span className="font-medium text-gray-500">TrustPoint</span></p>
        <p className="mt-1">Funds held in escrow. Only released when you approve.</p>
      </div>
    </div>
  );
}

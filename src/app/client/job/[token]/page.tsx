"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, CheckCircle, Shield, XCircle, Clock } from "lucide-react";

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
  PENDING: "bg-muted-foreground/30",
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
    const ms = data?.milestones.find((m) => m.id === milestoneId);
    try {
      const res = await fetch(`/api/jobs/client/${token}/approve/${milestoneId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalToken: ms?.approvalToken }),
      });
      if (res.ok) {
        toast.success("Milestone approved and payment released");
        loadJob();
      } else {
        const err = await res.json();
        toast.error(err.error ?? "Could not approve milestone");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setApproving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <XCircle className="size-6" />
          </div>
          <h1 className="text-lg font-bold text-foreground">Link not valid</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This payment link may have expired or is invalid. Ask the artisan to share a new link.
          </p>
        </div>
      </div>
    );
  }

  const approvedCount = data.milestones.filter(
    (m) => m.status === "APPROVED" || m.status === "RELEASED"
  ).length;
  const total = data.milestones.length;

  return (
    <div className="mx-auto min-h-screen max-w-lg px-4 py-6">
      <div className="mb-6 text-center">
        <Link href="/" className="inline-block transition-opacity hover:opacity-80">
          <img src="/logo.png" alt="TrustPoint" className="mx-auto h-16 w-auto" />
        </Link>
      </div>

      <Card className="mb-4">
        <CardContent className="p-5">
          <p className="mb-1 text-xs text-muted-foreground">{data.ref}</p>
          <h1 className="text-lg font-bold text-foreground">{data.title}</h1>
          {data.description && (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {data.description}
            </p>
          )}
          <p className="mt-3 text-sm text-muted-foreground">
            Artisan:{" "}
            <span className="font-medium text-foreground">
              {data.artisan?.name ?? "Assigned"}
            </span>
          </p>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-foreground">Progress</h2>
            <span className="text-xs text-muted-foreground">
              {approvedCount}/{total} approved
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{
                width: `${total > 0 ? (approvedCount / total) * 100 : 0}%`,
              }}
            />
          </div>
        </CardContent>
      </Card>

      {data.escrow && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <Shield className="size-4" />
              </div>
              <span className="text-sm font-medium text-foreground">Payment</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground">
                ₦{(data.escrow.totalAmount / 100).toLocaleString()}
              </span>
              <span className="text-sm text-muted-foreground">
                {data.escrow.releasedAmount > 0
                  ? `${(data.escrow.releasedAmount / 100).toLocaleString()} released`
                  : data.escrow.status === "FUNDED"
                    ? "held securely in escrow"
                    : "awaiting payment"}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-foreground">Milestones</h2>
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
                    : "border-border"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div
                      className={`size-2 shrink-0 rounded-full ${
                        DOT_COLORS[ms.status] ?? "bg-muted-foreground/30"
                      }`}
                    />
                    <span
                      className={`text-sm font-medium ${
                        isDone ? "text-emerald-700" : "text-foreground"
                      }`}
                    >
                      {ms.title}
                    </span>
                  </div>
                  {ms.description && (
                    <p className="mt-1 text-xs text-muted-foreground ml-4">
                      {ms.description}
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-sm font-semibold text-foreground">
                  ₦{(ms.amount / 100).toLocaleString()}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span
                  className={`flex items-center gap-1 text-xs font-medium ${
                    isDone
                      ? "text-emerald-600"
                      : needsApproval
                        ? "text-amber-600"
                        : "text-muted-foreground"
                  }`}
                >
                  {ms.status === "COMPLETED" ? (
                    <Clock className="size-3" />
                  ) : isDone ? (
                    <CheckCircle className="size-3" />
                  ) : null}
                  {STATUS_LABELS[ms.status] ?? ms.status}
                </span>

                {needsApproval && (
                  <Button
                    onClick={() => handleApprove(ms.id)}
                    disabled={approving === ms.id}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {approving === ms.id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <CheckCircle className="size-3.5" />
                    )}
                    Approve & Release
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 text-center text-xs text-muted-foreground">
        <p>
          Powered by <span className="font-medium text-foreground">TrustPoint</span>
        </p>
        <p className="mt-1">Funds held in escrow. Only released when you approve.</p>
      </div>
    </div>
  );
}

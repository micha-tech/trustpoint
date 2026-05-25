"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  ArrowLeft,
  Copy,
  Check,
  Link2,
  Wallet,
  Landmark,
  ArrowUpRight,
  Loader2,
} from "lucide-react";

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
  DRAFT: "bg-muted text-muted-foreground",
  PENDING_PAYMENT: "bg-amber-50 text-amber-700",
  ACTIVE: "bg-blue-50 text-blue-700",
  IN_PROGRESS: "bg-indigo-50 text-indigo-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-red-50 text-red-700",
  DISPUTED: "bg-orange-50 text-orange-700",
};

const MS_STYLES: Record<string, { dot: string; border: string; text: string }> = {
  PENDING: { dot: "bg-muted-foreground/30", border: "border-border", text: "text-muted-foreground" },
  IN_PROGRESS: { dot: "bg-brand-500", border: "border-brand-300 bg-brand-50/30", text: "text-brand-600" },
  COMPLETED: { dot: "bg-amber-400", border: "border-amber-300 bg-amber-50/30", text: "text-amber-600" },
  APPROVED: { dot: "bg-emerald-400", border: "border-emerald-300 bg-emerald-50/30", text: "text-emerald-600" },
  RELEASED: { dot: "bg-emerald-500", border: "border-emerald-400 bg-emerald-50/50", text: "text-emerald-700" },
  DISPUTED: { dot: "bg-orange-500", border: "border-orange-300 bg-orange-50/30", text: "text-orange-600" },
};

function JobDetail() {
  const { id } = useParams<{ id: string }>();
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
    try {
      const res = await fetch("/api/milestones", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ milestoneId, status: "COMPLETED" }),
      });
      if (!res.ok) throw new Error();
      toast.success("Milestone marked as complete");
      loadJob();
    } catch {
      toast.error("Could not update milestone");
    }
  };

  const copyLink = () => {
    if (job?.clientUrl) {
      navigator.clipboard.writeText(job.clientUrl);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <p className="text-muted-foreground">Job not found</p>
      </div>
    );
  }

  const escrowProgress = job.escrow && job.escrow.totalAmount > 0
    ? (job.escrow.releasedAmount / job.escrow.totalAmount) * 100
    : 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6">
        <Link
          href="/artisan/dashboard"
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Dashboard
        </Link>
      </div>

      <div className="mb-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-bold text-foreground">{job.title}</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">{job.ref}</p>
          </div>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[job.status] ?? "bg-muted text-muted-foreground"}`}
          >
            {job.status.replace("_", " ")}
          </span>
        </div>
        {job.description && (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{job.description}</p>
        )}
      </div>

      {job.clientUrl && job.status === "PENDING_PAYMENT" && (
        <Card className="mb-5 border-brand-200 bg-brand-50 sm:mb-6">
          <CardContent className="p-4 sm:p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-brand-800">
              <Link2 className="size-4" />
              Share this link with your client
            </h3>
            <div className="flex items-center gap-2 overflow-hidden rounded-lg border border-brand-200 bg-background pl-3 pr-1">
              <span className="min-w-0 flex-1 truncate py-2 text-xs text-muted-foreground">{job.clientUrl}</span>
              <Button onClick={copyLink} size="sm" className="shrink-0">
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {(job.paymentReferences?.length > 0 || job.virtualAccount) && (
        <div className="mb-6 space-y-3">
          {job.virtualAccount && (
            <Card>
              <CardContent className="p-5">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
                  <Landmark className="size-4" />
                  Bank Transfer Details
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bank</span>
                    <span className="font-medium text-foreground">{job.virtualAccount.bankName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Account Number</span>
                    <span className="font-mono font-bold text-foreground">{job.virtualAccount.accountNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Account Name</span>
                    <span className="font-medium text-foreground">{job.virtualAccount.accountName}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {job.paymentReferences.map((pr) => (
            <Card key={pr.reference}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-xs text-muted-foreground">Payment Reference</p>
                  <p className="font-mono text-sm font-medium text-foreground">{pr.reference}</p>
                </div>
                <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-600">
                  {pr.status}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {job.escrow && (
        <Card className="mb-6">
          <CardContent className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <Wallet className="size-4" />
              </div>
              <span className="text-sm font-medium text-foreground">Escrow</span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="font-semibold text-foreground">
                  ₦{(job.escrow.totalAmount / 100).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Released</p>
                <p className="font-semibold text-emerald-600">
                  ₦{(job.escrow.releasedAmount / 100).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="font-semibold text-brand-600">
                  ₦{(job.escrow.pendingAmount / 100).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-brand-500 transition-all duration-500"
                style={{ width: `${escrowProgress}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mb-6">
        <h2 className="mb-3 text-sm font-medium text-foreground">Milestones</h2>
        <div className="space-y-2">
          {job.milestones.map((ms) => {
            const s = MS_STYLES[ms.status] ?? MS_STYLES.PENDING;
            return (
              <div key={ms.id} className={`rounded-xl border p-4 transition-all ${s.border}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className={`size-2 shrink-0 rounded-full ${s.dot}`} />
                      <span className="text-sm font-medium text-foreground">{ms.title}</span>
                    </div>
                    {ms.description && (
                      <p className="mt-1 text-xs text-muted-foreground ml-4">{ms.description}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm font-semibold text-foreground">
                      ₦{(ms.amount / 100).toLocaleString()}
                    </span>
                    {ms.status === "IN_PROGRESS" && (
                      <Button
                        onClick={() => handleMilestoneComplete(ms.id)}
                        size="sm"
                      >
                        <ArrowUpRight className="size-3.5" />
                        Complete
                      </Button>
                    )}
                  </div>
                </div>
                <span className={`mt-2 inline-block text-xs font-medium ${s.text}`}>
                  {ms.status === "COMPLETED" ? "Awaiting client approval" : ms.status.replace("_", " ")}
                </span>
              </div>
            );
          })}
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

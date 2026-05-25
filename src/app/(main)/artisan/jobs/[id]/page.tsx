"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  ArrowLeft,
  Copy,
  Check,
  Link2,
  Landmark,
  CheckCircle2,
  Clock,
  Wallet,
  Loader2,
  Shield,
  MessageCircle,
} from "lucide-react";

type EscrowState = {
  status: string;
  totalAmount: number;
  releasedAmount: number;
  pendingAmount: number;
};

type Dispute = {
  id: string;
  reason: string;
  status: string;
  createdAt: string;
};

type Job = {
  id: string;
  title: string;
  ref: string;
  description: string | null;
  amount: number;
  fee: number;
  status: string;
  expectedCompletionDate: string | null;
  completedAt: string | null;
  approvedAt: string | null;
  escrow: EscrowState | null;
  clientUrl: string;
  virtualAccount: { bankName: string; accountNumber: string; accountName: string } | null;
  paymentReferences: { reference: string; status: string }[];
  disputes: Dispute[];
};

function getStatusLabel(job: Job): string {
  if (job.status === "COMPLETED") {
    return job.approvedAt ? "Released" : "Awaiting client approval";
  }
  const labels: Record<string, string> = {
    DRAFT: "Draft",
    PENDING_PAYMENT: "Awaiting Payment",
    ACTIVE: "Active",
    IN_PROGRESS: "In Progress",
    CANCELLED: "Cancelled",
    DISPUTED: "Under Review",
  };
  return labels[job.status] ?? job.status.replace("_", " ");
}

function getStatusStyle(job: Job): string {
  if (job.status === "COMPLETED") {
    return job.approvedAt ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700";
  }
  const styles: Record<string, string> = {
    DRAFT: "bg-muted text-muted-foreground",
    PENDING_PAYMENT: "bg-amber-50 text-amber-700",
    ACTIVE: "bg-blue-50 text-blue-700",
    IN_PROGRESS: "bg-indigo-50 text-indigo-700",
    CANCELLED: "bg-red-50 text-red-700",
    DISPUTED: "bg-orange-50 text-orange-700",
  };
  return styles[job.status] ?? "bg-muted text-muted-foreground";
}

function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadJob = useCallback(async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/jobs/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setJob(res.ok ? await res.json() : null);
    } catch {
      setJob(null);
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    loadJob();
  }, [loadJob]);

  const copyLink = () => {
    if (job?.clientUrl) {
      navigator.clipboard.writeText(job.clientUrl);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareWhatsApp = () => {
    if (job?.clientUrl) {
      const text = encodeURIComponent(
        `Hi! Use this link to make a secure payment for "${job.title}": ${job.clientUrl}`
      );
      window.open(`https://wa.me/?text=${text}`, "_blank");
    }
  };

  const handleMarkComplete = async () => {
    if (!user) return;
    if (!window.confirm("Have you finished this job? This will notify your client.")) return;
    setCompleting(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/jobs/${id}/complete`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed");
      }
      toast.success("Job marked as complete. Client notified.");
      loadJob();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Could not update");
    } finally {
      setCompleting(false);
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

  const escrowProgress =
    job.escrow && job.escrow.totalAmount > 0
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
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${getStatusStyle(job)}`}
          >
            {getStatusLabel(job)}
          </span>
        </div>
        {job.description && (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {job.description}
          </p>
        )}
        {job.expectedCompletionDate && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3" />
            Expected by{" "}
            {new Date(job.expectedCompletionDate).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        )}
      </div>

      {/* Workflow 3: Link generated — share with client */}
      {job.clientUrl && job.status === "PENDING_PAYMENT" && (
        <Card className="mb-5 border-brand-200 bg-brand-50 sm:mb-6">
          <CardContent className="p-4 sm:p-5">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="size-4" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-brand-900">
                  Your protected payment link is ready
                </h3>
                <p className="text-xs text-brand-700">
                  Share this link with your client to receive secure payment.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-hidden rounded-lg border border-brand-200 bg-background pl-3 pr-1">
              <Link2 className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate py-2 text-xs text-muted-foreground">
                {job.clientUrl}
              </span>
              <Button onClick={copyLink} size="sm" className="shrink-0">
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>

            <Button
              onClick={shareWhatsApp}
              variant="outline"
              className="mt-3 w-full"
            >
              <MessageCircle className="size-4 text-emerald-600" />
              Share via WhatsApp
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Workflow 6: Payment verified — artisan can start */}
      {(job.status === "ACTIVE" || job.status === "IN_PROGRESS") && (
        <Card className="mb-5 border-emerald-200 bg-emerald-50 sm:mb-6">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <Shield className="size-4" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-emerald-900">
                  Payment verified
                </h3>
                <p className="text-xs text-emerald-700">
                  You can now begin work on this job.
                </p>
              </div>
            </div>

            <Button
              onClick={handleMarkComplete}
              disabled={completing}
              className="mt-3 w-full"
            >
              {completing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CheckCircle2 className="size-4" />
              )}
              Mark Work as Completed
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Workflow 8: Release success */}
      {job.status === "COMPLETED" && job.approvedAt && (
        <Card className="mb-5 border-emerald-200 bg-emerald-50 sm:mb-6">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <div className="flex size-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="size-5" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-emerald-900">
                  Your payout is on the way
                </h3>
                <p className="text-xs text-emerald-700">
                  Client approved and payment has been released.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dispute state */}
      {job.status === "DISPUTED" && (
        <Card className="mb-5 border-orange-200 bg-orange-50 sm:mb-6">
          <CardContent className="p-4 sm:p-5">
            <h3 className="text-sm font-medium text-orange-900">
              This job has been placed under review
            </h3>
            <p className="mt-1 text-xs text-orange-700">
              TrustPoint will review the issue before payment is released.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Escrow */}
      {job.escrow && (
        <Card className="mb-6">
          <CardContent className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <Wallet className="size-4" />
              </div>
              <span className="text-sm font-medium text-foreground">Payment</span>
              {job.escrow.status === "FUNDED" && (
                <span className="ml-auto rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                  Secured
                </span>
              )}
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-foreground">
                ₦{((job.amount + job.fee) / 100).toLocaleString()}
              </span>
              {job.escrow.releasedAmount > 0 && (
                <span className="text-sm text-emerald-600">
                  ₦{(job.escrow.releasedAmount / 100).toLocaleString()} released
                </span>
              )}
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

      {/* Bank details */}
      {job.virtualAccount && (
        <Card className="mb-6">
          <CardContent className="p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
              <Landmark className="size-4" />
              Payment Instructions
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bank</span>
                <span className="font-medium text-foreground">
                  {job.virtualAccount.bankName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Account Number</span>
                <span className="font-mono font-bold text-foreground">
                  {job.virtualAccount.accountNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Account Name</span>
                <span className="font-medium text-foreground">
                  {job.virtualAccount.accountName}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
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

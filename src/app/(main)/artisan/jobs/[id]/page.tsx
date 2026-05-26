"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
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
  RefreshCcw,
  AlertTriangle,
  Mail,
  X,
} from "lucide-react";
import { getStatusLabel, getStatusStyle } from "@/lib/job-status";

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
  clientEmail: string | null;
  expectedCompletionDate: string | null;
  completedAt: string | null;
  approvedAt: string | null;
  escrow: EscrowState | null;
  clientUrl: string;
  virtualAccount: { bankName: string; accountNumber: string; accountName: string } | null;
  paymentReferences: { reference: string; status: string }[];
  disputes: Dispute[];
};

function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  const loadJob = useCallback(async () => {
    if (!user) return;
    setFetchError(false);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/jobs/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { setJob(await res.json()); setError(false); }
      else if (res.status === 404) { setJob(null); setError(false); }
      else { setFetchError(true); }
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    loadJob();
  }, [loadJob]);

  const pollRef = useRef<ReturnType<typeof setInterval>>(undefined);
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    const shouldPoll = job && job.status === "COMPLETED" && !job.approvedAt;
    if (shouldPoll) {
      pollRef.current = setInterval(loadJob, 5000);
    } else {
      pollRef.current = undefined;
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [job?.status, job?.approvedAt, loadJob]);

  const formattedCompletionDate = useMemo(
    () => job?.expectedCompletionDate
      ? new Date(job.expectedCompletionDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
      : null,
    [job?.expectedCompletionDate]
  );
  const formattedTotal = useMemo(
    () => job ? `₦${((job.amount + job.fee) / 100).toLocaleString()}` : "",
    [job?.amount, job?.fee]
  );
  const formattedAmount = useMemo(
    () => job ? `₦${(job.amount / 100).toLocaleString()}` : "",
    [job?.amount]
  );
  const formattedFee = useMemo(
    () => job ? `₦${(job.fee / 100).toLocaleString()}` : "",
    [job?.fee]
  );
  const progressPercent = useMemo(
    () => job?.escrow && job.escrow.totalAmount > 0
      ? (job.escrow.releasedAmount / job.escrow.totalAmount) * 100
      : 0,
    [job?.escrow?.releasedAmount, job?.escrow?.totalAmount]
  );
  const releasedAmount = useMemo(
    () => job?.escrow && job.escrow.releasedAmount > 0
      ? `₦${(job.escrow.releasedAmount / 100).toLocaleString()} released`
      : null,
    [job?.escrow?.releasedAmount]
  );

  const copyLink = async () => {
    if (!job?.clientUrl) return;
    try {
      await navigator.clipboard.writeText(job.clientUrl);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link");
    }
  };

  const shareWhatsApp = () => {
    if (job?.clientUrl) {
      const text = encodeURIComponent(
        `Hi! Use this link to make a secure payment for "${job.title}": ${job.clientUrl}`
      );
      window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
    }
  };

  const handleMarkComplete = async () => {
    if (!user) return;
    setShowConfirm(false);
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
      toast.success("Work submitted. Your client has been notified.");
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

  if (fetchError) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-3 px-4">
        <p className="text-sm text-muted-foreground">Unable to load job. Check your connection.</p>
        <Button variant="outline" onClick={loadJob}>
          <RefreshCcw className="size-4" />
          Try Again
        </Button>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-3 px-4">
        <p className="text-sm text-muted-foreground">Job not found.</p>
        <Link href="/artisan/dashboard">
          <Button variant="outline">
            <ArrowLeft className="size-4" />
            Back to Your Jobs
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6">
        <Link
          href="/artisan/dashboard"
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Your Jobs
        </Link>
      </div>

      <div className="mb-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-bold text-foreground">{job.title}</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">{job.ref}</p>
          </div>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${getStatusStyle(job.status, job.approvedAt)}`}
          >
            {getStatusLabel(job.status, job.approvedAt)}
          </span>
        </div>
        {job.description && (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {job.description}
          </p>
        )}
        {job.clientEmail && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Mail className="size-3" />
            Client email: {job.clientEmail}
          </p>
        )}
        {job.expectedCompletionDate && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3" />
            Expected by{" "}
            {formattedCompletionDate}
          </p>
        )}
        {/* Polling indicator */}
        {pollRef.current && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600">
            <Loader2 className="size-3 animate-spin" />
              Checking for updates
          </div>
        )}
      </div>

      {/* Link ready — share with client */}
      {job.clientUrl && job.status === "PENDING_PAYMENT" && (
        <Card className="mb-5 border-brand-200 bg-brand-50 sm:mb-6">
          <CardContent className="p-4 sm:p-5">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="size-4" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-brand-900">
                  Payment link ready
                </h3>
                <p className="text-xs text-brand-700">
                  Share this link with your client to receive payment.
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

            <Button onClick={shareWhatsApp} variant="outline" className="mt-3 w-full">
              <MessageCircle className="size-4 text-emerald-600" />
              Share via WhatsApp
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Payment verified — artisan can start */}
      {(job.status === "ACTIVE" || job.status === "IN_PROGRESS") && (
        <Card className="mb-5 border-emerald-200 bg-emerald-50 sm:mb-6">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <Shield className="size-4" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-emerald-900">
                  Payment secured
                </h3>
                <p className="text-xs text-emerald-700">
                  You can now begin work.
                </p>
              </div>
            </div>

            <Button onClick={() => setShowConfirm(true)} className="mt-3 w-full">
              <CheckCircle2 className="size-4" />
              Work is done
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Custom confirm dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <Card className="w-full max-w-sm">
            <CardContent className="p-5">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                    <AlertTriangle className="size-4" />
                  </div>
                  <h3 className="text-sm font-medium text-foreground">Confirm completion</h3>
                </div>
                <button onClick={() => setShowConfirm(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="size-4" />
                </button>
              </div>
              <p className="mb-5 text-sm text-muted-foreground">
                Have you finished the work? This lets your client know and they can release the payment.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowConfirm(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleMarkComplete} disabled={completing} className="flex-1">
                  {completing ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                  Confirm
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Release success */}
      {job.status === "COMPLETED" && job.approvedAt && (
        <Card className="mb-5 border-emerald-200 bg-emerald-50 sm:mb-6">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <div className="flex size-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="size-5" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-emerald-900">
                  Payment released
                </h3>
                <p className="text-xs text-emerald-700">
                  All settled. Well done.
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
              This project has been placed under review
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
                {formattedTotal}
              </span>
              {job.escrow.releasedAmount > 0 && (
                <span className="text-sm text-emerald-600">
                  {releasedAmount}
                </span>
              )}
            </div>
            {/* Fee breakdown */}
            <div className="mt-2 space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Job amount</span>
                <span>{formattedAmount}</span>
              </div>
              <div className="flex justify-between">
                <span>Platform fee (5%)</span>
                <span>{formattedFee}</span>
              </div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-brand-500 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
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

      {/* Payment references */}
      {job.paymentReferences && job.paymentReferences.length > 0 && (
        <Card className="mb-6">
          <CardContent className="p-5">
            <h3 className="mb-3 text-sm font-medium text-foreground">Payment History</h3>
            <div className="space-y-2 text-sm">
              {job.paymentReferences.map((pr) => (
                <div key={pr.reference} className="flex items-center justify-between">
                  <span className="font-mono text-xs text-muted-foreground">{pr.reference}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    pr.status === "success" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                  }`}>
                    {pr.status}
                  </span>
                </div>
              ))}
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

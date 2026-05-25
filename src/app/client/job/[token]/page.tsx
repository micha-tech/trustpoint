"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Shield,
  CheckCircle2,
  Lock,
  Clock,
  Loader2,
  AlertTriangle,
} from "lucide-react";

type EscrowState = {
  status: string;
  totalAmount: number;
  releasedAmount: number;
  pendingAmount: number;
};

type ClientJob = {
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
  artisan: { name: string | null; phone: string | null };
  escrow: EscrowState | null;
  createdAt: string;
};

type ViewState = "payment" | "success" | "approval" | "released" | "dispute" | "error";

export default function ClientJobPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<ClientJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [submittingDispute, setSubmittingDispute] = useState(false);
  const [showDisputeForm, setShowDisputeForm] = useState(false);

  const loadJob = useCallback(() => {
    fetch(`/api/jobs/client/${token}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("reference") || params.get("trxref");
    if (ref) {
      fetch(`/api/payments/${ref}/verify`, { method: "POST" })
        .then((r) => { if (r.ok) toast.success("Payment verified"); })
        .catch(() => {})
        .finally(() => loadJob());
      return;
    }
    loadJob();
  }, [loadJob]);

  // Poll every 5s while waiting for artisan to mark complete
  const pollRef = useRef<ReturnType<typeof setInterval>>(undefined);
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (data && (data.status === "ACTIVE" || data.status === "IN_PROGRESS")) {
      pollRef.current = setInterval(loadJob, 5000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [data?.status, loadJob]);

  const getViewState = (): ViewState => {
    if (!data) return "error";
    if (data.status === "PENDING_PAYMENT") return "payment";
    if (data.status === "COMPLETED" && data.approvedAt) return "released";
    if (data.status === "COMPLETED" && !data.approvedAt) return "approval";
    if (data.status === "DISPUTED") return "dispute";
    if (data.escrow?.status === "FUNDED") return "success";
    if (data.status === "ACTIVE" || data.status === "IN_PROGRESS") return "success";
    return "payment";
  };

  const handleApprove = async () => {
    setApproving(true);
    try {
      const res = await fetch(`/api/jobs/client/${token}/approve`, {
        method: "POST",
      });
      if (res.ok) {
        toast.success("Payment released successfully");
        loadJob();
      } else {
        const err = await res.json();
        toast.error(err.error ?? "Could not approve");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setApproving(false);
    }
  };

  const handleDispute = async () => {
    if (!disputeReason.trim()) return;
    setSubmittingDispute(true);
    try {
      const res = await fetch(`/api/jobs/client/${token}/dispute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: disputeReason.trim() }),
      });
      if (res.ok) {
        toast.success("Issue submitted. TrustPoint will review.");
        loadJob();
      } else {
        const err = await res.json();
        toast.error(err.error ?? "Could not submit");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmittingDispute(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3">
        <Loader2 className="size-6 animate-spin text-brand-500" />
        <p className="text-sm text-muted-foreground">Verifying payment...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <AlertTriangle className="size-6" />
          </div>
          <h1 className="text-lg font-bold text-foreground">Link not valid</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This payment link may have expired or is invalid. Ask the artisan to share a new link.
          </p>
        </div>
      </div>
    );
  }

  const viewState = getViewState();

  return (
    <div className="mx-auto min-h-screen max-w-lg px-4 py-6">
      <div className="mb-6 text-center">
        <Link href="/" className="inline-block transition-opacity hover:opacity-80">
          <img src="/logo.png" alt="TrustPoint" className="mx-auto h-12 w-auto sm:h-14" />
        </Link>
      </div>

      {/* Trust Banner */}
      {viewState !== "dispute" && viewState !== "error" && (
        <div className="mb-4 rounded-xl bg-brand-50 p-3 text-center text-xs text-brand-700">
          <Shield className="mx-auto mb-1 size-4" />
          Your payment will only be released when work is confirmed.
        </div>
      )}

      {/* Job Card */}
      <Card className="mb-4">
        <CardContent className="p-5">
          <p className="mb-1 text-xs text-muted-foreground">{data.ref}</p>
          <h1 className="text-lg font-bold text-foreground">{data.title}</h1>
          {data.description && (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {data.description}
            </p>
          )}
          <div className="mt-4 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Artisan</span>
              <span className="font-medium text-foreground">
                {data.artisan?.name ?? "Assigned"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-semibold text-foreground">
                ₦{((data.amount + data.fee) / 100).toLocaleString()}
              </span>
            </div>
            {data.expectedCompletionDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Completion</span>
                <span className="text-foreground">
                  {new Date(data.expectedCompletionDate).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* View: Payment */}
      {viewState === "payment" && (
        <>
          <Card className="mb-4 border-brand-200">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-700">
                  Awaiting Payment
                </span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                TrustPoint securely holds payment until the job is approved.
              </p>
              <Button className="w-full" asChild>
                <a
                  href={`/api/payments/${data.ref}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Lock className="size-4" />
                  Fund Protected Payment
                </a>
              </Button>
            </CardContent>
          </Card>
          <p className="text-center text-xs text-muted-foreground">
            TrustPoint securely holds payment until the job is approved.
          </p>
        </>
      )}

      {/* View: Payment Success / Funded */}
      {viewState === "success" && (
        <Card className="mb-4 border-emerald-200 bg-emerald-50">
          <CardContent className="space-y-3 p-5 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Shield className="size-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-emerald-900">
                Your payment is now secured
              </h2>
              <p className="mt-1 text-sm text-emerald-700">
                The artisan has been notified and can begin work.
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-200/50 px-3 py-1 text-xs font-medium text-emerald-800">
              <CheckCircle2 className="size-3" />
              Protected by TrustPoint
            </div>
          </CardContent>
        </Card>
      )}

      {/* View: Client Approval */}
      {viewState === "approval" && (
        <Card className="mb-4 border-amber-200 bg-amber-50">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <Clock className="size-4" />
              </div>
              <div>
                <h2 className="text-sm font-medium text-amber-900">
                  The artisan has marked this job as completed
                </h2>
                <p className="text-xs text-amber-700">
                  Review the work before releasing payment.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                onClick={handleApprove}
                disabled={approving}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {approving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-4" />
                )}
                Approve & Release Payment
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDisputeForm(true)}
                className="text-destructive border-destructive/30 hover:bg-destructive/5"
              >
                <AlertTriangle className="size-4" />
                Report an Issue
              </Button>
            </div>

            {showDisputeForm && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="dispute-reason">Briefly describe the issue</Label>
                  <textarea
                    id="dispute-reason"
                    rows={3}
                    maxLength={500}
                    placeholder="Briefly describe the issue."
                    className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleDispute}
                    disabled={submittingDispute || !disputeReason.trim()}
                    className="flex-1"
                  >
                    {submittingDispute ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <AlertTriangle className="size-4" />
                    )}
                    Submit Issue
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => { setShowDisputeForm(false); setDisputeReason(""); }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* View: Released */}
      {viewState === "released" && (
        <Card className="mb-4 border-emerald-200 bg-emerald-50">
          <CardContent className="space-y-3 p-5 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="size-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-emerald-900">
                Payment released successfully
              </h2>
              <p className="mt-1 text-sm text-emerald-700">
                The artisan has been notified.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* View: Dispute */}
      {viewState === "dispute" && (
        <Card className="mb-4 border-orange-200">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                <AlertTriangle className="size-4" />
              </div>
              <div>
                <h2 className="text-sm font-medium text-orange-900">
                  This job has been placed under review
                </h2>
                <p className="text-xs text-orange-700">
                  TrustPoint will review the issue before payment is released.
                </p>
              </div>
            </div>

            {!data.approvedAt && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="dispute-reason">Briefly describe the issue</Label>
                  <textarea
                    id="dispute-reason"
                    rows={3}
                    maxLength={500}
                    placeholder="Briefly describe the issue."
                    className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleDispute}
                  disabled={submittingDispute || !disputeReason.trim()}
                  className="w-full"
                >
                  {submittingDispute ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <AlertTriangle className="size-4" />
                  )}
                  Submit Issue
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <div className="mt-8 text-center text-xs text-muted-foreground">
        <p>
          Powered by{" "}
          <span className="font-medium text-foreground">TrustPoint</span>
        </p>
        <p className="mt-1">
          Funds held in escrow. Only released when you approve.
        </p>
      </div>
    </div>
  );
}

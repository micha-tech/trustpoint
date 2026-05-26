"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Shield,
  CheckCircle2,
  Lock,
  Clock,
  Loader2,
  AlertTriangle,
  X,
  Mail,
  KeyRound,
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
  clientEmailSet: boolean;
  expectedCompletionDate: string | null;
  completedAt: string | null;
  approvedAt: string | null;
  artisan: { name: string | null; phone: string | null };
  escrow: EscrowState | null;
  createdAt: string;
};

type ViewState =
  | "loading"
  | "link-invalid"
  | "no-email-on-file"
  | "verify-email"
  | "verify-code"
  | "verified";

const STORAGE_KEY_PREFIX = "tp_verified_";

export default function ClientJobPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<ClientJob | null>(null);
  const [viewState, setViewState] = useState<ViewState>("loading");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [approving, setApproving] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [submittingDispute, setSubmittingDispute] = useState(false);
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [showDisputeConfirm, setShowDisputeConfirm] = useState(false);

  const loadJob = useCallback(async () => {
    try {
      const res = await fetch(`/api/jobs/client/${token}`);
      if (!res.ok) { setViewState("link-invalid"); return; }
      const job: ClientJob = await res.json();
      setData(job);

      const verifiedKey = `${STORAGE_KEY_PREFIX}${token}`;
      const alreadyVerified = sessionStorage.getItem(verifiedKey);

      if (alreadyVerified) {
        setViewState("verified");
      } else if (!job.clientEmailSet) {
        setViewState("no-email-on-file");
      } else {
        setViewState("verify-email");
      }
    } catch {
      setViewState("link-invalid");
    }
  }, [token]);

  useEffect(() => { loadJob(); }, [loadJob]);

  const handleSendCode = async () => {
    if (!email.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/jobs/client/${token}/send-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const body = await res.json();
      if (res.ok) {
        toast.success("Code sent. Check your inbox.");
        setViewState("verify-code");
      } else {
        toast.error(body.error ?? "Could not send code.");
      }
    } catch {
      toast.error("Could not send code. Try again.");
    } finally {
      setSending(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code.trim() || code.length < 6) return;
    setVerifying(true);
    try {
      const res = await fetch(`/api/jobs/client/${token}/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: code.trim() }),
      });
      const body = await res.json();
      if (res.ok && body.verified) {
        sessionStorage.setItem(`${STORAGE_KEY_PREFIX}${token}`, "1");
        setData(body.job);
        toast.success("Email verified");
        setViewState("verified");
      } else {
        toast.error(body.error ?? "Invalid code.");
      }
    } catch {
      toast.error("Could not verify code. Try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleApprove = async () => {
    setApproving(true);
    try {
      const res = await fetch(`/api/jobs/client/${token}/approve`, { method: "POST" });
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

  const confirmDispute = async () => {
    setShowDisputeConfirm(false);
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
        setShowDisputeForm(false);
        setDisputeReason("");
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

  const getJobViewState = (): "payment" | "success" | "approval" | "released" | "dispute" | "error" => {
    if (!data) return "error";
    if (data.status === "PENDING_PAYMENT") return "payment";
    if (data.status === "COMPLETED" && data.approvedAt) return "released";
    if (data.status === "COMPLETED" && !data.approvedAt) return "approval";
    if (data.status === "DISPUTED") return "dispute";
    if (data.escrow?.status === "FUNDED") return "success";
    if (data.status === "ACTIVE" || data.status === "IN_PROGRESS") return "success";
    return "payment";
  };

  const jobViewState = useMemo(getJobViewState, [data]);

  const formattedAmount = useMemo(
    () => data ? `₦${((data.amount + data.fee) / 100).toLocaleString()}` : "",
    [data?.amount, data?.fee]
  );
  const formattedDate = useMemo(
    () => data?.expectedCompletionDate
      ? new Date(data.expectedCompletionDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
      : null,
    [data?.expectedCompletionDate]
  );

  const pollRef = useRef<ReturnType<typeof setInterval>>(undefined);
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (data && (data.status === "ACTIVE" || data.status === "IN_PROGRESS")) {
      pollRef.current = setInterval(loadJob, 5000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [data?.status, loadJob]);

  return (
    <div className="mx-auto min-h-screen max-w-lg px-4 py-6">
      <div className="mb-6 text-center">
        <Link href="/" className="inline-block transition-opacity hover:opacity-80">
          <Image src="/logo.png" alt="TrustPoint" width={96} height={48} className="mx-auto h-12 w-auto sm:h-14" priority />
        </Link>
      </div>

      {viewState === "loading" && (
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <Loader2 className="size-6 animate-spin text-brand-500" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      )}

      {viewState === "link-invalid" && (
        <div className="flex items-center justify-center px-4 py-20">
          <div className="max-w-sm text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <AlertTriangle className="size-6" />
            </div>
            <h1 className="text-lg font-bold text-foreground">Link not valid</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This payment link may have expired or is invalid. Ask the artisan to share a new link.
            </p>
            <Button variant="outline" className="mt-4" onClick={loadJob}>
              Try Again
            </Button>
          </div>
        </div>
      )}

      {viewState === "no-email-on-file" && (
        <div className="flex items-center justify-center px-4 py-20">
          <div className="max-w-sm text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <AlertTriangle className="size-6" />
            </div>
            <h1 className="text-lg font-bold text-foreground">Verification unavailable</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              The artisan needs to add your email to this project. Ask them to create a new project with your email.
            </p>
          </div>
        </div>
      )}

      {viewState === "verify-email" && data && (
        <Card className="mb-4">
          <CardContent className="p-5 text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Mail className="size-6" />
            </div>
            <h1 className="text-lg font-bold text-foreground">Verify your email</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter the email the artisan used to create this project. A code will be sent to verify your identity.
            </p>
            {data && (
              <div className="mt-4 rounded-lg bg-muted p-3 text-left text-sm">
                <p className="font-medium text-foreground">{data.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  by {data.artisan?.name ?? "Your artisan"}
                </p>
              </div>
            )}
            <div className="mt-5 space-y-3 text-left">
              <Label htmlFor="verify-email">Email address</Label>
              <Input
                id="verify-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
              <Button
                onClick={handleSendCode}
                disabled={sending || !email.trim()}
                className="w-full"
              >
                {sending ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
                Send verification code
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {viewState === "verify-code" && (
        <Card className="mb-4">
          <CardContent className="p-5 text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <KeyRound className="size-6" />
            </div>
            <h1 className="text-lg font-bold text-foreground">Check your inbox</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>. It expires in 15 minutes.
            </p>
            <div className="mt-5 space-y-3 text-left">
              <Label htmlFor="verify-code">Verification code</Label>
              <Input
                id="verify-code"
                type="text"
                inputMode="numeric"
                placeholder="000000"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="text-center text-lg tracking-[0.5em]"
              />
              <Button
                onClick={handleVerifyCode}
                disabled={verifying || code.length < 6}
                className="w-full"
              >
                {verifying ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
                Verify
              </Button>
              <div className="flex justify-center gap-2 text-xs text-muted-foreground">
                <span>Didn&apos;t receive it?</span>
                <button
                  onClick={handleSendCode}
                  disabled={sending}
                  className="font-medium text-brand-600 hover:text-brand-700"
                >
                  {sending ? "Sending..." : "Send again"}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {viewState === "verified" && data && (
        <>
          {jobViewState !== "dispute" && jobViewState !== "error" && (
            <div className="mb-4 rounded-xl bg-brand-50 p-3 text-center text-xs text-brand-700">
              <Shield className="mx-auto mb-1 size-4" />
              Your payment will only be released when work is confirmed.
            </div>
          )}

          {pollRef.current && (
            <div className="mb-4 flex items-center justify-center gap-1.5 text-xs text-amber-600">
              <Loader2 className="size-3 animate-spin" />
              Checking for artisan updates...
            </div>
          )}

          <Card className="mb-4">
            <CardContent className="p-5">
              <p className="mb-1 text-xs text-muted-foreground">{data.ref}</p>
              <h1 className="text-lg font-bold text-foreground">{data.title}</h1>
              {data.description && (
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{data.description}</p>
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
                  <span className="font-semibold text-foreground">{formattedAmount}</span>
                </div>
                {formattedDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Completion</span>
                    <span className="text-foreground">{formattedDate}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {jobViewState === "payment" && (
            <Card className="mb-4 border-brand-200">
              <CardContent className="space-y-4 p-5">
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-700">Awaiting payment</span>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  TrustPoint securely holds payment until the job is approved.
                </p>
                <Button className="w-full" asChild>
                  <a href={`/api/payments/${data.ref}`} target="_blank" rel="noopener noreferrer">
                    <Lock className="size-4" />
                    Pay securely
                  </a>
                </Button>
                <p className="text-xs text-muted-foreground">
                  Opens Paystack in a new tab. If it doesn&apos;t open, check your pop-up blocker.
                </p>
              </CardContent>
            </Card>
          )}

          {jobViewState === "success" && (
            <Card className="mb-4 border-emerald-200 bg-emerald-50">
              <CardContent className="space-y-3 p-5 text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <Shield className="size-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-emerald-900">Payment secured</h2>
                  <p className="mt-1 text-sm text-emerald-700">
                    You&apos;re all set. The artisan has been notified.
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-200/50 px-3 py-1 text-xs font-medium text-emerald-800">
                  <CheckCircle2 className="size-3" />
                  Protected by TrustPoint
                </div>
              </CardContent>
            </Card>
          )}

          {jobViewState === "approval" && (
            <Card className="mb-4 border-amber-200 bg-amber-50">
              <CardContent className="space-y-4 p-5">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                    <Clock className="size-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-medium text-amber-900">Work has been submitted</h2>
                    <p className="text-xs text-amber-700">Review the work before releasing payment.</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button onClick={handleApprove} disabled={approving} className="bg-emerald-600 hover:bg-emerald-700">
                    {approving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                    Looks good, pay now
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowDisputeForm(true)}
                    className="text-destructive border-destructive/30 hover:bg-destructive/5"
                    aria-expanded={showDisputeForm}
                    aria-controls="approval-dispute-form"
                  >
                    <AlertTriangle className="size-4" />
                    Report an Issue
                  </Button>
                </div>
                {showDisputeForm && (
                  <div id="approval-dispute-form" className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="approval-dispute-reason">Briefly describe the issue</Label>
                      <textarea
                        id="approval-dispute-reason"
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
                        onClick={() => setShowDisputeConfirm(true)}
                        disabled={submittingDispute || !disputeReason.trim()}
                        className="flex-1"
                      >
                        {submittingDispute ? <Loader2 className="size-4 animate-spin" /> : <AlertTriangle className="size-4" />}
                        Submit Issue
                      </Button>
                      <Button variant="outline" onClick={() => { setShowDisputeForm(false); setDisputeReason(""); }}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {showDisputeConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
              <Card className="w-full max-w-sm">
                <CardContent className="p-5">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex size-8 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                        <AlertTriangle className="size-4" />
                      </div>
                      <h3 className="text-sm font-medium text-foreground">Submit issue?</h3>
                    </div>
                    <button onClick={() => setShowDisputeConfirm(false)} className="text-muted-foreground hover:text-foreground">
                      <X className="size-4" />
                    </button>
                  </div>
                  <p className="mb-5 text-sm text-muted-foreground">
                    This will pause the payment process. TrustPoint will review both sides before releasing funds.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowDisputeConfirm(false)} className="flex-1">
                      Cancel
                    </Button>
                    <Button onClick={confirmDispute} disabled={submittingDispute} className="flex-1">
                      {submittingDispute ? <Loader2 className="size-4 animate-spin" /> : "Submit Issue"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {jobViewState === "released" && (
            <Card className="mb-4 border-emerald-200 bg-emerald-50">
              <CardContent className="space-y-3 p-5 text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="size-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-emerald-900">All settled</h2>
                  <p className="mt-1 text-sm text-emerald-700">Payment released. All done.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {jobViewState === "dispute" && (
            <Card className="mb-4 border-orange-200">
              <CardContent className="space-y-4 p-5">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                    <AlertTriangle className="size-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-medium text-orange-900">This job has been placed under review</h2>
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
                      onClick={() => setShowDisputeConfirm(true)}
                      disabled={submittingDispute || !disputeReason.trim()}
                      className="w-full"
                    >
                      {submittingDispute ? <Loader2 className="size-4 animate-spin" /> : <AlertTriangle className="size-4" />}
                      Submit Issue
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="mt-8 text-center text-xs text-muted-foreground">
            <p>Powered by <span className="font-medium text-foreground">TrustPoint</span></p>
            <p className="mt-1">Funds held in escrow. Only released when you approve.</p>
          </div>
        </>
      )}
    </div>
  );
}

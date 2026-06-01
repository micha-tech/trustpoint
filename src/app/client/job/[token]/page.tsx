"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { TrustPointLogo } from "@/components/TrustPointLogo";
import { toast } from "sonner";
import {
  Shield,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Clock,
  Loader2,
  AlertTriangle,
  X,
  Mail,
  KeyRound,
  ListChecks,
  Paperclip,
  Eye,
  Waypoints,
  FileText,
  Search,
  ArrowRight,
  User,
  Calendar,
  Wallet,
} from "lucide-react";
import { getMilestoneLabel, getMilestoneStyle } from "@/lib/job-status";

type EscrowState = {
  status: string;
  totalAmount: number;
  releasedAmount: number;
  pendingAmount: number;
};

type ClientMilestone = {
  id: string;
  title: string;
  amount: number;
  status: string;
  sortOrder: number;
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
  allApprovedAt: string | null;
  provider: { name: string | null; phone: string | null };
  escrow: EscrowState | null;
  milestones: ClientMilestone[];
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
const VERIFICATION_TOKEN_PREFIX = "tp_client_verification_";

function AutoReleaseCountdown({ allApprovedAt }: { allApprovedAt: string }) {
  const APPROVAL_WINDOW_MS = 48 * 60 * 60 * 1000;
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => {
      const elapsed = Date.now() - new Date(allApprovedAt).getTime();
      const left = Math.max(0, APPROVAL_WINDOW_MS - elapsed);
      setRemaining(left);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [allApprovedAt]);

  if (remaining === null) return null;

  if (remaining <= 0) {
    return <p className="text-center text-xs text-blue-700">Auto-releasing soon…</p>;
  }

  const hours = Math.floor(remaining / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  return (
    <p className="text-center text-xs text-blue-700">
      Auto-releases in {hours}h {minutes}m {seconds}s
    </p>
  );
}

export default function ClientJobPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<ClientJob | null>(null);
  const [viewState, setViewState] = useState<ViewState>("loading");
  const [flowStep, setFlowStep] = useState<"intro" | "overview" | "job">("intro");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [approving, setApproving] = useState<string | null>(null);
  const [releasing, setReleasing] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [submittingDispute, setSubmittingDispute] = useState(false);
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [showDisputeConfirm, setShowDisputeConfirm] = useState(false);
  const [paystackRef, setPaystackRef] = useState<string | null>(null);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [clientEvidence, setClientEvidence] = useState<{ id: string; fileName: string; fileType: string; fileSize: number; description: string | null; createdAt: string }[]>([]);

  useEffect(() => {
    if (viewState === "verified") {
      fetch(`/api/jobs/client/${token}/evidence`)
        .then((r) => r.ok ? r.json() : [])
        .then(setClientEvidence)
        .catch(() => {});
    }
  }, [viewState, token]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("reference") || params.get("trxref");
    if (ref) setPaystackRef(ref);
  }, []);

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

  const verifyPayment = useCallback(async (ref: string) => {
    setVerifyingPayment(true);
    try {
      const clientVerification = sessionStorage.getItem(`${VERIFICATION_TOKEN_PREFIX}${token}`);
      const headers: Record<string, string> = {};
      if (clientVerification) headers["x-client-verification"] = clientVerification;
      const res = await fetch(`/api/payments/${ref}/verify`, { method: "POST", headers });
      const body = await res.json();
      if (res.ok) {
        toast.success("Payment confirmed");
        loadJob();
      } else {
        toast.error(body.error ?? "Payment verification failed");
      }
    } catch {
      toast.error("Could not verify payment. The page will update automatically.");
    } finally {
      setVerifyingPayment(false);
    }
  }, [loadJob]);

  useEffect(() => {
    if (paystackRef && viewState === "verified" && data?.status === "PENDING_PAYMENT") {
      verifyPayment(paystackRef);
    }
  }, [paystackRef, viewState, data?.status, verifyPayment]);

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
        sessionStorage.setItem(`${VERIFICATION_TOKEN_PREFIX}${token}`, body.clientVerificationToken);
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

  const handleApproveMilestone = async (milestoneId: string) => {
    setApproving(milestoneId);
    try {
      const clientVerification = sessionStorage.getItem(`${VERIFICATION_TOKEN_PREFIX}${token}`);
      const res = await fetch(`/api/jobs/client/${token}/milestones/${milestoneId}/approve`, {
        method: "POST",
        headers: clientVerification ? { "X-Client-Verification": clientVerification } : {},
      });
      if (res.ok) {
        toast.success("Payment released for this milestone");
        loadJob();
      } else {
        const err = await res.json();
        toast.error(err.error ?? "Could not approve");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setApproving(null);
    }
  };

  const confirmDispute = async () => {
    setShowDisputeConfirm(false);
    if (!disputeReason.trim()) return;
    setSubmittingDispute(true);
    try {
      const res = await fetch(`/api/jobs/client/${token}/dispute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(sessionStorage.getItem(`${VERIFICATION_TOKEN_PREFIX}${token}`)
            ? { "X-Client-Verification": sessionStorage.getItem(`${VERIFICATION_TOKEN_PREFIX}${token}`)! }
            : {}),
        },
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

  const handleReleasePayment = async () => {
    setReleasing(true);
    try {
      const clientVerification = sessionStorage.getItem(`${VERIFICATION_TOKEN_PREFIX}${token}`);
      const res = await fetch(`/api/jobs/client/${token}/release`, {
        method: "POST",
        headers: clientVerification ? { "X-Client-Verification": clientVerification } : {},
      });
      if (res.ok) {
        toast.success("Payment released to the provider");
        loadJob();
      } else {
        const err = await res.json();
        toast.error(err.error ?? "Could not release payment");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setReleasing(false);
    }
  };

  const getJobViewState = useCallback((): "payment" | "success" | "approval" | "ready_to_release" | "released" | "dispute" | "mixed" | "error" => {
    if (!data) return "error";
    if (data.status === "DISPUTED") return "dispute";
    if (data.status === "COMPLETED" && data.approvedAt) return "released";
    const hasCompleted = data.milestones?.some((m) => m.status === "COMPLETED");
    const allReleased = data.milestones?.every((m) => m.status === "RELEASED");
    const allApproved = data.milestones?.every((m) => ["APPROVED", "RELEASED"].includes(m.status));
    if (allReleased) return "released";
    if (allApproved) return "ready_to_release";
    if (hasCompleted) return "approval";
    if (data.escrow?.status === "FUNDED" || data.status === "ACTIVE" || data.status === "IN_PROGRESS") return "success";
    return "payment";
  }, [data]);

  const jobViewState = useMemo(getJobViewState, [getJobViewState]);

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
    } else {
      pollRef.current = undefined;
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [data?.status, loadJob]);

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 py-6 sm:px-6">
      <div className="mb-6 text-center">
        <Link href="/" className="inline-block transition-opacity hover:opacity-80">
          <TrustPointLogo className="mx-auto w-[11.5rem] sm:w-[13rem]" priority sizes="(max-width: 640px) 11.5rem, 13rem" />
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
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <AlertTriangle className="size-6" />
            </div>
            <h1 className="text-lg font-bold text-foreground">Link not valid</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This payment link may have expired or is invalid. Ask the provider to share a new link.
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
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <AlertTriangle className="size-6" />
            </div>
            <h1 className="text-lg font-bold text-foreground">Verification unavailable</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              The provider needs to add your email to this project. Ask them to create a new project with your email.
            </p>
          </div>
        </div>
      )}

      {viewState === "verify-email" && data && (
        <Card className="mb-4">
          <CardContent className="p-5 text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <Mail className="size-6" />
            </div>
            <h1 className="text-lg font-bold text-foreground">Verify your email</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter the email the provider used to create this project. A code will be sent to verify your identity.
            </p>
            {data && (
              <div className="mt-4 rounded-lg bg-muted p-3 text-left text-sm">
                <p className="font-medium text-foreground">{data.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  by {data.provider?.name ?? "Your provider"}
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
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <KeyRound className="size-6" />
            </div>
            <h1 className="text-lg font-bold text-foreground">Check your inbox</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>. It expires in 15 minutes.
            </p>
            <div className="mt-6 space-y-5">
              <label className="block text-center text-sm font-medium text-foreground">
                Enter verification code
              </label>
              <div className="flex items-center justify-center gap-2 sm:gap-3">
                {Array.from({ length: 6 }).map((_, i) => {
                  const digit = code[i] ?? "";
                  return (
                    <input
                      key={i}
                      autoFocus={i === 0}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      autoComplete="one-time-code"
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        if (!val) return;
                        const next = code.slice(0, i) + val + code.slice(i + 1);
                        setCode(next.slice(0, 6));
                        const inputs = (e.target.closest("div")?.querySelectorAll("input") ?? []) as NodeListOf<HTMLInputElement>;
                        if (i < 5 && inputs[i + 1]) inputs[i + 1].focus();
                      }}
                      onKeyDown={(e) => {
                        const inputs = (e.currentTarget.closest("div")?.querySelectorAll("input") ?? []) as NodeListOf<HTMLInputElement>;
                        if (e.key === "Backspace" && !digit && i > 0 && inputs[i - 1]) {
                          inputs[i - 1].focus();
                        }
                      }}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
                        if (pasted.length === 6) {
                          setCode(pasted);
                          const inputs = (e.currentTarget.closest("div")?.querySelectorAll("input") ?? []) as NodeListOf<HTMLInputElement>;
                          if (inputs[5]) inputs[5].focus();
                        }
                      }}
                      className="size-11 rounded-lg border border-input bg-background text-center text-lg font-semibold text-foreground outline-none transition-all duration-150 placeholder:text-muted-foreground/40 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 sm:size-13 sm:text-xl"
                    />
                  );
                })}
              </div>
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
          {flowStep === "intro" && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                  <ShieldCheck className="size-8" />
                </div>
                <h1 className="text-xl font-bold text-foreground">Your payment is protected</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  TrustPoint holds your funds securely and only releases them when you confirm the work is complete.
                </p>
              </div>

              <div className="rounded-xl border bg-card p-4">
                <div className="mb-3 text-center">
                  <p className="text-xs text-muted-foreground">{data.ref}</p>
                  <h2 className="mt-0.5 text-base font-semibold text-foreground">{data.title}</h2>
                  <p className="text-xs text-muted-foreground">
                    by {data.provider?.name ?? "Your provider"}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                    <ShieldCheck className="size-3.5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Funds verified before work begins</p>
                    <p className="text-xs text-muted-foreground">Your payment is securely held until milestones are completed</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                    <Waypoints className="size-3.5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Milestones tracked transparently</p>
                    <p className="text-xs text-muted-foreground">Work is broken into clear phases with defined deliverables</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                    <FileText className="size-3.5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Deliverables recorded</p>
                    <p className="text-xs text-muted-foreground">All completed work and evidence is stored and accessible</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                    <Search className="size-3.5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Disputes documented</p>
                    <p className="text-xs text-muted-foreground">Any issues are formally recorded for fair resolution</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                    <Lock className="size-3.5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Payment released only with your approval</p>
                    <p className="text-xs text-muted-foreground">You approve each milestone before funds are released</p>
                  </div>
                </div>
              </div>

              <Button className="w-full" onClick={() => setFlowStep("overview")}>
                View project details
                <ArrowRight className="size-4" />
              </Button>
            </div>
          )}

          {flowStep === "overview" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFlowStep("intro")}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  &larr; Back
                </button>
              </div>

              <Card>
                <CardContent className="p-5">
                  <p className="mb-1 text-xs text-muted-foreground">{data.ref}</p>
                  <h1 className="text-lg font-bold text-foreground">{data.title}</h1>
                  {data.description && (
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{data.description}</p>
                  )}
                  <div className="mt-4 space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Provider</span>
                      <span className="font-medium text-foreground">
                        {data.provider?.name ?? "Assigned"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total</span>
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

              {data.milestones && data.milestones.length > 0 && (
                <Card>
                  <CardContent className="p-5">
                    <div className="mb-3 flex items-center gap-2">
                      <ListChecks className="size-4 text-brand-600" />
                      <h3 className="text-sm font-medium text-foreground">Milestones</h3>
                    </div>
                    <div className="space-y-2">
                      {data.milestones.map((m) => (
                        <div key={m.id} className="flex items-center justify-between rounded-lg border p-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground">{m.title}</p>
                            <p className="text-xs text-muted-foreground">
                              ₦{(m.amount / 100).toLocaleString()}
                            </p>
                          </div>
                          <span className={`shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${getMilestoneStyle(m.status)}`}>
                            {getMilestoneLabel(m.status)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {jobViewState === "payment" && (
                <Button className="w-full" asChild>
                  <a href={`/api/payments/${data.ref}?token=${token}`}>
                    <Lock className="size-4" />
                    Fund Project Securely
                  </a>
                </Button>
              )}

              {jobViewState !== "payment" && (
                <Button className="w-full" onClick={() => setFlowStep("job")}>
                  {jobViewState === "dispute" ? "View dispute details" : "Continue to project"}
                  <ArrowRight className="size-4" />
                </Button>
              )}
            </div>
          )}

          {flowStep === "job" && (
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
                  Checking for provider updates...
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
                      <span className="text-muted-foreground">Provider</span>
                      <span className="font-medium text-foreground">
                        {data.provider?.name ?? "Assigned"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total</span>
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

              {/* Milestones */}
              {data.milestones && data.milestones.length > 0 && (
                <Card className="mb-4">
                  <CardContent className="p-5">
                    <div className="mb-3 flex items-center gap-2">
                      <ListChecks className="size-4 text-brand-600" />
                      <h3 className="text-sm font-medium text-foreground">Milestones</h3>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {data.milestones.filter((m) => ["APPROVED", "RELEASED"].includes(m.status)).length}/{data.milestones.length} released
                      </span>
                    </div>
                    <div className="space-y-2">
                      {data.milestones.map((m) => {
                        const needsApproval = m.status === "COMPLETED";
                        return (
                          <div
                            key={m.id}
                            className={`rounded-lg border p-3 ${
                              needsApproval ? "border-amber-200 bg-amber-50/50" :
                              m.status === "APPROVED" || m.status === "RELEASED" ? "border-emerald-200 bg-emerald-50/50" :
                              ""
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-foreground">{m.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  ₦{(m.amount / 100).toLocaleString()}
                                </p>
                              </div>
                              <span className={`shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${getMilestoneStyle(m.status)}`}>
                                {getMilestoneLabel(m.status)}
                              </span>
                            </div>
                            {needsApproval && jobViewState !== "dispute" && (
                              <Button
                                onClick={() => handleApproveMilestone(m.id)}
                                disabled={approving === m.id}
                                className="mt-3 w-full bg-emerald-600 hover:bg-emerald-700"
                              >
                                {approving === m.id ? <Loader2 className="size-3 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
                                Approve milestone
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Evidence from provider */}
              {clientEvidence.length > 0 && (
                <Card className="mb-4">
                  <CardContent className="p-5">
                    <div className="mb-3 flex items-center gap-2">
                      <Paperclip className="size-4 text-brand-600" />
                      <h3 className="text-sm font-medium text-foreground">Evidence</h3>
                      <span className="ml-auto text-xs text-muted-foreground">{clientEvidence.length} file{clientEvidence.length !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="space-y-2">
                      {clientEvidence.map((ev) => {
                        const isImage = ev.fileType.startsWith("image/");
                        const fileUrl = `/api/jobs/client/${token}/evidence/${ev.id}/file`;
                        return (
                          <a
                            key={ev.id}
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                          >
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                              {isImage ? <Eye className="size-4" /> : <Paperclip className="size-4" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-foreground">{ev.fileName}</p>
                              {ev.description && <p className="truncate text-xs text-muted-foreground">{ev.description}</p>}
                              <p className="text-xs text-muted-foreground">{(ev.fileSize / 1024).toFixed(0)} KB</p>
                            </div>
                            <span className="shrink-0 text-xs text-brand-600">View</span>
                          </a>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

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
                    {verifyingPayment ? (
                      <Button className="w-full" disabled>
                        <Loader2 className="size-4 animate-spin" />
                        Confirming payment...
                      </Button>
                    ) : (
                      <Button className="w-full" asChild>
                        <a href={`/api/payments/${data.ref}?token=${token}`}>
                          <Lock className="size-4" />
                          Pay securely
                        </a>
                      </Button>
                    )}
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
                        You&apos;re all set. The provider has been notified.
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-200/50 px-3 py-1 text-xs font-medium text-emerald-800">
                      <CheckCircle2 className="size-3" />
                      Protected by TrustPoint
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Dispute section — only shown when viewing a disputed job */}
              {jobViewState === "dispute" && (
                <Card className="mb-4 border-orange-200">
                  <CardContent className="space-y-4 p-5">
                    <div className="flex items-center gap-2">
                      <div className="flex size-8 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                        <AlertTriangle className="size-4" />
                      </div>
                      <div>
                        <h2 className="text-sm font-medium text-orange-900">This project has been placed under review</h2>
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

              {/* Report an Issue — always available when milestones need approval */}
              {jobViewState === "approval" && data.milestones?.some((m) => m.status === "COMPLETED") && (
                <Card className="mb-4 border-amber-200">
                  <CardContent className="space-y-4 p-5">
                    <div className="flex items-center gap-2">
                      <div className="flex size-8 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                        <Clock className="size-4" />
                      </div>
                      <div>
                        <h2 className="text-sm font-medium text-amber-900">Milestones awaiting review</h2>
                        <p className="text-xs text-amber-700">Review each milestone and approve payment when satisfied.</p>
                      </div>
                    </div>
                    {!showDisputeForm ? (
                      <Button
                        variant="outline"
                        onClick={() => setShowDisputeForm(true)}
                        className="w-full text-destructive border-destructive/30 hover:bg-destructive/5"
                      >
                        <AlertTriangle className="size-4" />
                        Report an issue
                      </Button>
                    ) : (
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

              {/* Ready to release — all milestones approved, waiting for manual release or 48h auto-release */}
              {jobViewState === "ready_to_release" && (
                <Card className="mb-4 border-blue-200 bg-blue-50">
                  <CardContent className="space-y-4 p-5">
                    <div className="flex items-center gap-2">
                      <div className="flex size-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                        <CheckCircle2 className="size-4" />
                      </div>
                      <div>
                        <h2 className="text-sm font-medium text-blue-900">All milestones approved</h2>
                        <p className="text-xs text-blue-700">Release payment to the provider or wait for auto-release.</p>
                      </div>
                    </div>

                    <Button
                      onClick={handleReleasePayment}
                      disabled={releasing}
                      className="w-full"
                    >
                      {releasing ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                      Release payment now
                    </Button>

                    {data?.allApprovedAt && (
                      <AutoReleaseCountdown allApprovedAt={data.allApprovedAt} />
                    )}

                    <div className="border-t border-blue-200 pt-3">
                      {!showDisputeForm ? (
                        <Button
                          variant="outline"
                          onClick={() => setShowDisputeForm(true)}
                          className="w-full text-destructive border-destructive/30 hover:bg-destructive/5"
                        >
                          <AlertTriangle className="size-4" />
                          Report an issue
                        </Button>
                      ) : (
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
                    </div>
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
                        <Button variant="outline" onClick={() => setShowDisputeConfirm(false)} className="flex-1">Cancel</Button>
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
                      <p className="mt-1 text-sm text-emerald-700">All milestones completed. All done.</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="mt-8 text-center text-xs text-muted-foreground">
                <p>Powered by <span className="font-medium text-foreground">TrustPoint</span></p>
                <p className="mt-1">Funds held in protected payment. Released only when you approve.</p>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

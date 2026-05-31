"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AppContainer, StatusPill } from "@/components/ui/trustpoint-shell";
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
  ListChecks,
  Paperclip,
  Eye,
} from "lucide-react";
import { getStatusLabel, getStatusStyle, getMilestoneLabel, getMilestoneStyle } from "@/lib/job-status";

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

type Milestone = {
  id: string;
  title: string;
  amount: number;
  status: string;
  sortOrder: number;
};

type PayoutRelease = {
  id: string;
  amount: number;
  status: string;
  reference: string;
  failureReason: string | null;
  transferCode: string | null;
  createdAt: string;
  completedAt: string | null;
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
  milestones: Milestone[];
  clientUrl: string;
  virtualAccount: { bankName: string; accountNumber: string; accountName: string } | null;
  paymentReferences: { reference: string; status: string }[];
  disputes: Dispute[];
  payoutReleases: PayoutRelease[];
};

function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [completing, setCompleting] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showConfirm, setShowConfirm] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState(false);
  const [retryingPayout, setRetryingPayout] = useState<string | null>(null);
  const [evidenceList, setEvidenceList] = useState<{ id: string; fileName: string; fileType: string; fileSize: number; description: string | null; createdAt: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [evidenceDesc, setEvidenceDesc] = useState("");

  const loadEvidence = useCallback(async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/jobs/${id}/evidence`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setEvidenceList(await res.json());
    } catch { /* ignore */ }
  }, [id, user]);

  useEffect(() => { if (!loading) loadEvidence(); }, [loading, loadEvidence]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 6 * 1024 * 1024) { toast.error("File too large (max 6MB)"); return; }
    setUploading(true);
    setUploadProgress(0);
    try {
      const buf = await file.arrayBuffer();
      setUploadProgress(50);
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
      setUploadProgress(60);
      const token = await user.getIdToken();
      const res = await fetch(`/api/jobs/${id}/evidence`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileData: base64,
          description: evidenceDesc.trim() || null,
        }),
      });
      setUploadProgress(100);
      if (!res.ok) { const err = await res.json(); throw new Error(err.error ?? "Upload failed"); }
      toast.success("Evidence uploaded");
      setEvidenceDesc("");
      loadEvidence();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      e.target.value = "";
    }
  };

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

  useEffect(() => { loadJob(); }, [loadJob]);

  const pollRef = useRef<ReturnType<typeof setInterval>>(undefined);
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    const awaitingAction = job?.milestones?.some(
      (m) => m.status === "COMPLETED" || m.status === "APPROVED"
    );
    if (awaitingAction) {
      pollRef.current = setInterval(loadJob, 5000);
    } else {
      pollRef.current = undefined;
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [job?.milestones, loadJob]);

  const formattedCompletionDate = useMemo(
    () => job?.expectedCompletionDate
      ? new Date(job.expectedCompletionDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
      : null,
    [job?.expectedCompletionDate]
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
    () => {
      if (!job?.milestones?.length) return 0;
      const terminal = job.milestones.filter((m) => ["APPROVED", "RELEASED"].includes(m.status)).length;
      return (terminal / job.milestones.length) * 100;
    },
    [job?.milestones]
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

  const handleCompleteMilestone = async (milestoneId: string) => {
    if (!user) return;
    setShowConfirm(null);
    setCompleting(milestoneId);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/jobs/${id}/milestones/${milestoneId}/complete`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed");
      }
      toast.success("Milestone marked complete. Your client has been notified.");
      loadJob();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Could not update");
    } finally {
      setCompleting(null);
    }
  };

  const handleRetryPayout = async (payoutId: string) => {
    if (!user) return;
    setRetryingPayout(payoutId);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/payouts/${payoutId}/retry`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Retry failed");
      }
      toast.success("Payout retry initiated");
      loadJob();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Could not retry payout");
    } finally {
      setRetryingPayout(null);
    }
  };

  const canMarkMilestones = useMemo(
    () => job && (job.status === "ACTIVE" || job.status === "IN_PROGRESS") && job.escrow?.status !== "UNFUNDED",
    [job?.status, job?.escrow?.status]
  );

  const pendingMilestones = useMemo(
    () => job?.milestones?.filter((m) => m.status === "PENDING" || m.status === "IN_PROGRESS") ?? [],
    [job?.milestones]
  );

  const completedMilestones = useMemo(
    () => job?.milestones?.filter((m) => m.status === "COMPLETED") ?? [],
    [job?.milestones]
  );

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
        <Link href="/provider/dashboard">
          <Button variant="outline">
            <ArrowLeft className="size-4" />
            Back to Your Jobs
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <AppContainer className="max-w-4xl">
      <div className="mb-6">
        <Link
          href="/provider/dashboard"
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-white hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Protected Projects
        </Link>
      </div>

      <Card className="mb-6 border-brand-100 bg-white/95">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <StatusPill className="mb-3 bg-brand-50 text-brand-800">
                <Shield className="size-3.5" />
                Protected project
              </StatusPill>
              <h1 className="truncate text-2xl font-bold leading-tight text-foreground sm:text-3xl">{job.title}</h1>
              <p className="mt-1 text-xs text-muted-foreground">{job.ref}</p>
            </div>
            <span
              className={`w-fit shrink-0 rounded-full px-3 py-1 text-xs font-medium ${getStatusStyle(job.status, job.approvedAt)}`}
            >
              {getStatusLabel(job.status, job.approvedAt)}
            </span>
          </div>

          {job.description && (
            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
              {job.description}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
            {job.clientEmail && (
              <p className="flex items-center gap-1.5">
                <Mail className="size-3" />
                Client email: {job.clientEmail}
              </p>
            )}
            {job.expectedCompletionDate && (
              <p className="flex items-center gap-1.5">
                <Clock className="size-3" />
                Expected by {formattedCompletionDate}
              </p>
            )}
            {pollRef.current && (
              <p className="flex items-center gap-1.5 text-amber-600">
                <Loader2 className="size-3 animate-spin" />
                Checking for updates
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Link ready — share with client */}
      {job.clientUrl && job.status === "PENDING_PAYMENT" && (
        <Card className="mb-5 border-brand-200 bg-brand-50 sm:mb-6">
          <CardContent className="p-4 sm:p-5">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="size-4" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-brand-900">Protected payment link ready</h3>
                <p className="text-xs text-brand-700">
                  Share this link with your client to start a protected payment.
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

      {/* Payment secured — milestones */}
      {canMarkMilestones && (
        <Card className="mb-5 border-emerald-200 bg-emerald-50 sm:mb-6">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <Shield className="size-4" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-emerald-900">Payment secured</h3>
                <p className="text-xs text-emerald-700">
                  Mark milestones as you complete them.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Milestones list */}
      {job.milestones && job.milestones.length > 0 && (
        <Card className="mb-6">
          <CardContent className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <ListChecks className="size-4 text-brand-600" />
              <h3 className="text-sm font-medium text-foreground">Milestones</h3>
              <span className="ml-auto text-xs text-muted-foreground">
                {job.milestones.filter((m) => ["APPROVED", "RELEASED"].includes(m.status)).length}/{job.milestones.length} done
              </span>
            </div>

            {/* Progress bar */}
            <div className="mb-4 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-brand-500 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="space-y-2">
              {job.milestones.map((m) => (
                <div
                  key={m.id}
                  className={`rounded-lg border p-3 ${
                    m.status === "COMPLETED" ? "border-amber-200 bg-amber-50/50" :
                    m.status === "APPROVED" || m.status === "RELEASED" ? "border-emerald-200 bg-emerald-50/50" :
                    ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{m.title}</p>
                      <p className="text-xs text-muted-foreground">₦{(m.amount / 100).toLocaleString()}</p>
                    </div>
                    <span className={`shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${getMilestoneStyle(m.status)}`}>
                      {getMilestoneLabel(m.status)}
                    </span>
                  </div>
                  {canMarkMilestones && m.status === "PENDING" && (
                    <Button
                      size="sm"
                      onClick={() => setShowConfirm(m.id)}
                      disabled={completing === m.id}
                      className="mt-2 w-full sm:w-auto"
                    >
                      {completing === m.id ? <Loader2 className="size-3 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
                      Done
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Evidence */}
      <Card className="mb-6">
        <CardContent className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Paperclip className="size-4 text-brand-600" />
            <h3 className="text-sm font-medium text-foreground">Evidence</h3>
            {evidenceList.length > 0 && (
              <span className="ml-auto text-xs text-muted-foreground">{evidenceList.length} file{evidenceList.length !== 1 ? "s" : ""}</span>
            )}
          </div>

          <div className="mb-4 space-y-2">
            <textarea
              rows={1}
              placeholder="Optional description..."
              value={evidenceDesc}
              onChange={(e) => setEvidenceDesc(e.target.value)}
              className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-muted-foreground/30 p-3 text-sm text-muted-foreground hover:border-brand-500 hover:text-brand-600">
              {uploading ? (
                <div className="w-full space-y-2">
                  <div className="flex items-center justify-center gap-2 text-brand-600">
                    <Loader2 className="size-4 animate-spin" />
                    {uploadProgress < 50 ? "Reading file..." : uploadProgress < 100 ? "Uploading..." : "Done"}
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-brand-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Paperclip className="size-4" />
                  Upload file (photo, PDF, receipt)
                </div>
              )}
              <input type="file" accept="image/*,.pdf,.doc,.docx" onChange={handleUpload} disabled={uploading} className="hidden" />
            </label>
          </div>

          {evidenceList.length > 0 && (
            <div className="space-y-2">
              {evidenceList.map((ev) => {
                const isImage = ev.fileType.startsWith("image/");
                const viewFile = async () => {
                  if (!user) return;
                  const t = await user.getIdToken();
                  window.open(`/api/jobs/${id}/evidence/${ev.id}/file?token=${t}`, "_blank", "noopener,noreferrer");
                };
                return (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={viewFile}
                    className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50"
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
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Complete confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <Card className="w-full max-w-sm">
            <CardContent className="p-5">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                    <AlertTriangle className="size-4" />
                  </div>
                  <h3 className="text-sm font-medium text-foreground">Confirm milestone</h3>
                </div>
                <button onClick={() => setShowConfirm(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="size-4" />
                </button>
              </div>
              <p className="mb-5 text-sm text-muted-foreground">
                Have you finished this milestone? Your client will be notified and can release payment for it.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowConfirm(null)} className="flex-1">Cancel</Button>
                <Button onClick={() => handleCompleteMilestone(showConfirm)} disabled={completing === showConfirm} className="flex-1">
                  {completing === showConfirm ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                  Confirm
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* All done */}
      {job.status === "COMPLETED" && job.approvedAt && (
        <Card className="mb-5 border-emerald-200 bg-emerald-50 sm:mb-6">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <div className="flex size-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="size-5" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-emerald-900">All settled</h3>
                <p className="text-xs text-emerald-700">All milestones completed. Well done.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dispute state */}
      {job.status === "DISPUTED" && (
        <Card className="mb-5 border-orange-200 bg-orange-50 sm:mb-6">
          <CardContent className="p-4 sm:p-5">
            <h3 className="text-sm font-medium text-orange-900">This project has been placed under review</h3>
            <p className="mt-1 text-xs text-orange-700">
              TrustPoint will review the issue before payment is released.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Settlement History */}
      {job.payoutReleases && job.payoutReleases.length > 0 && (
        <Card className="mb-6">
          <CardContent className="p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
              <Landmark className="size-4" />
              Settlement History
            </h3>
            <div className="space-y-2 text-sm">
              {job.payoutReleases.map((pr) => (
                <div key={pr.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-xs text-muted-foreground">{pr.reference}</p>
                    <p className="text-xs text-muted-foreground">
                      ₦{(pr.amount / 100).toLocaleString()}
                      {pr.failureReason && ` — ${pr.failureReason}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      pr.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700" :
                      pr.status === "FAILED" ? "bg-red-50 text-red-700" :
                      "bg-amber-50 text-amber-700"
                    }`}>
                      {pr.status}
                    </span>
                    {pr.status === "FAILED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRetryPayout(pr.id)}
                        disabled={retryingPayout === pr.id}
                      >
                        {retryingPayout === pr.id
                          ? <Loader2 className="size-3 animate-spin" />
                          : <RefreshCcw className="size-3" />
                        }
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Escrow summary */}
      {job.escrow && (
        <Card className="mb-6">
          <CardContent className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <Wallet className="size-4" />
              </div>
              <span className="text-sm font-medium text-foreground">Protected Payment</span>
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
                <span className="text-sm text-emerald-600">{releasedAmount}</span>
              )}
            </div>
            <div className="mt-2 space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Project amount</span>
                <span>{formattedAmount}</span>
              </div>
              <div className="flex justify-between">
                <span>Platform fee</span>
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
              Payment Details
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
            <h3 className="mb-3 text-sm font-medium text-foreground">Transaction History</h3>
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
    </AppContainer>
  );
}

export default function JobDetailPage() {
  return (
    <ProtectedRoute>
      <JobDetail />
    </ProtectedRoute>
  );
}

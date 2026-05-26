"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Loader2,
  ArrowLeft,
  Scale,
  CheckCircle2,
  RefreshCcw,
  AlertTriangle,
  Clock,
  User,
  Mail,
  Briefcase,
  Wallet,
  X,
  Shield,
} from "lucide-react";

type DisputeDetail = {
  id: string;
  reason: string;
  status: string;
  resolution: string | null;
  createdAt: string;
  job: { title: string; ref: string; amount: number; status: string };
  raiser: { name: string | null; email: string | null };
};

export default function AdminDisputeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [dispute, setDispute] = useState<DisputeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [confirm, setConfirm] = useState<"ARTISAN" | "CLIENT" | null>(null);

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const token = sessionStorage.getItem("admin_token");
      const res = await fetch("/api/admin/disputes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const list: DisputeDetail[] = await res.json();
      const found = list.find((d) => d.id === id);
      if (!found) throw new Error("Not found");
      setDispute(found);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleResolve = async (resolution: "ARTISAN" | "CLIENT") => {
    setConfirm(null);
    setResolving(true);
    try {
      const token = sessionStorage.getItem("admin_token");
      const res = await fetch(`/api/admin/disputes/${id}/resolve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resolution,
          note: resolution === "ARTISAN" ? "Resolved in favor of artisan" : "Resolved in favor of client — refund issued",
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Resolve failed");
      }
      toast.success(
        resolution === "ARTISAN"
          ? "Payment released to artisan"
          : "Refund issued to client"
      );
      router.push("/admin/disputes");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Could not resolve dispute");
    } finally {
      setResolving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-brand-500" />
      </div>
    );
  }

  if (error || !dispute) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-3 px-4">
        <p className="text-sm text-muted-foreground">Dispute not found.</p>
        <Button variant="outline" onClick={() => router.push("/admin/disputes")}>
          <ArrowLeft className="size-4" />
          Back to Disputes
        </Button>
      </div>
    );
  }

  const isResolved = dispute.status !== "OPEN" && dispute.status !== "UNDER_REVIEW";

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <button
        onClick={() => router.push("/admin/disputes")}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Disputes
      </button>

      <div className="mb-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Scale className="size-5 text-brand-600" />
              <h1 className="text-lg font-bold text-foreground">Dispute</h1>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">{dispute.job.ref}</p>
          </div>
          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
            dispute.status === "OPEN" ? "bg-red-50 text-red-700" :
            dispute.status === "UNDER_REVIEW" ? "bg-amber-50 text-amber-700" :
            dispute.status === "RESOLVED_ARTISAN" ? "bg-emerald-50 text-emerald-700" :
            dispute.status === "RESOLVED_CLIENT" ? "bg-blue-50 text-blue-700" :
            "bg-muted text-muted-foreground"
          }`}>
            {dispute.status.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      <div className="mb-6 space-y-3">
        <Card>
          <CardContent className="p-4 sm:p-5">
            <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Job</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Briefcase className="size-4 text-muted-foreground" />
                <span className="font-medium text-foreground">{dispute.job.title}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Wallet className="size-4" />
                ₦{(dispute.job.amount / 100).toLocaleString()} — {dispute.job.status}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-5">
            <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Raised by</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <User className="size-4 text-muted-foreground" />
                <span className="text-foreground">{dispute.raiser.name ?? "Unknown"}</span>
              </div>
              {dispute.raiser.email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="size-4" />
                  {dispute.raiser.email}
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="size-4" />
                {new Date(dispute.createdAt).toLocaleDateString("en-GB", {
                  day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-5">
            <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Reason</h3>
            <p className="text-sm leading-relaxed text-foreground">{dispute.reason}</p>
          </CardContent>
        </Card>

        {dispute.resolution && (
          <Card className="border-brand-200 bg-brand-50">
            <CardContent className="p-4 sm:p-5">
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-brand-700">Resolution</h3>
              <p className="text-sm text-brand-900">{dispute.resolution}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {!isResolved && (
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Resolve Dispute</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              onClick={() => setConfirm("ARTISAN")}
              disabled={resolving}
              className="w-full"
            >
              <CheckCircle2 className="size-4" />
              Release to Artisan
            </Button>
            <Button
              onClick={() => setConfirm("CLIENT")}
              disabled={resolving}
              variant="outline"
              className="w-full"
            >
              <Shield className="size-4" />
              Refund to Client
            </Button>
          </div>
        </div>
      )}

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <Card className="w-full max-w-sm">
            <CardContent className="p-5">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                    <AlertTriangle className="size-4" />
                  </div>
                  <h3 className="text-sm font-medium text-foreground">
                    {confirm === "ARTISAN" ? "Release payment?" : "Refund to client?"}
                  </h3>
                </div>
                <button onClick={() => setConfirm(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="size-4" />
                </button>
              </div>
              <p className="mb-5 text-sm text-muted-foreground">
                {confirm === "ARTISAN"
                  ? "The escrowed amount will be transferred to the artisan's bank account."
                  : "The payment will be refunded to the client's original payment method via Paystack."}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setConfirm(null)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={() => handleResolve(confirm)} disabled={resolving} className="flex-1">
                  {resolving ? <Loader2 className="size-4 animate-spin" /> : null}
                  Confirm
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

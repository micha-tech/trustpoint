"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Scale, RefreshCcw, ChevronRight, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";

type Dispute = {
  id: string;
  reason: string;
  status: string;
  createdAt: string;
  job: { title: string; ref: string; amount: number; status: string };
  raiser: { name: string | null; email: string | null };
};

const statusBadge: Record<string, string> = {
  OPEN: "bg-red-50 text-red-700",
  UNDER_REVIEW: "bg-amber-50 text-amber-700",
  RESOLVED_PROVIDER: "bg-emerald-50 text-emerald-700",
  RESOLVED_CLIENT: "bg-blue-50 text-blue-700",
  ESCALATED: "bg-purple-50 text-purple-700",
};

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/admin/disputes");
      if (!res.ok) throw new Error();
      setDisputes(await res.json());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-brand-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-3 px-4">
        <p className="text-sm text-muted-foreground">Unable to load reviews.</p>
        <Button variant="outline" onClick={load}>
          <RefreshCcw className="size-4" />
          Try Again
        </Button>
      </div>
    );
  }

  if (disputes.length === 0) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-3 px-4">
        <div className="flex size-12 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle2 className="size-6 text-emerald-600" />
        </div>
        <p className="text-sm font-medium text-foreground">No reviews</p>
        <p className="text-sm text-muted-foreground">All clear — no issues have been raised.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex items-center gap-2">
        <Scale className="size-5 text-brand-600" />
        <h1 className="text-lg font-bold text-foreground">Reviews</h1>
        <span className="ml-auto rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
          {disputes.filter((d) => d.status === "OPEN" || d.status === "UNDER_REVIEW").length} open
        </span>
      </div>

      <div className="space-y-3">
        {disputes.map((d) => (
          <Link key={d.id} href={`/admin/disputes/${d.id}`}>
            <Card className="transition-all hover:border-brand-200 hover:shadow-sm">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge[d.status] ?? "bg-muted text-muted-foreground"}`}>
                        {d.status.replace(/_/g, " ")}
                      </span>
                      <span className="truncate text-sm font-medium text-foreground">{d.job.title}</span>
                    </div>
                    <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{d.reason}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{d.raiser.name ?? d.raiser.email ?? "Unknown"}</span>
                      <span>{d.job.ref}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {new Date(d.createdAt).toLocaleDateString("en-GB")}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Wallet, Briefcase, CheckCircle2, RefreshCcw } from "lucide-react";

type FeeData = {
  totalJobs: number;
  totalFeesFormatted: string;
  totalFeesKobo: number;
  completedJobs: number;
  recentApprovals: { amount: number; formatted: string; date: string; reference: string }[];
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<FeeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/admin/fees");
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-brand-500" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-3 px-4">
        <p className="text-sm text-muted-foreground">Unable to load data.</p>
        <button onClick={load} className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700">
          <RefreshCcw className="size-4" /> Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <h1 className="mb-6 text-lg font-bold text-foreground">Overview</h1>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Wallet className="size-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Platform Fees</p>
                <p className="text-lg font-bold text-foreground">{data.totalFeesFormatted}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="size-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Completed</p>
                <p className="text-lg font-bold text-foreground">{data.completedJobs}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Briefcase className="size-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Jobs</p>
                <p className="text-lg font-bold text-foreground">{data.totalJobs}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {data.recentApprovals.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <h2 className="mb-3 text-sm font-medium text-foreground">Recent Approvals</h2>
            <div className="space-y-2 text-sm">
              {data.recentApprovals.map((a) => (
                <div key={a.reference} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">{a.reference}</p>
                    <p className="text-xs text-muted-foreground">{new Date(a.date).toLocaleDateString("en-GB")}</p>
                  </div>
                  <span className="text-sm font-medium text-foreground">{a.formatted}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

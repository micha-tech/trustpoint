"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { AppContainer, StatusPill } from "@/components/ui/trustpoint-shell";
import { calmError } from "@/lib/errors";
import { ArrowLeft, Calendar, FileSignature, Loader2, Lock, Plus, ShieldCheck, Trash2, WalletCards } from "lucide-react";

type MilestoneInput = { title: string; amount: string };

function NewJobForm() {
  const router = useRouter();
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [expectedCompletionDate, setExpectedCompletionDate] = useState("");
  const [milestones, setMilestones] = useState<MilestoneInput[]>([
    { title: "", amount: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const totalAmount = useMemo(
    () => milestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0),
    [milestones]
  );

  const addMilestone = () => {
    setMilestones([...milestones, { title: "", amount: "" }]);
  };

  const removeMilestone = (i: number) => {
    if (milestones.length <= 1) return;
    setMilestones(milestones.filter((_, idx) => idx !== i));
  };

  const updateMilestone = (i: number, field: keyof MilestoneInput, value: string) => {
    const next = [...milestones];
    next[i] = { ...next[i], [field]: value };
    setMilestones(next);
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = "Job title is required";
    if (!clientEmail.trim()) e.clientEmail = "Client email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail.trim())) e.clientEmail = "Enter a valid email";
    milestones.forEach((m, i) => {
      if (!m.title.trim()) e[`ms_${i}_title`] = `Milestone ${i + 1} title is required`;
      const amt = parseFloat(m.amount);
      if (!m.amount.trim() || isNaN(amt) || amt < 1) e[`ms_${i}_amount`] = "Enter a valid amount";
    });
    if (totalAmount < 1) e.total = "Total amount must be at least NGN 1";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async () => {
    if (!validate() || !user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const body = {
        title: title.trim(),
        description: description.trim() || undefined,
        clientEmail: clientEmail.trim(),
        expectedCompletionDate: expectedCompletionDate || undefined,
        milestones: milestones.map((m) => ({
          title: m.title.trim(),
          amount: Math.round(parseFloat(m.amount) * 100),
        })),
      };

      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const job = await res.json();

      if (!res.ok) {
        throw new Error(job.error ?? "Failed to create job");
      }

      if (job.paymentError) {
        toast.warning(job.paymentError);
      }

      toast.success("Protected payment link generated");
      router.push(`/provider/jobs/${job.id}`);
    } catch (err) {
      toast.error(calmError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppContainer className="max-w-6xl">
      <div className="mb-6">
        <Link
          href="/provider/dashboard"
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-white hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Protected Projects
        </Link>
      </div>

      <div className="mb-6 max-w-2xl">
        <StatusPill className="mb-3 bg-brand-50 text-brand-800">
          <FileSignature className="size-3.5" />
          New protected project
        </StatusPill>
        <h1 className="text-2xl font-bold leading-tight text-foreground sm:text-3xl">Create a client payment link</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Define scope, milestone amounts, and the client contact before TrustPoint generates the protected payment request.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start">
        <div className="space-y-5">
          <Card>
            <CardContent className="space-y-4 p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <FileSignature className="size-4" />
                </div>
                <h2 className="text-sm font-semibold text-foreground">Project details</h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="title">Job Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g. Website redesign"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                  {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientEmail">Client Email</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    placeholder="client@example.com"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                  />
                  {errors.clientEmail && <p className="text-sm text-destructive">{errors.clientEmail}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expectedCompletionDate">Expected Completion Date</Label>
                  <div className="relative">
                    <Calendar className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="expectedCompletionDate"
                      type="date"
                      className="pl-9"
                      value={expectedCompletionDate}
                      onChange={(e) => setExpectedCompletionDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    rows={4}
                    placeholder="Describe the work clearly for your client."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="flex w-full rounded-lg border border-input bg-card/95 px-3 py-2 text-sm placeholder:text-muted-foreground/75 focus-visible:border-brand-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-5 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                    <ShieldCheck className="size-4" />
                  </div>
                  <h2 className="text-sm font-semibold text-foreground">Milestones</h2>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addMilestone} className="w-full sm:w-auto">
                  <Plus className="size-3.5" />
                  Add milestone
                </Button>
              </div>

              <div className="space-y-3">
                {milestones.map((m, i) => (
                  <div key={i} className="rounded-lg border border-border/75 bg-white/70 p-4">
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <span className="text-xs font-semibold text-muted-foreground">
                        Milestone {i + 1}
                      </span>
                      {milestones.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMilestone(i)}
                          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-destructive/5 hover:text-destructive"
                          aria-label={`Remove milestone ${i + 1}`}
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Title</Label>
                        <Input
                          placeholder="e.g. Wireframes approved"
                          value={m.title}
                          onChange={(e) => updateMilestone(i, "title", e.target.value)}
                        />
                        {errors[`ms_${i}_title`] && (
                          <p className="text-xs text-destructive">{errors[`ms_${i}_title`]}</p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Amount</Label>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                            NGN
                          </span>
                          <Input
                            type="number"
                            placeholder="25000"
                            className="pl-12"
                            value={m.amount}
                            onChange={(e) => updateMilestone(i, "amount", e.target.value)}
                          />
                        </div>
                        {errors[`ms_${i}_amount`] && (
                          <p className="text-xs text-destructive">{errors[`ms_${i}_amount`]}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="lg:sticky lg:top-24">
          <Card>
            <CardContent className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <WalletCards className="size-4" />
                </div>
                <h2 className="text-sm font-semibold text-foreground">Payment summary</h2>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Milestone total</span>
                  <span className="font-bold text-foreground">NGN {totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Platform fee (5%)</span>
                  <span className="text-foreground">NGN {Math.round(totalAmount * 0.05).toLocaleString()}</span>
                </div>
                <div className="border-t border-border pt-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-foreground">Client pays</span>
                    <span className="text-lg font-bold text-brand-700">
                      NGN {Math.round(totalAmount * 1.05).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {errors.total && <p className="mt-3 text-sm text-destructive">{errors.total}</p>}

              <Button
                type="button"
                onClick={onSubmit}
                disabled={loading || totalAmount <= 0}
                className="mt-5 w-full"
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Lock className="size-4" />
                )}
                Create protected payment link
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </AppContainer>
  );
}

export default function NewJobPage() {
  return (
    <ProtectedRoute>
      <NewJobForm />
    </ProtectedRoute>
  );
}

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
import { calmError } from "@/lib/errors";
import { ArrowLeft, Calendar, Loader2, Lock, Plus, Trash2 } from "lucide-react";

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
      if (!m.amount.trim() || isNaN(amt) || amt < 1) e[`ms_${i}_amount`] = `Enter a valid amount`;
    });
    if (totalAmount < 1) e.total = "Total amount must be at least ₦1";
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
      router.push(`/artisan/jobs/${job.id}`);
    } catch (err) {
      toast.error(calmError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6">
        <Link
          href="/artisan/dashboard"
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">New Project</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Set up milestones and a secure payment request for your client.
        </p>
      </div>

      <div className="space-y-5">
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title</Label>
              <Input
                id="title"
                placeholder="e.g. Kitchen Renovation"
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
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                rows={3}
                placeholder="Describe the work clearly for your client."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
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
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-foreground">Milestones</h2>
              <Button type="button" variant="outline" size="sm" onClick={addMilestone}>
                <Plus className="size-3.5" />
                Add milestone
              </Button>
            </div>

            {milestones.map((m, i) => (
              <div key={i} className="rounded-lg border p-4">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Milestone {i + 1}
                  </span>
                  {milestones.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMilestone(i)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Title</Label>
                    <Input
                      placeholder="e.g. Foundation work"
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
                        ₦
                      </span>
                      <Input
                        type="number"
                        placeholder="25000"
                        className="pl-6"
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
          </CardContent>
        </Card>

        {errors.total && <p className="text-sm text-destructive">{errors.total}</p>}

        <Card className="bg-gradient-to-br from-muted/50 to-background">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Milestone total</span>
              <span className="text-lg font-bold text-foreground">
                ₦{totalAmount.toLocaleString()}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Platform fee (5%)</span>
              <span className="text-muted-foreground">
                ₦{Math.round(totalAmount * 0.05).toLocaleString()}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm font-medium">
              <span className="text-foreground">Client pays</span>
              <span className="text-foreground">
                ₦{Math.round(totalAmount * 1.05).toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Button
          type="button"
          onClick={onSubmit}
          disabled={loading || totalAmount <= 0}
          className="w-full"
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Lock className="size-4" />
          )}
          Generate payment link
        </Button>
      </div>
    </div>
  );
}

export default function NewJobPage() {
  return (
    <ProtectedRoute>
      <NewJobForm />
    </ProtectedRoute>
  );
}

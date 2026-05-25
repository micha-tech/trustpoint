"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { calmError } from "@/lib/errors";
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react";

const milestoneSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  amount: z.string().min(1, "Amount is required"),
});

const jobSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  milestones: z.array(milestoneSchema).min(1, "At least one milestone required"),
});

type JobForm = z.infer<typeof jobSchema>;

function NewJobForm() {
  const router = useRouter();
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<JobForm>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      milestones: [{ title: "", description: "", amount: "" }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "milestones" });
  const [loading, setLoading] = useState(false);

  const milestones = watch("milestones");
  const totalAmount = milestones.reduce((s, m) => s + (parseInt(m.amount) || 0), 0);

  const onSubmit = async (data: JobForm) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          amount: totalAmount * 100,
          milestones: data.milestones.map((m) => ({
            title: m.title,
            description: m.description ?? "",
            amount: parseInt(m.amount) * 100,
          })),
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error ?? "Failed to create job");
      }

      const job = await res.json();
      toast.success("Job created successfully");
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
        <h1 className="text-xl font-bold text-foreground">Create Job</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Define the work and set milestones. Your client will pay into escrow before work starts.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title</Label>
              <Input
                id="title"
                placeholder="e.g. Kitchen Renovation"
                {...register("title")}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                rows={3}
                placeholder="Describe the scope of work…"
                className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                {...register("description")}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Label className="text-sm font-medium">Milestones</Label>
              <Button
                type="button"
                variant="outline"
                onClick={() => append({ title: "", description: "", amount: "" })}
                className="w-full sm:w-auto"
              >
                <Plus className="size-4" />
                Add milestone
              </Button>
            </div>

            <div className="space-y-3">
              {fields.map((field, i) => (
                <div
                  key={field.id}
                  className="rounded-xl border border-border bg-muted/30 p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <span className="flex size-6 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                        {i + 1}
                      </span>
                      Milestone {i + 1}
                    </span>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(i)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                        Remove
                      </Button>
                    )}
                  </div>
                  <div className="space-y-3">
                    <Input
                      placeholder="Milestone title"
                      {...register(`milestones.${i}.title`)}
                    />
                    {errors.milestones?.[i]?.title && (
                      <p className="text-xs text-destructive">{errors.milestones[i]?.title?.message}</p>
                    )}
                    <Input
                      placeholder="Description (optional)"
                      {...register(`milestones.${i}.description`)}
                    />
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        ₦
                      </span>
                      <Input
                        type="number"
                        placeholder="Amount"
                        className="pl-7"
                        {...register(`milestones.${i}.amount`)}
                      />
                    </div>
                    {errors.milestones?.[i]?.amount && (
                      <p className="text-xs text-destructive">{errors.milestones[i]?.amount?.message}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-muted/50 to-background">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total job amount</span>
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
          </CardContent>
        </Card>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              Creating…
            </span>
          ) : (
            "Create Job"
          )}
        </Button>
      </form>
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

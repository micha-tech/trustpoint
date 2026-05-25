"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { calmError } from "@/lib/errors";
import { ArrowLeft, Calendar, Loader2, Lock } from "lucide-react";

const jobSchema = z.object({
  title: z.string().min(1, "Job title is required"),
  amount: z.string().min(1, "Amount is required"),
  description: z.string().optional(),
  expectedCompletionDate: z.string().optional(),
});

type JobForm = z.infer<typeof jobSchema>;

function NewJobForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<JobForm>({ resolver: zodResolver(jobSchema) });
  const [loading, setLoading] = useState(false);

  const amount = parseInt(watch("amount") || "0");

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
          description: data.description || "",
          amount: amount * 100,
          expectedCompletionDate: data.expectedCompletionDate || null,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error ?? "Failed to create job");
      }

      const job = await res.json();
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
        <h1 className="text-xl font-bold text-foreground">Create Protected Job</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a secure payment request for your client.
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
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  ₦
                </span>
                <Input
                  id="amount"
                  type="number"
                  placeholder="50000"
                  className="pl-7"
                  {...register("amount")}
                />
              </div>
              {errors.amount && (
                <p className="text-sm text-destructive">{errors.amount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                rows={3}
                placeholder="Describe the work clearly for your client."
                className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                {...register("description")}
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
                  {...register("expectedCompletionDate")}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-muted/50 to-background">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-lg font-bold text-foreground">
                ₦{amount.toLocaleString()}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Platform fee (5%)</span>
              <span className="text-muted-foreground">
                ₦{Math.round(amount * 0.05).toLocaleString()}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm font-medium">
              <span className="text-foreground">Client pays</span>
              <span className="text-foreground">
                ₦{Math.round(amount * 1.05).toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={loading || amount <= 0} className="w-full">
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Lock className="size-4" />
          )}
          Generate Protected Payment Link
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

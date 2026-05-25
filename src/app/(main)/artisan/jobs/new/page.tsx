"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ProtectedRoute } from "@/components/ProtectedRoute";

interface MilestoneInput {
  title: string;
  description: string;
  amount: string;
}

function NewJobForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [milestones, setMilestones] = useState<MilestoneInput[]>([
    { title: "", description: "", amount: "" },
  ]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const totalAmount = milestones.reduce((s, m) => s + (parseInt(m.amount) || 0), 0);

  const addMilestone = () => {
    setMilestones([...milestones, { title: "", description: "", amount: "" }]);
  };

  const removeMilestone = (i: number) => {
    if (milestones.length <= 1) return;
    setMilestones(milestones.filter((_, idx) => idx !== i));
  };

  const updateMilestone = (i: number, field: keyof MilestoneInput, value: string) => {
    const copy = [...milestones];
    copy[i] = { ...copy[i], [field]: value };
    setMilestones(copy);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title) return;

    if (milestones.some((m) => !m.title || !m.amount)) {
      setError("All milestones need a title and amount");
      return;
    }

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
          title,
          description,
          amount: totalAmount * 100,
          milestones: milestones.map((m) => ({
            title: m.title,
            description: m.description,
            amount: parseInt(m.amount) * 100,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to create job");
      }

      const job = await res.json();
      router.push(`/artisan/jobs/${job.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:py-12">
      <div className="mb-6 -ml-2">
        <Link
          href="/artisan/dashboard"
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-sm text-gray-500 transition-colors hover:text-gray-700"
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
      </div>

      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Create Job</h1>
        <p className="mt-1 text-sm text-gray-500">
          Define the work and set milestones. Your client will pay into escrow before work starts.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="space-y-4 sm:space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Job Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Kitchen Renovation"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 sm:py-2.5"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the scope of work…"
                rows={3}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 sm:py-2.5"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="text-sm font-medium text-gray-700">Milestones</label>
            <button
              type="button"
              onClick={addMilestone}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-brand-300 px-4 py-3 text-sm font-medium text-brand-600 transition-colors hover:bg-brand-50 sm:w-auto sm:rounded-lg sm:border-solid sm:border-brand-200 sm:px-3 sm:py-1.5"
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add milestone
            </button>
          </div>

          <div className="space-y-3">
            {milestones.map((m, i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 transition-all"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs font-medium text-gray-500">
                    <span className="flex size-6 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                      {i + 1}
                    </span>
                    Milestone {i + 1}
                  </span>
                  {milestones.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMilestone(i)}
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Remove
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  <input
                    type="text"
                    required
                    value={m.title}
                    onChange={(e) => updateMilestone(i, "title", e.target.value)}
                    placeholder="Milestone title"
                    className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 sm:py-2"
                  />
                  <input
                    type="text"
                    value={m.description}
                    onChange={(e) => updateMilestone(i, "description", e.target.value)}
                    placeholder="Description (optional)"
                    className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 sm:py-2"
                  />
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400 sm:left-3">
                      ₦
                    </span>
                    <input
                      type="number"
                      required
                      min={1}
                      value={m.amount}
                      onChange={(e) => updateMilestone(i, "amount", e.target.value)}
                      placeholder="Amount"
                      className="w-full rounded-lg border border-gray-200 bg-white px-8 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 sm:px-7 sm:py-2"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Total job amount</span>
            <span className="text-lg font-bold text-gray-900">
              ₦{totalAmount.toLocaleString()}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-gray-400">Platform fee (5%)</span>
            <span className="text-gray-500">₦{Math.round(totalAmount * 0.05).toLocaleString()}</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:bg-brand-600 hover:shadow-xl hover:shadow-brand-500/30 disabled:opacity-60 active:scale-[0.98] sm:py-3"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Creating…
            </span>
          ) : (
            "Create Job"
          )}
        </button>
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

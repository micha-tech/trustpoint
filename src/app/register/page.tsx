"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setError("");
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(cred.user);
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed";
      if (msg.includes("email-already-in-use")) {
        setError("An account with this email already exists");
      } else if (msg.includes("weak-password")) {
        setError("Password must be at least 6 characters");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-32 -top-32 size-96 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 size-96 rounded-full bg-brand-500/10 blur-3xl" />
      </div>

      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-brand-600"
          >
            TrustPoint
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            Create account
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Get started with TrustPoint
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-500/25 transition-all hover:bg-brand-600 hover:shadow-md disabled:opacity-60"
          >
            {loading ? "Creating account…" : "Create Account"}
          </button>

          <p className="mt-4 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-brand-600 hover:text-brand-700"
            >
              Sign In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

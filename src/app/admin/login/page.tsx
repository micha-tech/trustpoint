"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Loader2, Eye, EyeOff, ShieldAlert } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function AdminLoginPage() {
  const [secret, setSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [show, setShow] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!secret.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/fees", {
        headers: { Authorization: `Bearer ${secret.trim()}` },
      });
      if (!res.ok) {
        setError("Invalid secret. Try again.");
        return;
      }
      sessionStorage.setItem("admin_token", secret.trim());
      router.replace("/admin/dashboard");
    } catch {
      setError("Could not connect. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <Card className="w-full max-w-sm">
        <CardContent className="p-6">
          <div className="mb-6 text-center">
            <div className="mb-3 flex justify-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-brand-50">
                <ShieldAlert className="size-6 text-brand-600" />
              </div>
            </div>
            <h1 className="text-lg font-bold text-foreground">Admin Access</h1>
            <p className="mt-1 text-sm text-muted-foreground">Enter the admin secret to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type={show ? "text" : "password"}
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="Admin secret"
                className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-10 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
                autoFocus
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>

            {error && (
              <p className="text-center text-xs text-red-600">{error}</p>
            )}

            <Button type="submit" disabled={loading || !secret.trim()} className="w-full">
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/" className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground">
              Back to homepage
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

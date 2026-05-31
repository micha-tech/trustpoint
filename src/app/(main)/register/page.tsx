"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, LockKeyhole, Eye, EyeOff } from "lucide-react";
import { AuthShell } from "@/components/AuthShell";

export default function RegisterPage() {
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const passwordsMatch = password === confirmPassword;
  const confirmTouched = confirmPassword.length > 0;

  useEffect(() => {
    if (!authLoading && authUser && !signedIn) {
      router.replace("/dashboard");
    } else if (signedIn && !authLoading && authUser) {
      router.push("/dashboard");
    }
  }, [signedIn, authLoading, authUser, router]);

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
      toast.error("Unable to sign up right now. Please try again.");
      return;
    }
    if (!email.trim() || !password.trim()) return;
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords don't match.");
      return;
    }
    if (!agreeTerms) {
      toast.error("Please agree to the Terms of Service.");
      return;
    }
    setLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const token = await result.user.getIdToken();
      localStorage.setItem("token", token);
      toast.success("Account created successfully");
      setSignedIn(true);
    } catch (err: unknown) {
      const fbErr = err as { code?: string; message?: string };
      const code = fbErr?.code ?? "";
      const msg = fbErr?.message ?? "";
      if (process.env.NODE_ENV !== "production") console.error("Email sign-up error:", { code, message: msg });
      if (code.includes("email-already-in-use") || msg.includes("email-already-in-use")) {
        toast.error("An account with this email already exists. Sign in instead.");
      } else if (code.includes("weak-password") || msg.includes("weak-password")) {
        toast.error("Password is too weak. Use at least 6 characters.");
      } else if (code.includes("invalid-email") || msg.includes("invalid-email")) {
        toast.error("Enter a valid email address.");
      } else if (code.includes("too-many-requests") || msg.includes("too-many-requests")) {
        toast.error("Too many attempts. Please wait a moment and try again.");
      } else if (code.includes("billing-not-enabled") || msg.includes("billing-not-enabled")) {
        toast.error("Authentication service unavailable. Contact support.");
      } else {
        toast.error("Unable to create account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    if (!auth) return;
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const token = await result.user.getIdToken();
      localStorage.setItem("token", token);
      toast.success("Signed up with Google");
      setSignedIn(true);
    } catch (err: unknown) {
      const fbErr = err as { code?: string; message?: string };
      const code = fbErr?.code ?? "";
      const msg = fbErr?.message ?? "";
      if (process.env.NODE_ENV !== "production") console.error("Google sign-up error:", { code, message: msg });
      if (code.includes("popup-closed-by-user") || msg.includes("popup-closed-by-user")) {
      } else if (code.includes("popup-blocked") || msg.includes("popup-blocked")) {
        toast.error("Pop-up was blocked. Please allow pop-ups for this site.");
      } else if (code.includes("account-exists-with-different-credential") || msg.includes("account-exists-with-different-credential")) {
        toast.error("An account with this email already exists. Sign in with your email and password.");
      } else if (code.includes("billing-not-enabled") || msg.includes("billing-not-enabled")) {
        toast.error("Authentication service unavailable. Contact support.");
      } else {
        toast.error("Unable to sign up with Google. Try again.");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  if (signedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="mx-auto size-6 animate-spin text-brand-500" />
          <p className="mt-3 text-sm text-muted-foreground">Creating your account...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthShell
      title="Create your TrustPoint account"
      subtitle="Start sending protected payment links with milestones, evidence, and client approvals."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700">
            Sign in
          </Link>
        </>
      }
    >
          <form onSubmit={handleEmailSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className="pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  className="pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {confirmTouched && !passwordsMatch && (
                <p className="text-sm text-destructive">Passwords don&apos;t match.</p>
              )}
            </div>

            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-1 size-3.5 shrink-0 rounded border-border text-brand-600 focus:ring-brand-500"
              />
              <span className="text-xs text-muted-foreground">
                I agree to the{" "}
                <Link href="/terms" className="text-brand-600 hover:text-brand-700">Terms of Service</Link> and{" "}
                <Link href="/privacy" className="text-brand-600 hover:text-brand-700">Privacy Policy</Link>
              </span>
            </label>

            <Button
              type="submit"
              disabled={loading || !email.trim() || !password.trim() || !confirmPassword.trim() || !agreeTerms}
              className="w-full"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <LockKeyhole className="size-4" />
              )}
              Create Account
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or continue with</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button
            onClick={handleGoogleSignUp}
            variant="outline"
            disabled={googleLoading}
            className="w-full"
            aria-label="Sign up with Google account"
          >
            {googleLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            Sign up with Google
          </Button>
    </AuthShell>
  );
}

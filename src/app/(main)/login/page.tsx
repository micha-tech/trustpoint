"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Phone, ShieldCheck } from "lucide-react";

type Step = "phone" | "otp";

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 10) return "";
  if (digits.startsWith("234") && digits.length === 13) return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 11) return `+234${digits.slice(1)}`;
  if (digits.startsWith("234") && digits.length === 12) return `+234${digits}`;
  return `+${digits}`;
}

export default function LoginPage() {
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuth();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const confirmationRef = useRef<ConfirmationResult | null>(null);

  useEffect(() => {
    if (signedIn && !authLoading && authUser) {
      router.push("/dashboard");
    }
  }, [signedIn, authLoading, authUser, router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    return () => {
      const win = window as unknown as { recaptchaVerifier?: RecaptchaVerifier };
      if (win.recaptchaVerifier) {
        try { win.recaptchaVerifier.clear(); } catch { /* ignore */ }
        delete win.recaptchaVerifier;
      }
    };
  }, []);

  const setupRecaptcha = () => {
    if (!auth || typeof window === "undefined") return null;
    const win = window as unknown as { recaptchaVerifier?: RecaptchaVerifier };
    if (win.recaptchaVerifier) {
      try { win.recaptchaVerifier.clear(); } catch { /* ignore */ }
    }
    const verifier = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible",
    });
    win.recaptchaVerifier = verifier;
    return verifier;
  };

  const handleSendOtp = async () => {
    if (!auth) {
      toast.error("Unable to verify right now. Please try again.");
      return;
    }
    if (!phone.trim()) {
      toast.error("Enter a valid phone number");
      return;
    }
    setLoading(true);
    try {
      const verifier = setupRecaptcha();
      if (!verifier) throw new Error("Could not set up verification");
      const e164 = formatPhone(phone);
      if (!e164) {
        toast.error("Enter a valid phone number (e.g. 08012345678)");
        return;
      }
      const confirmation = await signInWithPhoneNumber(auth, e164, verifier);
      confirmationRef.current = confirmation;
      setOtp("");
      toast.success("Verification code sent");
      setStep("otp");
      setCooldown(30);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("invalid-phone-number") || msg.includes("invalid-phone")) {
        toast.error("Enter a valid phone number (e.g. 08012345678)");
      } else if (msg.includes("too-many-requests") || msg.includes("too-many")) {
        toast.error("Too many attempts. Please wait and try again.");
      } else if (msg.includes("operation-not-allowed")) {
        toast.error("Phone sign-in is not enabled. Contact support.");
      } else if (msg.includes("quota-exceeded")) {
        toast.error("Service temporarily unavailable. Try again later.");
      } else if (msg.includes("captcha-check-failed")) {
        toast.error("Security check failed. Please refresh and try again.");
      } else if (msg.includes("recaptcha-not-ready")) {
        toast.error("Security check still loading. Please wait a moment and try again.");
      } else {
        toast.error("Unable to verify right now. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!confirmationRef.current || !otp.trim()) return;
    setLoading(true);
    try {
      const result = await confirmationRef.current.confirm(otp);
      const token = await result.user.getIdToken();
      localStorage.setItem("token", token);
      toast.success("Signed in successfully");
      setSignedIn(true);
    } catch {
      toast.error("Incorrect code. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    if (cooldown > 0) return;
    setOtp("");
    handleSendOtp();
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -left-32 -top-32 size-96 rounded-full bg-brand-500/8 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 size-96 rounded-full bg-brand-500/8 blur-3xl" />
      </div>

      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <Link href="/" className="inline-block transition-opacity hover:opacity-80">
            <img src="/logo.png" alt="TrustPoint" className="mx-auto h-10 w-auto" />
          </Link>
          <h1 className="mt-5 text-xl font-bold text-foreground">Secure payments for real-world jobs</h1>
          {step === "phone" && (
            <p className="mt-1 text-sm text-muted-foreground">
              Enter your phone number to get started
            </p>
          )}
          {signedIn && (
            <p className="mt-1 text-sm text-muted-foreground">
              Signing you in...
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          {step === "phone" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="08012345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={signedIn}
                />
              </div>
              <Button
                onClick={handleSendOtp}
                disabled={loading || !phone.trim() || signedIn}
                className="w-full"
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Phone className="size-4" />
                )}
                Continue
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Button
                variant="ghost"
                onClick={() => setStep("phone")}
                className="mb-2 -ml-2"
                disabled={signedIn}
              >
                <ArrowLeft className="size-4" />
                Change number
              </Button>
              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code</Label>
                <p className="text-xs text-muted-foreground">
                  Enter the code sent to {phone}
                </p>
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  placeholder="000000"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  disabled={signedIn}
                />
              </div>
              <Button
                onClick={handleVerifyOtp}
                disabled={loading || otp.length < 6 || signedIn}
                className="w-full"
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ShieldCheck className="size-4" />
                )}
                Verify & Sign In
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Didn&apos;t receive it?{" "}
                <button
                  onClick={handleResend}
                  disabled={loading || cooldown > 0 || signedIn}
                  className="font-medium text-brand-600 hover:text-brand-700 disabled:opacity-50"
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend"}
                </button>
              </p>
            </div>
          )}
        </div>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          By continuing, you agree to TrustPoint&apos;s terms of service.
        </p>
      </div>

      <div id="recaptcha-container" />
    </div>
  );
}

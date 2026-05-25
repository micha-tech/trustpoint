"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Phone, ShieldCheck } from "lucide-react";

type Step = "phone" | "otp";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<HTMLDivElement | null>(null);

  const setupRecaptcha = () => {
    if (!auth || typeof window === "undefined") return null;
    const win = window as unknown as { recaptchaVerifier?: RecaptchaVerifier };
    if (win.recaptchaVerifier) {
      win.recaptchaVerifier.clear();
    }
    const verifier = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible",
    });
    win.recaptchaVerifier = verifier;
    return verifier;
  };

  const handleSendOtp = async () => {
    if (!auth || !phone.trim()) return;
    setLoading(true);
    try {
      const verifier = setupRecaptcha();
      if (!verifier) throw new Error("Could not set up verification");
      const confirmation = await signInWithPhoneNumber(auth, phone, verifier);
      confirmationRef.current = confirmation;
      toast.success("Verification code sent");
      setStep("otp");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("invalid-phone")) {
        toast.error("Enter a valid phone number");
      } else if (msg.includes("too-many")) {
        toast.error("Too many attempts. Please wait and try again.");
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
      await confirmationRef.current.confirm(otp);
      toast.success("Signed in successfully");
      router.push("/dashboard");
    } catch {
      toast.error("Incorrect code. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -left-32 -top-32 size-96 rounded-full bg-brand-500/8 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 size-96 rounded-full bg-brand-500/8 blur-3xl" />
      </div>

      <div id="recaptcha-container" ref={recaptchaRef} />

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
                />
              </div>
              <Button
                onClick={handleSendOtp}
                disabled={loading || !phone.trim()}
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
                />
              </div>
              <Button
                onClick={handleVerifyOtp}
                disabled={loading || otp.length < 6}
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
                  onClick={handleSendOtp}
                  className="font-medium text-brand-600 hover:text-brand-700"
                >
                  Resend
                </button>
              </p>
            </div>
          )}
        </div>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          By continuing, you agree to TrustPoint&apos;s terms of service.
        </p>
      </div>
    </div>
  );
}

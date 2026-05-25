import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <h1 className="text-lg font-bold text-foreground">Registration is done with your phone</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            TrustPoint uses phone number verification instead of passwords. 
            Simply sign in with your phone number — your account is created automatically.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600"
          >
            <ArrowLeft className="size-4" />
            Sign in with your phone
          </Link>
        </div>
      </div>
    </div>
  );
}

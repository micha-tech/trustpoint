"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppContainer, StatusPill } from "@/components/ui/trustpoint-shell";
import { toast } from "sonner";
import { BadgeCheck, Loader2, Landmark, ShieldCheck, User } from "lucide-react";

type Bank = { name: string; code: string; slug: string };
type BankDetails = { bankName: string; bankCode: string; bankAccount: string; accountName: string } | null;

function ProfileContent() {
  const { user } = useAuth();

  const [banks, setBanks] = useState<Bank[]>([]);
  const [bankDetails, setBankDetails] = useState<BankDetails>(null);
  const [loadingBanks, setLoadingBanks] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(true);

  const [selectedBank, setSelectedBank] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/banks")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setBanks(data); })
      .catch(() => {})
      .finally(() => setLoadingBanks(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/profile/bank", { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          if (data.bankDetails) {
            setBankDetails(data.bankDetails);
            setSelectedBank(data.bankDetails.bankCode);
            setAccountNumber(data.bankDetails.bankAccount);
          }
        }
      } catch {} finally {
        setLoadingDetails(false);
      }
    })();
  }, [user]);

  const selectedBankName = banks.find((b) => b.code === selectedBank)?.name ?? "";

  const handleSave = async () => {
    if (!user || !selectedBank || accountNumber.length < 10) return;
    setSaving(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/profile/bank", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bankCode: selectedBank, bankName: selectedBankName, accountNumber }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Bank details saved");
        setBankDetails({ bankName: data.bankName, bankCode: selectedBank, bankAccount: data.bankAccount, accountName: data.accountName });
      } else {
        toast.error(data.error ?? "Could not save bank details");
      }
    } catch {
      toast.error("Could not save bank details");
    } finally {
      setSaving(false);
    }
  };

  const details = [
    { label: "Email", value: user?.email ?? "-" },
    { label: "Email Verified", value: user?.emailVerified ? "Yes" : "No" },
    { label: "Phone", value: user?.phoneNumber ?? "-" },
    { label: "Member Since", value: user?.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "-" },
  ];

  const initial = (user?.email ?? user?.phoneNumber ?? "?").charAt(0).toUpperCase();

  return (
    <AppContainer className="max-w-5xl">
      <div className="mb-6">
        <StatusPill className="mb-3 bg-brand-50 text-brand-800">
          <User className="size-3.5" />
          Trust Profile
        </StatusPill>
        <h1 className="text-2xl font-bold leading-tight text-foreground sm:text-3xl">Account and payout readiness</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Keep your identity and settlement destination up to date before clients approve work.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <Card>
          <CardContent className="p-5">
            <div className="mb-5 flex items-center gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-lg font-bold text-white shadow-sm shadow-brand-800/20">
                {initial}
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-bold text-foreground">{user?.email ?? user?.phoneNumber ?? "TrustPoint user"}</p>
                <p className="mt-1 text-sm text-muted-foreground">Workspace owner</p>
              </div>
            </div>

            <div className="divide-y divide-border rounded-lg border border-border/75">
              {details.map((d) => (
                <div key={d.label} className="flex items-center justify-between gap-3 px-4 py-3">
                  <span className="text-sm text-muted-foreground">{d.label}</span>
                  <span className="min-w-0 truncate text-right text-sm font-medium text-foreground">{d.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 sm:p-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <Landmark className="size-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Payout Bank Account</h2>
                  <p className="mt-1 text-xs text-muted-foreground">Used when approved funds are released.</p>
                </div>
              </div>
              {bankDetails && (
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  <BadgeCheck className="size-3.5" />
                  Saved
                </span>
              )}
            </div>

            {loadingBanks || loadingDetails ? (
              <div className="flex justify-center py-10">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">
                {bankDetails && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="mt-0.5 size-4 text-emerald-700" />
                      <div>
                        <p className="text-sm font-semibold text-emerald-900">{bankDetails.accountName}</p>
                        <p className="mt-1 text-xs leading-5 text-emerald-700">
                          {bankDetails.bankName} - {bankDetails.bankAccount}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="bank">Bank</Label>
                    <select
                      id="bank"
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                      className="flex h-11 w-full rounded-lg border border-input bg-card/95 px-3 py-2 text-sm focus-visible:border-brand-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
                    >
                      <option value="">Select a bank</option>
                      {banks.map((b) => (
                        <option key={b.code} value={b.code}>{b.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">Account Number</Label>
                    <Input
                      id="accountNumber"
                      type="text"
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="0123456789"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSave}
                  disabled={saving || !selectedBank || accountNumber.length !== 10}
                  className="w-full sm:w-auto"
                >
                  {saving ? <Loader2 className="size-4 animate-spin" /> : <Landmark className="size-4" />}
                  {saving ? "Saving..." : bankDetails ? "Update bank details" : "Save bank details"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppContainer>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}

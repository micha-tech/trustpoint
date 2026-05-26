"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Landmark } from "lucide-react";

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
    { label: "Email", value: user?.email ?? "—" },
    { label: "Email Verified", value: user?.emailVerified ? "Yes" : "No" },
    { label: "Phone", value: user?.phoneNumber ?? "—" },
    { label: "Member Since", value: user?.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "—" },
  ];

  const initial = (user?.email ?? user?.phoneNumber ?? "?").charAt(0).toUpperCase();

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <div className="mb-6 flex items-center gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-base font-bold text-white shadow-sm sm:size-14 sm:text-lg">
          {initial}
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">Profile</h1>
          <p className="text-sm text-muted-foreground">Manage your account details</p>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="divide-y divide-border p-0">
          {details.map((d) => (
            <div key={d.label} className="flex items-center justify-between px-5 py-4">
              <span className="text-sm text-muted-foreground">{d.label}</span>
              <span className="text-right text-sm font-medium text-foreground">{d.value}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <Landmark className="size-4" />
            </div>
            <span className="text-sm font-medium text-foreground">Payout Bank Account</span>
            {bankDetails && <span className="ml-auto rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">Saved</span>}
          </div>

          {loadingBanks || loadingDetails ? (
            <div className="flex justify-center py-6">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bank">Bank</Label>
                <select
                  id="bank"
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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

              <Button
                onClick={handleSave}
                disabled={saving || !selectedBank || accountNumber.length !== 10}
                className="w-full"
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Landmark className="size-4" />}
                {saving ? "Saving..." : bankDetails ? "Update bank details" : "Save bank details"}
              </Button>

              {bankDetails && (
                <p className="text-center text-xs text-muted-foreground">
                  Account: {bankDetails.accountName} &middot; {bankDetails.bankName} &middot; {bankDetails.bankAccount}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}

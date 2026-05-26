"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Menu, X, LogOut } from "lucide-react";

const navLinks = [
  { href: "/dashboard", label: "Overview" },
  { href: "/artisan/dashboard", label: "Your Jobs" },
  { href: "/profile", label: "Profile" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const isAuthPage = pathname === "/login" || pathname === "/register";

  const handleSignOut = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      setOpen(false);
      router.push("/");
    } catch {
      if (process.env.NODE_ENV !== "production") console.error("Sign out failed");
    }
  };

  if (!user || isAuthPage) return null;

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <Image src="/logo.png" alt="TrustPoint" width={64} height={32} className="h-8 w-auto" priority />
        </Link>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(!open)}
          className="sm:hidden"
          aria-label="Toggle menu"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>

        <div className="hidden items-center gap-1 sm:flex">
          {navLinks.map((link) => {
            const active = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                  active
                    ? "bg-brand-50 text-brand-700 shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <Button variant="outline" onClick={handleSignOut} className="ml-2">
            <LogOut className="size-4" />
            Sign Out
          </Button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background px-4 pb-4 pt-2 sm:hidden">
          {navLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`block rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-muted-foreground hover:bg-accent"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <Button
            variant="outline"
            onClick={handleSignOut}
            className="mt-1 w-full justify-start"
          >
            <LogOut className="size-4" />
            Sign Out
          </Button>
        </div>
      )}
    </nav>
  );
}

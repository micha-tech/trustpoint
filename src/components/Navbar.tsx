"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { TrustPointLogo } from "@/components/TrustPointLogo";
import { Menu, X, LogOut } from "lucide-react";

const navLinks = [
  { href: "/dashboard", label: "Overview" },
  { href: "/provider/dashboard", label: "Your Jobs" },
  { href: "/profile", label: "Profile" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const isPublicPage = pathname === "/" || pathname === "/login" || pathname === "/register";

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

  if (!user || isPublicPage) return null;

  return (
    <nav className="sticky top-0 z-50 border-b border-border/70 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/dashboard" className="flex min-w-0 items-center gap-2 transition-opacity hover:opacity-80">
          <TrustPointLogo
            className="w-[9.75rem] sm:w-[10.75rem]"
            priority
            sizes="(max-width: 640px) 9.75rem, 10.75rem"
          />
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

        <div className="hidden items-center gap-1 rounded-lg border border-border/70 bg-white/70 p-1 sm:flex">
          {navLinks.map((link) => {
            const active = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                  active
                    ? "bg-brand-50 text-brand-800 shadow-sm"
                    : "text-muted-foreground hover:bg-white hover:text-foreground"
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
        <div className="border-t border-border/70 bg-white/95 px-4 pb-4 pt-2 shadow-lg shadow-slate-900/5 sm:hidden">
          {navLinks.map((link) => {
            const active = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`block rounded-lg px-4 py-3 text-sm font-semibold transition-colors ${
                  active
                    ? "bg-brand-50 text-brand-800"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
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

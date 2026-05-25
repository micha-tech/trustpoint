"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/artisan/dashboard", label: "Artisan" },
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
    await signOut(auth);
    setOpen(false);
    router.push("/");
  };

  if (!user || isAuthPage) return null;

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200/60 bg-white/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/dashboard" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <img src="/logo.png" alt="TrustPoint" className="h-8 w-auto" />
        </Link>

        <button
          onClick={() => setOpen(!open)}
          className="flex size-9 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-100 sm:hidden"
          aria-label="Toggle menu"
        >
          <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

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
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <button
            onClick={handleSignOut}
            className="ml-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
          >
            Sign Out
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-gray-200/60 bg-white px-4 pb-4 pt-2 sm:hidden">
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
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <button
            onClick={handleSignOut}
            className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-left text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            Sign Out
          </button>
        </div>
      )}
    </nav>
  );
}

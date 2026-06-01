"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TrustPointLogo } from "@/components/TrustPointLogo";
import {
  LayoutDashboard,
  Scale,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";

const nav = [
  { href: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/disputes", label: "Reviews", icon: Scale },
];

function AdminSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/20 sm:hidden" onClick={onClose} />
      )}
      <aside className={`fixed left-0 top-0 z-50 flex h-full w-64 flex-col border-r border-border bg-background transition-transform sm:static sm:translate-x-0 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <Link href="/admin/dashboard" className="flex min-w-0 items-center gap-2" onClick={onClose}>
            <TrustPointLogo size="xs" priority sizes="2rem" />
            <span className="text-xs font-medium text-muted-foreground">Admin</span>
          </Link>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground sm:hidden">
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {nav.map((item) => {
            const active = pathname === item.href || (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  active
                    ? "bg-brand-50 text-brand-700 shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <item.icon className="size-4" />
                {item.label}
                {active && <ChevronRight className="ml-auto size-3.5 text-brand-400" />}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-3">
          <Link href="/">
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground">
              <LogOut className="size-4" />
              Back to Site
            </Button>
          </Link>
        </div>
      </aside>
    </>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    fetch("/api/admin/fees").then((res) => {
      if (res.ok) setAuthed(true);
      else if (!isLoginPage) router.replace("/admin/login");
    }).finally(() => setChecking(false));
  }, [pathname, isLoginPage, router]);

  if (isLoginPage) return <>{children}</>;

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (!authed) return null;

  return (
    <div className="flex min-h-screen bg-muted/30">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/75 px-4 py-3 backdrop-blur-xl sm:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-muted-foreground hover:text-foreground sm:hidden"
          >
            <Menu className="size-5" />
          </button>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="hidden sm:inline">Admin</span>
            <ChevronRight className="size-3 hidden sm:inline" />
            <span className="font-medium text-foreground">
              {pathname === "/admin/dashboard" ? "Overview" : pathname.startsWith("/admin/disputes") ? "Disputes" : ""}
            </span>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

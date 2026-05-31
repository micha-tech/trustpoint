import * as React from "react";
import { cn } from "@/lib/utils";

function AppContainer({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8",
        className
      )}
      {...props}
    />
  );
}

function Surface({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border/75 bg-white/95 shadow-sm shadow-slate-950/[0.03]",
        className
      )}
      {...props}
    />
  );
}

function StatusPill({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        className
      )}
      {...props}
    />
  );
}

export { AppContainer, Surface, StatusPill };

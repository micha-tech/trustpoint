import Image from "next/image";
import { cn } from "@/lib/utils";

type TrustPointLogoProps = {
  className?: string;
  priority?: boolean;
  showTagline?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
  sizes?: string;
};

const MARK_SIZE = 352;

const logoSizes = {
  xs: {
    root: "gap-2",
    mark: "size-8",
    name: "text-lg",
    tagline: "max-w-[8rem] text-[0.42rem] leading-[1.08]",
  },
  sm: {
    root: "gap-2",
    mark: "size-9",
    name: "text-xl",
    tagline: "max-w-[8.75rem] text-[0.48rem] leading-[1.08]",
  },
  md: {
    root: "gap-2.5",
    mark: "size-10",
    name: "text-2xl",
    tagline: "max-w-[10.5rem] text-[0.56rem] leading-[1.08]",
  },
  lg: {
    root: "gap-3",
    mark: "size-12",
    name: "text-3xl",
    tagline: "max-w-[13rem] text-[0.66rem] leading-[1.08]",
  },
};

export function TrustPointLogo({
  className,
  priority = false,
  showTagline = true,
  size = "sm",
  sizes = "3rem",
}: TrustPointLogoProps) {
  const logoSize = logoSizes[size];

  return (
    <span className={cn("inline-flex min-w-0 items-center", logoSize.root, className)} aria-label="TrustPoint">
      <Image
        src="/trustpoint-icon.png"
        alt=""
        width={MARK_SIZE}
        height={MARK_SIZE}
        className={cn("block shrink-0", logoSize.mark)}
        priority={priority}
        sizes={sizes}
      />
      <span className="min-w-0">
        <span className={cn("block font-extrabold leading-none text-brand-700", logoSize.name)}>TrustPoint</span>
        {showTagline ? (
          <span className={cn("mt-0.5 block font-bold text-brand-700", logoSize.tagline)}>
            The Trust Infrastructure for Digital Commerce.
          </span>
        ) : null}
      </span>
    </span>
  );
}

import Image from "next/image";
import { cn } from "@/lib/utils";

type TrustPointLogoProps = {
  className?: string;
  priority?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
  sizes?: string;
};

const LOGO_WIDTH = 1094;
const LOGO_HEIGHT = 289;

const logoSizes = {
  xs: "w-[9rem]",
  sm: "w-[11.25rem]",
  md: "w-[12.75rem] min-[380px]:w-[13.25rem] sm:w-[14.5rem]",
  lg: "w-[16.5rem] sm:w-[18rem]",
};

const logoSizeHints = {
  xs: "9rem",
  sm: "11.25rem",
  md: "(max-width: 379px) 12.75rem, (max-width: 640px) 13.25rem, 14.5rem",
  lg: "(max-width: 640px) 16.5rem, 18rem",
};

export function TrustPointLogo({
  className,
  priority = false,
  size = "sm",
  sizes,
}: TrustPointLogoProps) {
  return (
    <Image
      src="/logo.png"
      alt="TrustPoint - The Trust Infrastructure for Digital Commerce."
      width={LOGO_WIDTH}
      height={LOGO_HEIGHT}
      className={cn("block h-auto max-w-full shrink-0", logoSizes[size], className)}
      priority={priority}
      sizes={sizes ?? logoSizeHints[size]}
    />
  );
}

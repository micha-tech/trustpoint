import Image from "next/image";
import { cn } from "@/lib/utils";

type TrustPointLogoProps = {
  className?: string;
  priority?: boolean;
  sizes?: string;
};

const LOGO_WIDTH = 1166;
const LOGO_HEIGHT = 357;

export function TrustPointLogo({
  className,
  priority = false,
  sizes = "(max-width: 640px) 9rem, 12rem",
}: TrustPointLogoProps) {
  return (
    <Image
      src="/logo.png"
      alt="TrustPoint"
      width={LOGO_WIDTH}
      height={LOGO_HEIGHT}
      className={cn("block h-auto w-auto max-w-full shrink-0", className)}
      priority={priority}
      sizes={sizes}
    />
  );
}

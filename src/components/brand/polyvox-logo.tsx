import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

type LogoVariant = "marketing" | "app" | "auth";
type LogoSize = "sm" | "md" | "lg";

const sizeMap: Record<LogoSize, { height: number; width: number }> = {
  sm: { height: 24, width: 120 },
  md: { height: 32, width: 150 },
  lg: { height: 40, width: 180 },
};

const hrefMap: Record<LogoVariant, string> = {
  marketing: "/",
  app: "/dashboard",
  auth: "/",
};

type PolyvoxLogoProps = {
  variant?: LogoVariant;
  size?: LogoSize;
  className?: string;
};

export default function PolyvoxLogo({
  variant = "marketing",
  size = "md",
  className,
}: PolyvoxLogoProps) {
  const { height, width } = sizeMap[size];

  return (
    <Link href={hrefMap[variant]} className={cn("inline-flex items-center", className)}>
      <Image
        src="/brand/polyvox-logo-light.png"
        alt="Polyvox"
        width={width}
        height={height}
        className="block h-auto dark:hidden"
        priority
      />
      <Image
        src="/brand/polyvox-logo-dark.png"
        alt="Polyvox"
        width={width}
        height={height}
        className="hidden h-auto dark:block"
        priority
      />
    </Link>
  );
}

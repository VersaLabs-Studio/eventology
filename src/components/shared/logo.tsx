import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "default" | "lg";
  className?: string;
}

const sizeMap = { sm: 32, default: 40, lg: 80 };

export function Logo({ size = "default", className }: LogoProps) {
  const px = sizeMap[size];
  return (
    <Link href="/" className={cn("flex items-center gap-2", className)}>
      <svg
        width={px}
        height={px}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="50" cy="50" r="45" fill="#065F46" />
        <path
          d="M30 70V30L50 50L70 30V70"
          stroke="white"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className={cn(
          "font-display font-bold text-primary",
          size === "sm" && "text-lg",
          size === "default" && "text-xl",
          size === "lg" && "text-3xl"
        )}
      >
        Eventology
      </span>
    </Link>
  );
}

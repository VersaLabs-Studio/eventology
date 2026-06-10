import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "default" | "lg";
  className?: string;
  showText?: boolean;
}

const sizeMap = { sm: 32, default: 44, lg: 88 };

export function Logo({ size = "default", className, showText = true }: LogoProps) {
  const px = sizeMap[size];
  return (
    <Link
      href="/"
      className={cn(
        "group flex items-center gap-3 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg p-1",
        className
      )}
    >
      <div className="relative flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
        <Image
          src="/logo.svg"
          alt="Eventology Logo"
          width={px}
          height={px}
          className="object-contain drop-shadow-sm"
          priority
        />
      </div>
      {showText && (
        <div className="flex flex-col">
          <span
            className={cn(
              "font-display font-extrabold tracking-tight text-foreground transition-colors group-hover:text-primary leading-none",
              size === "sm" && "text-base",
              size === "default" && "text-xl",
              size === "lg" && "text-3xl"
            )}
          >
            Eventology
          </span>
          {size !== "sm" && (
            <span className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase mt-0.5 block opacity-80 group-hover:text-accent transition-colors">
              Ethiopia
            </span>
          )}
        </div>
      )}
    </Link>
  );
}

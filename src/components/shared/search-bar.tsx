"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  variant?: "hero" | "compact";
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  className?: string;
}

export function SearchBar({
  variant = "compact",
  placeholder = "Search events, organizers, or venues...",
  value,
  onChange,
  onSubmit,
  className,
}: SearchBarProps) {
  const [localValue, setLocalValue] = React.useState(value || "");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
    onChange?.(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(localValue);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "relative flex items-center",
        variant === "hero"
          ? "w-full max-w-2xl rounded-2xl shadow-lg bg-white/10 backdrop-blur-sm border border-white/20"
          : "rounded-lg bg-background border border-border",
        className
      )}
    >
      <Search
        className={cn(
          "shrink-0 text-muted-foreground",
          variant === "hero" ? "ml-5 h-5 w-5" : "ml-3 h-4 w-4"
        )}
      />
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn(
          "w-full bg-transparent outline-none text-foreground placeholder:text-muted-foreground",
          variant === "hero"
            ? "h-14 px-3 text-lg font-body"
            : "h-10 px-2 text-sm"
        )}
      />
      {localValue && (
        <button
          type="button"
          onClick={() => { setLocalValue(""); onChange?.(""); inputRef.current?.focus(); }}
          className="mr-2 h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      )}
    </form>
  );
}

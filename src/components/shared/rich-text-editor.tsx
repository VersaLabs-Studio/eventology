"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Bold, Italic, List, Link, Image, Heading } from "lucide-react";

interface RichTextEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export function RichTextEditor({ value = "", onChange, className }: RichTextEditorProps) {
  const toolbarItems = [
    { icon: Bold, label: "Bold" },
    { icon: Italic, label: "Italic" },
    { icon: Heading, label: "Heading" },
    { icon: List, label: "List" },
    { icon: Link, label: "Link" },
    { icon: Image, label: "Image" },
  ];

  return (
    <div className={cn("rounded-lg border border-border overflow-hidden", className)}>
      <div className="flex items-center gap-1 p-2 bg-muted/50 border-b border-border">
        {toolbarItems.map((item) => (
          <button
            key={item.label}
            type="button"
            title={item.label}
            className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <item.icon className="h-4 w-4" />
          </button>
        ))}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full min-h-[300px] p-4 text-sm bg-card outline-none resize-y"
        placeholder="Write your event description..."
      />
    </div>
  );
}

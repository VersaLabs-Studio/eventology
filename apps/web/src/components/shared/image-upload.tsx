"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Upload, X } from "lucide-react";

interface ImageUploadProps {
  value?: string;
  onChange?: (url: string | null) => void;
  className?: string;
}

export function ImageUpload({ value, onChange, className }: ImageUploadProps) {
  const [preview, setPreview] = React.useState<string | undefined>(value);

  const handleUpload = () => {
    const demoUrl = "https://images.unsplash.com/photo-1540575467063-178a50e2fd60?w=800&h=400&fit=crop&q=80";
    setPreview(demoUrl);
    onChange?.(demoUrl);
  };

  const handleRemove = () => {
    setPreview(undefined);
    onChange?.(null);
  };

  if (preview) {
    return (
      <div className={cn("relative rounded-lg overflow-hidden border border-border", className)}>
        <Image src={preview} alt="Uploaded" width={800} height={400} className="w-full h-48 object-cover" />
        <button
          type="button"
          onClick={handleRemove}
          className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors"
        >
          <X className="h-4 w-4 text-white" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleUpload}
      className={cn(
        "w-full h-48 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer",
        className
      )}
    >
      <Upload className="h-8 w-8 text-muted-foreground" />
      <span className="text-sm font-medium text-muted-foreground">Click to upload</span>
      <span className="text-xs text-muted-foreground">PNG, JPG up to 5MB</span>
    </button>
  );
}

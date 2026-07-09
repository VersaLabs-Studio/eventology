"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Upload, X, Loader2, AlertCircle } from "lucide-react";

interface ImageUploadProps {
  value?: string | null;
  onChange?: (url: string | null) => void;
  /** Storage bucket. Defaults to the public `event-banners` bucket (migration 029). */
  bucket?: string;
  maxSizeMB?: number;
  accept?: string;
  className?: string;
}

/**
 * Real media uploader. Replaces the old stub (which injected a dead Unsplash
 * URL). Uploads via the server proxy `/api/protected/upload`, which authenticates
 * with better-auth and writes with the server-signed Supabase JWT so storage RLS
 * (own-folder write, migration 029) passes. Client-side validates type/size;
 * the server is authoritative for the path prefix (= caller's id) and size cap.
 */
export function ImageUpload({
  value,
  onChange,
  bucket = "event-banners",
  maxSizeMB = 5,
  accept = "image/*",
  className,
}: ImageUploadProps) {
  const [preview, setPreview] = React.useState<string | null>(value ?? null);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Keep preview in sync if the value changes externally (e.g. form reset).
  React.useEffect(() => {
    setPreview(value ?? null);
  }, [value]);

  const handleFile = async (file: File) => {
    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File must be ${maxSizeMB}MB or smaller.`);
      return;
    }

    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("bucket", bucket);

      const res = await fetch("/api/protected/upload", { method: "POST", body: form });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
        setError(body?.error?.message ?? "Upload failed");
        return;
      }

      const { url } = (await res.json()) as { url: string };
      setPreview(url);
      onChange?.(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    // Reset so selecting the same file again re-triggers onChange.
    e.target.value = "";
  };

  const handleRemove = () => {
    setPreview(null);
    setError(null);
    onChange?.(null);
  };

  if (preview) {
    return (
      <div className={cn("relative rounded-lg overflow-hidden border border-border", className)}>
        <Image
          src={preview}
          alt="Uploaded"
          width={800}
          height={400}
          className="w-full h-48 object-cover"
        />
        <button
          type="button"
          onClick={handleRemove}
          disabled={uploading}
          aria-label="Remove image"
          className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors disabled:opacity-50"
        >
          <X className="h-4 w-4 text-white" />
        </button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-full h-48 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer disabled:opacity-60"
      >
        {uploading ? (
          <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
        ) : (
          <Upload className="h-8 w-8 text-muted-foreground" />
        )}
        <span className="text-sm font-medium text-muted-foreground">
          {uploading ? "Uploading…" : "Click to upload"}
        </span>
        <span className="text-xs text-muted-foreground">PNG, JPG up to {maxSizeMB}MB</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={onInputChange}
      />
      {error && (
        <p className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

"use client";

import { useRef, useState } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Upload, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  shape?: "square" | "circle" | "wide";
  className?: string;
  /** Called with the chosen file before it is uploaded (e.g. to read its colours). */
  onFileSelected?: (file: File) => void;
}

export function ImageUpload({
  value,
  onChange,
  label = "رفع صورة",
  shape = "square",
  className,
  onFileSelected,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    onFileSelected?.(file);
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "فشل الرفع");
      onChange(json.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleUrlApply() {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setUrlInput("");
    }
  }

  const previewClasses = cn(
    "relative overflow-hidden bg-muted border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-foreground/40 transition-colors",
    shape === "circle" && "rounded-full",
    shape === "wide" && "rounded-xl w-full h-24",
    shape === "square" && "rounded-xl",
    !value && "hover:bg-muted/80",
    className
  );

  return (
    <div className="space-y-2">
      {/* Preview / Drop zone */}
      <div
        className={previewClasses}
        style={shape === "circle" ? { width: 80, height: 80 } : shape === "square" ? { width: 80, height: 80 } : undefined}
        onClick={() => !uploading && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {value ? (
          <>
            <img src={value} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
              <Upload className="h-5 w-5 text-white" />
            </div>
          </>
        ) : uploading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : (
          <div className="flex flex-col items-center gap-1 p-3 text-center">
            <Upload className="h-5 w-5 text-muted-foreground" />
            {shape === "wide" && (
              <p className="text-xs text-muted-foreground">{label}</p>
            )}
          </div>
        )}

        {/* Remove button */}
        {value && !uploading && (
          <button
            className="absolute top-1 end-1 h-5 w-5 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
            onClick={(e) => { e.stopPropagation(); onChange(null); }}
          >
            <X className="h-3 w-3 text-white" />
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
      />

      {/* Upload button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? (
          <><Loader2 className="h-3.5 w-3.5 animate-spin" /> جارٍ الرفع…</>
        ) : (
          <><Upload className="h-3.5 w-3.5" /> {label}</>
        )}
      </Button>

      {/* URL input alternative */}
      <div className="flex gap-1">
        <Input
          placeholder="أو الصق رابط الصورة…"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleUrlApply()}
          className="h-8 text-xs"
        />
        {urlInput && (
          <Button type="button" size="sm" variant="outline" onClick={handleUrlApply} className="h-8 px-2 text-xs shrink-0">
            OK
          </Button>
        )}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

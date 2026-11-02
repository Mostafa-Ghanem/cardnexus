"use client";

import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QRCodeDisplayProps {
  slug: string;
  color?: string;
  size?: number;
}

export function QRCodeDisplay({ slug, color = "#000000", size = 200 }: QRCodeDisplayProps) {
  const [src, setSrc] = useState<string>("");

  useEffect(() => {
    const params = new URLSearchParams({ color });
    setSrc(`/api/qr/${slug}?${params}`);
  }, [slug, color]);

  function downloadQR() {
    const link = document.createElement("a");
    link.href = src;
    link.download = `qr-${slug}.svg`;
    link.click();
  }

  if (!src) return <div className="h-48 w-48 bg-muted rounded-xl animate-pulse" />;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="rounded-xl border border-border p-3 bg-white dark:bg-gray-900">
        <img
          src={src}
          alt="رمز QR"
          width={size}
          height={size}
          className="rounded-lg"
        />
      </div>
      <Button variant="outline" size="sm" onClick={downloadQR}>
        <Download className="h-4 w-4" />
        تنزيل رمز QR
      </Button>
    </div>
  );
}

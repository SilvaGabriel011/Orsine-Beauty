"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { safeFetch } from "@/lib/errors/client";

interface ImageUploadProps {
  bucket: "categories" | "services" | "portfolio";
  currentUrl: string | null;
  onUpload: (url: string) => void;
  onRemove: () => void;
  className?: string;
}

export default function ImageUpload({
  bucket,
  currentUrl,
  onUpload,
  onRemove,
  className = "",
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Apenas imagens sao permitidas");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Imagem muito grande. Maximo 5MB.");
        return;
      }

      setUploading(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", bucket);

      const result = await safeFetch<{ url: string }>("/api/upload", {
        method: "POST",
        body: formData,
      });

      setUploading(false);

      if (!result.ok) return;

      onUpload(result.data.url);
      toast.success("Imagem enviada!");
    },
    [bucket, onUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      // Reset input so same file can be selected again
      e.target.value = "";
    },
    [handleFile]
  );

  if (currentUrl) {
    return (
      <div className={`relative ${className}`}>
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg border bg-gray-50">
          <Image
            src={currentUrl}
            alt="Preview"
            fill
            className="object-cover"
            sizes="300px"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute right-2 top-2 h-8 w-8 rounded-full shadow-md"
            onClick={onRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={handleInputChange}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        disabled={uploading}
        className={`flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
          dragOver
            ? "border-rose-400 bg-rose-50"
            : "border-gray-300 bg-gray-50 hover:border-rose-300 hover:bg-rose-50/50"
        } ${uploading ? "cursor-wait opacity-60" : "cursor-pointer"}`}
      >
        {uploading ? (
          <>
            <Loader2 className="mb-2 h-8 w-8 animate-spin text-rose-500" />
            <span className="text-sm text-gray-500">Enviando...</span>
          </>
        ) : (
          <>
            <Upload className="mb-2 h-8 w-8 text-gray-400" />
            <span className="text-sm font-medium text-gray-600">
              Clique ou arraste uma imagem
            </span>
            <span className="mt-1 text-xs text-gray-400">
              JPG, PNG ou WebP (max 5MB)
            </span>
          </>
        )}
      </button>
    </div>
  );
}

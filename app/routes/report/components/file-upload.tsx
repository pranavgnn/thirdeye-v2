"use client";

import { useState, useRef } from "react";
import { z } from "zod";
import { Upload, X } from "lucide-react";
import { Button } from "~/components/ui/button";

const imageSchema = z.object({
  file: z
    .instanceof(File)
    .refine(
      (file) => file.size <= 5 * 1024 * 1024,
      "File size must be less than 5MB"
    )
    .refine(
      (file) =>
        ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
          file.type
        ),
      "Only JPEG, PNG, WebP, and GIF images are supported"
    ),
});

type ImageInput = z.infer<typeof imageSchema>;

interface FileUploadProps {
  onImageUpload: (file: File) => void;
  onImageRemove: () => void;
  selectedImage: File | null;
  imagePreview: string | null;
  isValid: boolean;
}

export function FileUpload({
  onImageUpload,
  onImageRemove,
  selectedImage,
  imagePreview,
  isValid,
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateAndUploadImage = (file: File) => {
    setError(null);
    try {
      imageSchema.parse({ file });
      onImageUpload(file);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.issues?.[0]?.message ?? "Invalid file");
      }
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      validateAndUploadImage(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      validateAndUploadImage(file);
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const file = event.clipboardData.files?.[0];
    if (file) {
      validateAndUploadImage(file);
    }
  };

  if (selectedImage && imagePreview) {
    return (
      <div className="flex justify-center">
        <div className="relative rounded-lg border-2 border-border overflow-hidden w-full h-64 flex items-center justify-center bg-background">
          <img
            src={imagePreview}
            alt="Preview"
            className="max-w-full max-h-full object-contain"
          />
          <button
            onClick={onImageRemove}
            className="absolute top-2 right-2 bg-destructive/90 hover:bg-destructive p-1 rounded-md transition-colors"
            type="button"
            aria-label="Delete image"
          >
            <X className="w-4 h-4 text-destructive-foreground" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={dropZoneRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onPaste={handlePaste}
      tabIndex={0}
      className={`relative rounded-lg border-2 border-dashed transition-colors p-8 text-center cursor-pointer h-64 flex flex-col items-center justify-center ${
        isDragOver
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50"
      }`}
    >
      <div className="flex flex-col items-center gap-2">
        <Upload className="w-8 h-8 text-muted-foreground" />
        <h3 className="font-semibold text-foreground">Upload image</h3>
        <p className="text-sm text-muted-foreground">
          Drag and drop your image here, paste from clipboard, or click to
          select
        </p>
        <p className="text-xs text-muted-foreground">
          Supported formats: JPEG, PNG, WebP, GIF (Max 5MB)
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="absolute inset-0 opacity-0 cursor-pointer"
        aria-label="Upload image file"
      />

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
    </div>
  );
}

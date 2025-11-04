interface ImagePreviewProps {
  imageData: string;
  fileName?: string;
}

export function ImagePreview({ imageData, fileName }: ImagePreviewProps) {
  const imageSrc = imageData.startsWith("data:")
    ? imageData
    : `data:image/jpeg;base64,${imageData}`;

  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-xl border border-border overflow-hidden bg-muted/50 shadow-sm">
        <img
          src={imageSrc}
          alt="Uploaded evidence"
          className="w-full h-auto max-h-48 object-contain"
        />
      </div>
      {fileName && (
        <p className="text-xs text-muted-foreground truncate">{fileName}</p>
      )}
    </div>
  );
}

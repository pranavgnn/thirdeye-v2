import { useState } from "react";
import { useFetcher } from "react-router";
import { Button } from "~/components/ui/button";
import { FileUpload } from "./components/file-upload";
import { action } from "./action";

export { action };

export default function ReportPage() {
  const fetcher = useFetcher();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);

  const handleImageUpload = (file: File) => {
    setSelectedImage(file);
    setIsValid(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleImageRemove = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setIsValid(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedImage) return;

    const formData = new FormData();
    formData.append("file", selectedImage);

    fetcher.submit(formData, {
      method: "POST",
      action: "/report",
      encType: "multipart/form-data",
    });

    handleImageRemove();
  };

  return (
    <div>
      <div className="max-w-2xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
              Make Roads Safer Together
            </h1>
            <p className="text-lg text-muted-foreground">
              Report traffic violations you witness. Every report helps enforce
              traffic rules and protects our community.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-4 text-center">
                Upload Evidence
              </label>
              <FileUpload
                onImageUpload={handleImageUpload}
                onImageRemove={handleImageRemove}
                selectedImage={selectedImage}
                imagePreview={imagePreview}
                isValid={isValid}
              />
            </div>

            <div className="flex justify-center">
              <Button
                type="submit"
                disabled={!isValid || fetcher.state !== "idle"}
                size="lg"
              >
                {fetcher.state !== "idle" ? "Uploading..." : "Report"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

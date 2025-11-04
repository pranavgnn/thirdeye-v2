import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "~/components/ui/button";
import { FileUpload } from "./components/file-upload";

export default function ReportPage() {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
    if (!selectedImage || !imagePreview) return;

    setIsLoading(true);

    try {
      // Create session first
      const sessionRes = await fetch("/api/v1/violations/sessions", {
        method: "POST",
      });

      if (!sessionRes.ok) {
        throw new Error("Failed to create analysis session");
      }

      const session = await sessionRes.json();
      const sessionId = session.id;

      // Navigate to the session page
      navigate(`/report/session/${sessionId}`);

      // Then start the analysis in the background
      const formData = new FormData();
      formData.append("file", selectedImage);

      fetch(`/api/v1/violations/analyze?sessionId=${sessionId}`, {
        method: "POST",
        body: formData,
      }).catch((error) => {
        console.error("Error during analysis:", error);
      });
    } catch (error) {
      console.error("Error:", error);
      setIsLoading(false);
    }
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
              <Button type="submit" disabled={!isValid || isLoading} size="lg">
                {isLoading ? "Uploading..." : "Report"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

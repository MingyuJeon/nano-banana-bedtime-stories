import React, { useCallback, useState } from "react";
import { Upload, X } from "lucide-react";
import { cn } from "../lib/utils";

interface ImageDropzoneProps {
  value: File | null;
  preview: string;
  onChange: (file: File | null) => void;
  className?: string;
}

export default function ImageDropzone({
  value,
  preview,
  onChange,
  className,
}: ImageDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string>("");

  const validateFile = (file: File): boolean => {
    setError("");

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return false;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return false;
    }

    return true;
  };

  const handleFile = useCallback(
    (file: File) => {
      if (validateFile(file)) {
        onChange(file);
      }
    },
    [onChange]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        handleFile(e.target.files[0]);
      }
    },
    [handleFile]
  );

  const handleRemove = useCallback(() => {
    onChange(null);
    setError("");
  }, [onChange]);

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "relative rounded-lg border-2 border-dashed transition-all duration-200 bg-gray-50",
          isDragActive
            ? "border-gray-400 bg-gray-100"
            : "border-gray-300 hover:border-gray-400 hover:bg-gray-100",
          preview && "border-solid bg-white",
          error && "border-red-300"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          id="image-upload"
        />

        {preview ? (
          <div className="relative p-6">
            <div className="flex items-center justify-center">
              <img
                src={preview}
                alt="Preview"
                className="max-w-[250px] max-h-[250px] rounded-lg object-contain"
              />
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors z-20"
              aria-label="Remove image"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                Click or drag to replace
              </p>
            </div>
          </div>
        ) : (
          <label
            htmlFor="image-upload"
            className="flex flex-col items-center justify-center py-12 px-6 cursor-pointer"
          >
            <div className="flex flex-col items-center justify-center">
              <div className={cn(
                "p-3 rounded-full bg-gray-200 mb-4 transition-all",
                isDragActive && "bg-gray-300 scale-110"
              )}>
                <Upload className={cn(
                  "w-8 h-8 text-gray-600",
                  isDragActive && "text-gray-700"
                )} />
              </div>
              <p className="text-base text-gray-600 mb-1">
                Drag and drop an image file here or click
              </p>
              <p className="text-sm text-gray-400">
                PNG, JPG, GIF up to 5MB
              </p>
            </div>
          </label>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
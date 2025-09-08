import { Upload } from "lucide-react";
import React, { ChangeEvent, useRef, useState } from "react";
import { useStoryStore } from "../store/useStoryStore";
const ImageUpload: React.FC = () => {
  const { userImage, setUserImage } = useStoryStore();
  const [error, setError] = useState<string>("");
  const [preview, setPreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError("");

    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("이미지 파일만 업로드 가능합니다");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("파일 크기는 5MB 이하여야 합니다");
      return;
    }

    // Set the file in store
    setUserImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  // Create preview for existing image
  React.useEffect(() => {
    if (userImage) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(userImage);
    }
  }, [userImage]);

  return (
    <div className="image-upload-container">
      {!userImage ? (
        <div className="upload-area">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: "none" }}
            id="file-input"
            aria-label="파일 선택"
          />
          <button onClick={handleButtonClick} aria-label="파일 선택">
            <Upload className={"w-8 h-8 text-gray-600"} />
          </button>
        </div>
      ) : (
        <div className="preview-area">
          <img
            src={preview}
            alt="업로드된 이미지"
            style={{ maxWidth: "300px", maxHeight: "300px" }}
          />
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
              id="file-input-change"
              aria-label="파일 선택"
            />
            <label htmlFor="file-input-change" style={{ display: "none" }}>
              파일 선택
            </label>
            <button onClick={handleButtonClick} aria-label="이미지 변경">
              이미지 변경
            </button>
          </div>
        </div>
      )}

      {error && (
        <div
          className="error-message"
          style={{ color: "red", marginTop: "10px" }}
        >
          {error}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;

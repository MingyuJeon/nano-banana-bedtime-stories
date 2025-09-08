import axios from "axios";
import React, { useEffect, useRef, useState } from "react";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

interface Narrator {
  id: string;
  name: string;
  voiceId: string;
  imageUrl?: string;
  createdAt: number;
}

interface NarratorRegisterProps {
  onSuccess?: () => void;
}

const NarratorRegister: React.FC<NarratorRegisterProps> = ({ onSuccess }) => {
  const [name, setName] = useState("");
  const [voiceFile, setVoiceFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [narrators, setNarrators] = useState<Narrator[]>([]);
  const [playingPreview, setPlayingPreview] = useState<string | null>(null);

  const voiceInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchNarrators();
  }, []);

  const fetchNarrators = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/narrators`);
      setNarrators(response.data.narrators);
    } catch (err) {
      console.error("Error fetching narrators:", err);
    }
  };

  const handleVoiceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("audio/")) {
        setError("음성 파일만 업로드 가능합니다");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError("파일 크기는 10MB 이하여야 합니다");
        return;
      }
      setVoiceFile(file);
      setError("");
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("이미지 파일만 업로드 가능합니다");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("이미지 크기는 5MB 이하여야 합니다");
        return;
      }
      setImageFile(file);
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("나레이터 이름을 입력해주세요");
      return;
    }

    if (!voiceFile) {
      setError("음성 파일을 업로드해주세요");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("voiceFile", voiceFile);
      if (imageFile) {
        formData.append("narratorImage", imageFile);
      }

      const response = await axios.post(
        `${API_URL}/api/narrators/create`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setSuccess(true);
      setName("");
      setVoiceFile(null);
      setImageFile(null);

      if (voiceInputRef.current) voiceInputRef.current.value = "";
      if (imageInputRef.current) imageInputRef.current.value = "";

      console.log("Narrator created:", response.data.narrator);

      // Check if voice cloning was used or fallback
      const narrator = response.data.narrator;
      if (narrator.voiceId && !narrator.voiceId.startsWith("custom_")) {
        console.log("Note: Using pre-built voice due to API limitations");
      }

      // Refresh narrator list
      fetchNarrators();

      if (onSuccess) {
        onSuccess();
      }

      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      console.error("Error creating narrator:", err);
      setError(err.response?.data?.error || "나레이터 생성에 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewNarrator = async (narratorId: string) => {
    try {
      setPlayingPreview(narratorId);
      const response = await axios.get(
        `${API_URL}/api/narrators/${narratorId}/preview`
      );

      if (audioRef.current) {
        audioRef.current.src = `${API_URL}${response.data.previewUrl}`;
        audioRef.current.play();
        audioRef.current.onended = () => setPlayingPreview(null);
      }
    } catch (err) {
      console.error("Error playing preview:", err);
      alert("음성 미리듣기에 실패했습니다");
      setPlayingPreview(null);
    }
  };

  const handleDeleteNarrator = async (narratorId: string) => {
    if (!window.confirm("이 나레이터를 삭제하시겠습니까?")) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/api/narrators/${narratorId}`);
      fetchNarrators();
    } catch (err) {
      console.error("Error deleting narrator:", err);
      alert("나레이터 삭제에 실패했습니다");
    }
  };

  const resetForm = () => {
    setName("");
    setVoiceFile(null);
    setImageFile(null);
    setError("");
    setSuccess(false);
    if (voiceInputRef.current) voiceInputRef.current.value = "";
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  return (
    <div className="narrator-register-container">
      <h2>Narrator Voice</h2>
      <p style={{ marginBottom: "20px", color: "#666" }}>
        Once registered, the narrator can be reused continuously.
      </p>

      {success && (
        <div
          style={{
            padding: "10px",
            marginBottom: "20px",
            backgroundColor: "#d4edda",
            color: "#155724",
            borderRadius: "8px",
          }}
        >
          나레이터가 성공적으로 등록되었습니다!
        </div>
      )}

      {error && (
        <div
          style={{
            padding: "10px",
            marginBottom: "20px",
            backgroundColor: "#f8d7da",
            color: "#721c24",
            borderRadius: "8px",
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "20px" }}>
          <label
            htmlFor="narrator-name"
            style={{ display: "block", marginBottom: "8px" }}
          >
            나레이터 이름 <span style={{ color: "red" }}>*</span>
          </label>
          <input
            id="narrator-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 엄마, 아빠, 할머니"
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "8px",
              border: "2px solid #e0e0e0",
              fontSize: "16px",
            }}
            disabled={loading}
            required
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label
            htmlFor="voice-file"
            style={{ display: "block", marginBottom: "8px" }}
          >
            음성 파일 <span style={{ color: "red" }}>*</span>
          </label>
          <input
            ref={voiceInputRef}
            id="voice-file"
            type="file"
            accept="audio/*"
            onChange={handleVoiceChange}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "8px",
              border: "2px solid #e0e0e0",
            }}
            disabled={loading}
            required
          />
          {voiceFile && (
            <p style={{ marginTop: "8px", color: "#666", fontSize: "14px" }}>
              선택된 파일: {voiceFile.name}
            </p>
          )}
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label
            htmlFor="narrator-image"
            style={{ display: "block", marginBottom: "8px" }}
          >
            나레이터 이미지{" "}
            <span style={{ color: "#666", fontSize: "14px" }}>(선택사항)</span>
          </label>
          <input
            ref={imageInputRef}
            id="narrator-image"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "8px",
              border: "2px solid #e0e0e0",
            }}
            disabled={loading}
          />
          {imageFile && (
            <p style={{ marginTop: "8px", color: "#666", fontSize: "14px" }}>
              선택된 이미지: {imageFile.name}
            </p>
          )}
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="submit"
            disabled={loading || !name || !voiceFile}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: "8px",
              border: "none",
              background: loading
                ? "#ccc"
                : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "등록 중..." : "나레이터 등록"}
          </button>

          <button
            type="button"
            onClick={resetForm}
            disabled={loading}
            style={{
              padding: "12px 24px",
              borderRadius: "8px",
              border: "2px solid #e0e0e0",
              background: "white",
              color: "#666",
              fontSize: "16px",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            초기화
          </button>
        </div>
      </form>

      {/* Existing Narrators List */}
      {narrators.length > 0 && (
        <div style={{ marginTop: "30px" }}>
          <h3 style={{ marginBottom: "20px" }}>등록된 나레이터</h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "15px",
            }}
          >
            {narrators.map((narrator) => (
              <div
                key={narrator.id}
                style={{
                  padding: "15px",
                  border: "2px solid #e0e0e0",
                  borderRadius: "12px",
                  backgroundColor: "white",
                  position: "relative",
                }}
              >
                {narrator.imageUrl ? (
                  <img
                    src={`${API_URL}${narrator.imageUrl}`}
                    alt={narrator.name}
                    style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      margin: "0 auto 10px",
                      display: "block",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "50%",
                      backgroundColor: "#e0e0e0",
                      margin: "0 auto 10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "24px",
                    }}
                  >
                    👤
                  </div>
                )}

                <h4 style={{ textAlign: "center", margin: "10px 0" }}>
                  {narrator.name}
                </h4>
                <p
                  style={{
                    fontSize: "12px",
                    color: "#666",
                    textAlign: "center",
                  }}
                >
                  {new Date(narrator.createdAt).toLocaleDateString()}
                </p>

                <div style={{ display: "flex", gap: "5px", marginTop: "10px" }}>
                  <button
                    onClick={() => handlePreviewNarrator(narrator.id)}
                    disabled={playingPreview === narrator.id}
                    style={{
                      flex: 1,
                      padding: "8px",
                      borderRadius: "6px",
                      border: "1px solid #667eea",
                      backgroundColor:
                        playingPreview === narrator.id ? "#667eea" : "white",
                      color:
                        playingPreview === narrator.id ? "white" : "#667eea",
                      cursor:
                        playingPreview === narrator.id
                          ? "not-allowed"
                          : "pointer",
                      fontSize: "12px",
                    }}
                  >
                    {playingPreview === narrator.id ? "재생 중..." : "미리듣기"}
                  </button>

                  <button
                    onClick={() => handleDeleteNarrator(narrator.id)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "none",
                      backgroundColor: "#ff4444",
                      color: "white",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hidden audio element for preview */}
      <audio ref={audioRef} style={{ display: "none" }} />
    </div>
  );
};

export default NarratorRegister;

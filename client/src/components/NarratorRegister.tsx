import axios from "axios";
import React, { useRef, useState } from "react";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

interface Narrator {
  id: string;
  name: string;
  voiceId: string;
  imageUrl?: string;
  description?: string;
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
  // const [narrators, setNarrators] = useState<Narrator[]>([]);
  // const [playingPreview, setPlayingPreview] = useState<string | null>(null);
  // const [selectedNarratorId, setSelectedNarratorId] = useState<string>("");

  const voiceInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // useEffect(() => {
  //   fetchNarrators();
  // }, []);

  // const fetchNarrators = async () => {
  //   try {
  //     const response = await axios.get(`${API_URL}/api/narrators`);
  //     setNarrators(response.data.narrators);
  //   } catch (err) {
  //     console.error("Error fetching narrators:", err);
  //   }
  // };

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

      // // Refresh narrator list
      // fetchNarrators();

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

  // const handlePreviewNarrator = async (narratorId: string) => {
  //   try {
  //     setPlayingPreview(narratorId);
  //     const response = await axios.get(
  //       `${API_URL}/api/narrators/${narratorId}/preview`
  //     );

  //     if (audioRef.current) {
  //       audioRef.current.src = `${API_URL}${response.data.previewUrl}`;
  //       audioRef.current.play();
  //       audioRef.current.onended = () => setPlayingPreview(null);
  //     }
  //   } catch (err) {
  //     console.error("Error playing preview:", err);
  //     alert("음성 미리듣기에 실패했습니다");
  //     setPlayingPreview(null);
  //   }
  // };

  const handleDeleteNarrator = async (narratorId: string) => {
    if (!window.confirm("이 나레이터를 삭제하시겠습니까?")) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/api/narrators/${narratorId}`);
      // fetchNarrators();
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
            Who's Voice? <span style={{ color: "red" }}>*</span>
          </label>
          <input
            id="narrator-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Mom, Dad, Grandmother"
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
            Voice File <span style={{ color: "red" }}>*</span>
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
              Selected File: {voiceFile.name}
            </p>
          )}
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label
            htmlFor="narrator-image"
            style={{ display: "block", marginBottom: "8px" }}
          >
            Narrator Image{" "}
            <span style={{ color: "#666", fontSize: "14px" }}>(Optional)</span>
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
              Selected Image: {imageFile.name}
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
            {loading ? "Registering..." : "Register"}
          </button>
        </div>
      </form>

      {/* Existing Narrators List */}
      {/* {narrators.length > 0 && (
        <div style={{ marginTop: "30px" }}>
          <h3 style={{ marginBottom: "20px" }}>등록된 나레이터</h3>
          <div style={{ marginBottom: "20px" }}>
            <select
              value={selectedNarratorId}
              onChange={(e) => setSelectedNarratorId(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                fontSize: "16px",
                border: "2px solid #e0e0e0",
                borderRadius: "8px",
                backgroundColor: "white",
                cursor: "pointer",
              }}
            >
              <option value="">나레이터를 선택하세요</option>
              {narrators.map((narrator) => (
                <option key={narrator.id} value={narrator.id}>
                  {narrator.name} - {narrator.description || `등록일: ${new Date(narrator.createdAt).toLocaleDateString()}`}
                </option>
              ))}
            </select>
          </div>
          
          <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            <button
              onClick={() => {
                if (selectedNarratorId) {
                  handlePreviewNarrator(selectedNarratorId);
                }
              }}
              disabled={!selectedNarratorId || playingPreview === selectedNarratorId}
              style={{
                padding: "10px 20px",
                backgroundColor: playingPreview === selectedNarratorId ? "#667eea" : "#4CAF50",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: !selectedNarratorId || playingPreview === selectedNarratorId ? "not-allowed" : "pointer",
                fontSize: "14px",
                opacity: !selectedNarratorId ? 0.5 : 1,
              }}
            >
              {playingPreview === selectedNarratorId ? "재생 중..." : "미리듣기"}
            </button>
            <button
              onClick={() => {
                if (selectedNarratorId) {
                  handleDeleteNarrator(selectedNarratorId);
                  setSelectedNarratorId("");
                }
              }}
              disabled={!selectedNarratorId}
              style={{
                padding: "10px 20px",
                backgroundColor: "#ff4444",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: !selectedNarratorId ? "not-allowed" : "pointer",
                fontSize: "14px",
                opacity: !selectedNarratorId ? 0.5 : 1,
              }}
            >
              삭제
            </button>
          </div>
        </div>
      )} */}

      {/* Hidden audio element for preview */}
      {/* <audio ref={audioRef} style={{ display: "none" }} /> */}
    </div>
  );
};

export default NarratorRegister;

import { motion, Variants } from "framer-motion";
import { useState } from "react";
import { useStoryStore } from "../../store/useStoryStore";

const fadeUp: Variants = {
  hidden: { 
    opacity: 0, 
    y: 60,
    scale: 0.9,
    rotateX: -10
  },
  show: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: { 
      duration: 0.9,
      ease: [0.43, 0.13, 0.23, 0.96],
      delay: 0.1
    }
  },
};

function NarratorRegisterOnboarding({ active }: { active: boolean }) {
  const { setVoiceFile } = useStoryStore();
  const [ttsId, setTtsId] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setVoiceFile(file);
      setTtsId("");
    }
  };

  const handleTtsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle TTS ID submission
  };

  return (
    <motion.form
      initial="hidden"
      animate={active ? "show" : "hidden"}
      variants={fadeUp}
      className="form-card"
      onSubmit={handleTtsSubmit}
    >
      <h2 className="form-title">Narrator Voice</h2>
      
      <div className="form-group" style={{ marginBottom: '1.5rem' }}>
        <label className="form-label">
          Upload voice sample
        </label>
        <div style={{ position: 'relative' }}>
          <input
            className="file-upload-input"
            type="file"
            accept="audio/*"
            id="voice-upload"
            onChange={handleFileUpload}
          />
          <label
            htmlFor="voice-upload"
            className={`file-upload-label ${uploadedFile ? 'has-file' : ''}`}
          >
            {uploadedFile ? (
              <span>✅ {uploadedFile.name}</span>
            ) : (
              <span style={{ color: '#6b7280' }}>🎤 Click to upload audio file</span>
            )}
          </label>
        </div>
      </div>
      
      <div className="divider">
        <div className="divider-line"></div>
        <div className="divider-text">
          <span>or</span>
        </div>
      </div>
      
      <div className="form-group" style={{ marginBottom: '1.5rem' }}>
        <label className="form-label">
          TTS Voice ID (e.g., ElevenLabs)
        </label>
        <input
          className="form-input"
          name="ttsId"
          placeholder="21m00Tcm4TlvDq8ikWAM"
          value={ttsId}
          onChange={(e) => {
            setTtsId(e.target.value);
            setUploadedFile(null);
          }}
        />
      </div>
      
      <button
        className="btn-gradient"
        type="submit"
      >
        Register Narrator
      </button>
      
      <p style={{ 
        marginTop: '1rem', 
        fontSize: '0.875rem', 
        textAlign: 'center', 
        color: '#6b7280' 
      }}>
        Optional: You can skip this step and use default voice
      </p>
    </motion.form>
  );
}

export default NarratorRegisterOnboarding;
import React, { useState, useRef, ChangeEvent } from 'react';
import { useStoryStore } from '../store/useStoryStore';

const VoiceUpload: React.FC = () => {
  const { voiceFile, setVoiceFile } = useStoryStore();
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError('');

    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      setError('음성 파일만 업로드 가능합니다');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('파일 크기는 10MB 이하여야 합니다');
      return;
    }

    // Set the file in store
    setVoiceFile(file);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleDelete = () => {
    setVoiceFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="voice-upload-container">
      <h2>
        음성 업로드 <span style={{ fontSize: '0.8em', color: '#666' }}>(선택사항)</span>
      </h2>
      <p style={{ fontSize: '0.9em', color: '#666' }}>
        음성 파일을 업로드하지 않으면 기본 음성이 사용됩니다
      </p>
      
      {!voiceFile ? (
        <div className="upload-area">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            id="voice-file-input"
            aria-label="음성 파일 선택"
          />
          <label htmlFor="voice-file-input" style={{ display: 'none' }}>
            음성 파일 선택
          </label>
          <button onClick={handleButtonClick} aria-label="음성 파일 선택">
            음성 파일 선택
          </button>
        </div>
      ) : (
        <div className="file-info">
          <p>업로드된 파일: <strong>{voiceFile.name}</strong></p>
          <div style={{ marginTop: '10px' }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              id="voice-file-change"
              aria-label="음성 파일 선택"
            />
            <label htmlFor="voice-file-change" style={{ display: 'none' }}>
              음성 파일 선택
            </label>
            <button 
              onClick={handleButtonClick} 
              aria-label="음성 변경"
              style={{ marginRight: '10px' }}
            >
              음성 변경
            </button>
            <button 
              onClick={handleDelete} 
              aria-label="음성 삭제"
              style={{ background: '#dc3545', color: 'white' }}
            >
              음성 삭제
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="error-message" style={{ color: 'red', marginTop: '10px' }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default VoiceUpload;
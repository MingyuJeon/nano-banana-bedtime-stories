import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useStoryStore } from '../store/useStoryStore';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

interface Narrator {
  id: string;
  name: string;
  voiceId: string;
  imageUrl?: string;
  createdAt?: number;
  isDefault?: boolean;
}

interface NarratorSelectorProps {
  onSelect?: (narrator: Narrator | null) => void;
}

const NarratorSelector: React.FC<NarratorSelectorProps> = ({ onSelect }) => {
  const { selectedNarrator, setSelectedNarrator } = useStoryStore();
  const [narrators, setNarrators] = useState<Narrator[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [playingPreview, setPlayingPreview] = useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchNarrators();
  }, []);

  const fetchNarrators = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${API_URL}/api/narrators`);
      setNarrators(response.data.narrators);
    } catch (err) {
      console.error('Error fetching narrators:', err);
      setError('나레이터 목록을 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectNarrator = (narrator: Narrator | null) => {
    setSelectedNarrator(narrator);
    if (onSelect) {
      onSelect(narrator);
    }
  };

  const handlePreviewNarrator = async (e: React.MouseEvent, narratorId: string) => {
    e.stopPropagation(); // Prevent narrator selection
    
    try {
      setPlayingPreview(narratorId);
      const response = await axios.get(`${API_URL}/api/narrators/${narratorId}/preview`);
      
      if (audioRef.current) {
        audioRef.current.src = `${API_URL}${response.data.previewUrl}`;
        audioRef.current.play();
        audioRef.current.onended = () => setPlayingPreview(null);
      }
    } catch (err) {
      console.error('Error playing preview:', err);
      alert('음성 미리듣기에 실패했습니다');
      setPlayingPreview(null);
    }
  };

  const handleDeleteNarrator = async (narratorId: string) => {
    if (!window.confirm('이 나레이터를 삭제하시겠습니까?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/api/narrators/${narratorId}`);
      
      // Update local state
      setNarrators(narrators.filter(n => n.id !== narratorId));
      
      // Clear selection if deleted narrator was selected
      if (selectedNarrator?.id === narratorId) {
        setSelectedNarrator(null);
      }
    } catch (err) {
      console.error('Error deleting narrator:', err);
      alert('나레이터 삭제에 실패했습니다');
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '20px' }}>나레이터 목록을 불러오는 중...</div>;
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '20px', color: '#721c24' }}>
        {error}
        <button 
          onClick={fetchNarrators}
          style={{ marginLeft: '10px', padding: '5px 10px', cursor: 'pointer' }}
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="narrator-selector-container">
      <h3>나레이터 선택</h3>
      
      {narrators.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px',
          marginTop: '20px'
        }}>
          <p style={{ marginBottom: '10px', color: '#666' }}>
            등록된 나레이터가 없습니다
          </p>
          <p style={{ fontSize: '14px', color: '#999' }}>
            먼저 나레이터를 등록해주세요
          </p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: '15px',
          marginTop: '20px'
        }}>
          {/* Default narrator option */}
          <div
            onClick={() => handleSelectNarrator(null)}
            style={{
              padding: '15px',
              borderRadius: '12px',
              border: `3px solid ${!selectedNarrator ? '#667eea' : '#e0e0e0'}`,
              cursor: 'pointer',
              textAlign: 'center',
              backgroundColor: !selectedNarrator ? '#f0f4ff' : 'white',
              transition: 'all 0.3s ease',
            }}
          >
            <div style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 10px',
              backgroundColor: '#e0e0e0',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '30px',
            }}>
              🎤
            </div>
            <h4 style={{ margin: '10px 0 5px' }}>기본 음성</h4>
            <p style={{ fontSize: '12px', color: '#666' }}>시스템 기본</p>
          </div>

          {/* Registered narrators */}
          {narrators.map((narrator) => (
            <div
              key={narrator.id}
              onClick={() => handleSelectNarrator(narrator)}
              style={{
                padding: '15px',
                borderRadius: '12px',
                border: `3px solid ${selectedNarrator?.id === narrator.id ? '#667eea' : '#e0e0e0'}`,
                cursor: 'pointer',
                textAlign: 'center',
                backgroundColor: selectedNarrator?.id === narrator.id ? '#f0f4ff' : 'white',
                transition: 'all 0.3s ease',
                position: 'relative',
              }}
            >
              {/* Control buttons */}
              <div style={{
                position: 'absolute',
                top: '5px',
                right: '5px',
                display: 'flex',
                gap: '5px',
              }}>
                {/* Preview button */}
                <button
                  onClick={(e) => handlePreviewNarrator(e, narrator.id)}
                  disabled={playingPreview === narrator.id}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    border: 'none',
                    backgroundColor: playingPreview === narrator.id ? '#667eea' : '#4CAF50',
                    color: 'white',
                    cursor: playingPreview === narrator.id ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  aria-label={`${narrator.name} 미리듣기`}
                >
                  {playingPreview === narrator.id ? '♫' : '▶'}
                </button>
                
                {/* Delete button - hide for default narrator */}
                {!narrator.isDefault && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNarrator(narrator.id);
                    }}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      border: 'none',
                      backgroundColor: '#ff4444',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    aria-label={`${narrator.name} 삭제`}
                  >
                    ✕
                  </button>
                )}
              </div>

              {narrator.imageUrl ? (
                <img
                  src={`${API_URL}${narrator.imageUrl}`}
                  alt={narrator.name}
                  style={{
                    width: '80px',
                    height: '80px',
                    margin: '0 auto 10px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <div style={{
                  width: '80px',
                  height: '80px',
                  margin: '0 auto 10px',
                  backgroundColor: '#e0e0e0',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '30px',
                }}>
                  👤
                </div>
              )}
              <h4 style={{ margin: '10px 0 5px' }}>{narrator.name}</h4>
              {narrator.createdAt && (
                <p style={{ fontSize: '12px', color: '#666' }}>
                  {new Date(narrator.createdAt).toLocaleDateString()}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedNarrator && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: '#f0f4ff', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <p>
            선택된 나레이터: <strong>{selectedNarrator.name}</strong>
          </p>
        </div>
      )}

      {/* Hidden audio element for preview */}
      <audio ref={audioRef} style={{ display: 'none' }} />
    </div>
  );
};

export default NarratorSelector;
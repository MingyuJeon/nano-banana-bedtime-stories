import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

interface Narrator {
  id: string;
  name: string;
  voiceId: string;
  imageUrl?: string;
  createdAt?: number;
  isDefault?: boolean;
}

interface NarratorListProps {
  onClose?: () => void;
}

const NarratorList: React.FC<NarratorListProps> = ({ onClose }) => {
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

  const handlePreviewNarrator = async (e: React.MouseEvent, narratorId: string) => {
    e.stopPropagation();
    
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
      
      alert('나레이터가 삭제되었습니다');
    } catch (err) {
      console.error('Error deleting narrator:', err);
      alert('나레이터 삭제에 실패했습니다');
    }
  };

  if (loading) {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      }}>
        <div className="loading-spinner"></div>
        <p>나레이터 목록을 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '30px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      maxWidth: '1200px',
      margin: '0 auto',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '28px', color: '#333' }}>🎙️ 나레이터 목록</h2>
          <p style={{ margin: '10px 0 0 0', color: '#666' }}>
            등록된 나레이터를 관리하고 미리들을 수 있습니다
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: '#667eea',
              color: 'white',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
            }}
          >
            닫기
          </button>
        )}
      </div>

      {error && (
        <div style={{
          padding: '15px',
          backgroundColor: '#fee',
          color: '#721c24',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          {error}
          <button 
            onClick={fetchNarrators}
            style={{
              padding: '5px 10px',
              borderRadius: '4px',
              border: 'none',
              background: '#721c24',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            다시 시도
          </button>
        </div>
      )}

      {narrators.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '12px',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🎤</div>
          <h3 style={{ marginBottom: '10px', color: '#333' }}>
            등록된 나레이터가 없습니다
          </h3>
          <p style={{ color: '#666' }}>
            홈 화면에서 나레이터를 등록해주세요
          </p>
        </div>
      ) : (
        <>
          <div style={{
            padding: '15px',
            backgroundColor: '#f0f4ff',
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <span style={{ fontSize: '20px' }}>ℹ️</span>
            <div>
              <strong>총 {narrators.length}명</strong>의 나레이터가 등록되어 있습니다
            </div>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '20px',
          }}>
            {narrators.map((narrator) => (
              <div
                key={narrator.id}
                style={{
                  padding: '20px',
                  borderRadius: '12px',
                  border: '2px solid #e0e0e0',
                  backgroundColor: 'white',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  cursor: 'default',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Narrator Image */}
                <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                  {narrator.imageUrl ? (
                    <img
                      src={`${API_URL}${narrator.imageUrl}`}
                      alt={narrator.name}
                      style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '3px solid #f0f4ff',
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '100px',
                      height: '100px',
                      margin: '0 auto',
                      backgroundColor: '#f0f4ff',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '40px',
                      border: '3px solid #e0e7ff',
                    }}>
                      👤
                    </div>
                  )}
                </div>

                {/* Narrator Info */}
                <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#333' }}>
                    {narrator.name}
                  </h3>
                  {narrator.createdAt && (
                    <p style={{ margin: 0, fontSize: '12px', color: '#999' }}>
                      {new Date(narrator.createdAt).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div style={{
                  display: 'flex',
                  gap: '10px',
                  justifyContent: 'center',
                }}>
                  {/* Preview button */}
                  <button
                    onClick={(e) => handlePreviewNarrator(e, narrator.id)}
                    disabled={playingPreview === narrator.id}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: playingPreview === narrator.id ? '#667eea' : '#4CAF50',
                      color: 'white',
                      cursor: playingPreview === narrator.id ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      transition: 'background-color 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (playingPreview !== narrator.id) {
                        e.currentTarget.style.backgroundColor = '#45a049';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (playingPreview !== narrator.id) {
                        e.currentTarget.style.backgroundColor = '#4CAF50';
                      }
                    }}
                  >
                    {playingPreview === narrator.id ? '♫ 재생 중' : '▶ 미리듣기'}
                  </button>
                  
                  {/* Delete button - hide for default narrator */}
                  {!narrator.isDefault && (
                    <button
                      onClick={() => handleDeleteNarrator(narrator.id)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: '#ff4444',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        transition: 'background-color 0.3s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#cc0000';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#ff4444';
                      }}
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Hidden audio element for preview */}
      <audio ref={audioRef} style={{ display: 'none' }} />
    </div>
  );
};

export default NarratorList;
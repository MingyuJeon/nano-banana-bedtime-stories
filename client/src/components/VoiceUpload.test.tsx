import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VoiceUpload from './VoiceUpload';
import { useStoryStore } from '../store/useStoryStore';

// Mock the store
jest.mock('../store/useStoryStore');

describe('VoiceUpload Component', () => {
  const mockSetVoiceFile = jest.fn();
  
  beforeEach(() => {
    (useStoryStore as unknown as jest.Mock).mockReturnValue({
      voiceFile: null,
      setVoiceFile: mockSetVoiceFile,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders upload section with optional label', () => {
    render(<VoiceUpload />);
    expect(screen.getByText(/음성 업로드/i)).toBeInTheDocument();
    expect(screen.getByText(/선택사항/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /음성 파일 선택/i })).toBeInTheDocument();
  });

  it('shows skip option since voice is optional', () => {
    render(<VoiceUpload />);
    expect(screen.getByText(/음성 파일을 업로드하지 않으면 기본 음성이 사용됩니다/i)).toBeInTheDocument();
  });

  it('accepts audio files', async () => {
    render(<VoiceUpload />);
    
    const file = new File(['audio'], 'voice.mp3', { type: 'audio/mp3' });
    const input = screen.getByLabelText(/음성 파일 선택/i) as HTMLInputElement;
    
    await userEvent.upload(input, file);
    
    await waitFor(() => {
      expect(mockSetVoiceFile).toHaveBeenCalledWith(file);
    });
  });

  it('rejects non-audio files', async () => {
    render(<VoiceUpload />);
    
    const file = new File(['text'], 'document.txt', { type: 'text/plain' });
    const input = screen.getByLabelText(/음성 파일 선택/i) as HTMLInputElement;
    
    await userEvent.upload(input, file);
    
    await waitFor(() => {
      expect(screen.getByText(/음성 파일만 업로드 가능합니다/i)).toBeInTheDocument();
      expect(mockSetVoiceFile).not.toHaveBeenCalled();
    });
  });

  it('shows file name when voice is uploaded', async () => {
    const mockFile = new File(['audio'], 'voice.mp3', { type: 'audio/mp3' });
    
    (useStoryStore as unknown as jest.Mock).mockReturnValue({
      voiceFile: mockFile,
      setVoiceFile: mockSetVoiceFile,
    });

    render(<VoiceUpload />);
    
    expect(screen.getByText(/voice.mp3/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /음성 변경/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /음성 삭제/i })).toBeInTheDocument();
  });

  it('allows removing uploaded voice', async () => {
    const mockFile = new File(['audio'], 'voice.mp3', { type: 'audio/mp3' });
    
    (useStoryStore as unknown as jest.Mock).mockReturnValue({
      voiceFile: mockFile,
      setVoiceFile: mockSetVoiceFile,
    });

    render(<VoiceUpload />);
    
    const deleteButton = screen.getByRole('button', { name: /음성 삭제/i });
    await userEvent.click(deleteButton);
    
    expect(mockSetVoiceFile).toHaveBeenCalledWith(null);
  });

  it('validates file size limit (10MB)', async () => {
    render(<VoiceUpload />);
    
    // Create a mock large file (>10MB)
    const largeFile = new File([new Array(11 * 1024 * 1024).join('a')], 'large.mp3', { type: 'audio/mp3' });
    const inputs = screen.getAllByLabelText(/음성 파일 선택/i);
    const input = inputs.find(el => el.tagName === 'INPUT') as HTMLInputElement;
    
    await userEvent.upload(input, largeFile);
    
    await waitFor(() => {
      expect(screen.getByText(/파일 크기는 10MB 이하여야 합니다/i)).toBeInTheDocument();
      expect(mockSetVoiceFile).not.toHaveBeenCalled();
    });
  });

  it('accepts various audio formats', async () => {
    const formats = [
      { file: new File(['audio'], 'voice.mp3', { type: 'audio/mp3' }), name: 'MP3' },
      { file: new File(['audio'], 'voice.wav', { type: 'audio/wav' }), name: 'WAV' },
      { file: new File(['audio'], 'voice.m4a', { type: 'audio/m4a' }), name: 'M4A' },
      { file: new File(['audio'], 'voice.ogg', { type: 'audio/ogg' }), name: 'OGG' },
    ];

    for (const format of formats) {
      render(<VoiceUpload />);
      
      const inputs = screen.getAllByLabelText(/음성 파일 선택/i);
      const input = inputs.find(el => el.tagName === 'INPUT') as HTMLInputElement;
      await userEvent.upload(input, format.file);
      
      await waitFor(() => {
        expect(mockSetVoiceFile).toHaveBeenCalledWith(format.file);
      });
      
      mockSetVoiceFile.mockClear();
    }
  });
});
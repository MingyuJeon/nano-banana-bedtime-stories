import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ImageUpload from './ImageUpload';
import { useStoryStore } from '../store/useStoryStore';

// Mock the store
jest.mock('../store/useStoryStore');

describe('ImageUpload Component', () => {
  const mockSetUserImage = jest.fn();
  
  beforeEach(() => {
    (useStoryStore as unknown as jest.Mock).mockReturnValue({
      userImage: null,
      setUserImage: mockSetUserImage,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders upload button when no image is selected', () => {
    render(<ImageUpload />);
    expect(screen.getByText(/이미지 업로드/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /파일 선택/i })).toBeInTheDocument();
  });

  it('shows preview when image is selected', async () => {
    render(<ImageUpload />);
    
    const file = new File(['test'], 'test.png', { type: 'image/png' });
    const input = screen.getByLabelText(/파일 선택/i) as HTMLInputElement;
    
    await userEvent.upload(input, file);
    
    await waitFor(() => {
      expect(mockSetUserImage).toHaveBeenCalledWith(file);
    });
  });

  it('validates file type - only accepts images', async () => {
    render(<ImageUpload />);
    
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    const input = screen.getByLabelText(/파일 선택/i) as HTMLInputElement;
    
    await userEvent.upload(input, file);
    
    await waitFor(() => {
      expect(screen.getByText(/이미지 파일만 업로드 가능합니다/i)).toBeInTheDocument();
      expect(mockSetUserImage).not.toHaveBeenCalled();
    });
  });

  it('shows image preview after upload', async () => {
    const mockFile = new File(['test'], 'test.png', { type: 'image/png' });
    
    (useStoryStore as unknown as jest.Mock).mockReturnValue({
      userImage: mockFile,
      setUserImage: mockSetUserImage,
    });

    render(<ImageUpload />);
    
    expect(screen.getByAltText(/업로드된 이미지/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /이미지 변경/i })).toBeInTheDocument();
  });

  it('allows image replacement', async () => {
    const mockFile = new File(['test'], 'test.png', { type: 'image/png' });
    
    (useStoryStore as unknown as jest.Mock).mockReturnValue({
      userImage: mockFile,
      setUserImage: mockSetUserImage,
    });

    render(<ImageUpload />);
    
    const changeButton = screen.getByRole('button', { name: /이미지 변경/i });
    await userEvent.click(changeButton);
    
    const newFile = new File(['new'], 'new.png', { type: 'image/png' });
    const input = screen.getByLabelText(/파일 선택/i) as HTMLInputElement;
    
    await userEvent.upload(input, newFile);
    
    await waitFor(() => {
      expect(mockSetUserImage).toHaveBeenCalledWith(newFile);
    });
  });

  it('shows file size limit warning for large files', async () => {
    render(<ImageUpload />);
    
    // Create a mock large file (>5MB)
    const largeFile = new File([new Array(6 * 1024 * 1024).join('a')], 'large.png', { type: 'image/png' });
    const input = screen.getByLabelText(/파일 선택/i) as HTMLInputElement;
    
    await userEvent.upload(input, largeFile);
    
    await waitFor(() => {
      expect(screen.getByText(/파일 크기는 5MB 이하여야 합니다/i)).toBeInTheDocument();
      expect(mockSetUserImage).not.toHaveBeenCalled();
    });
  });
});
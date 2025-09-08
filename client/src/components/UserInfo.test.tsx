import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserInfo from './UserInfo';
import { useStoryStore } from '../store/useStoryStore';

// Mock the store
jest.mock('../store/useStoryStore');

describe('UserInfo Component', () => {
  const mockSetUserInfo = jest.fn();
  
  beforeEach(() => {
    (useStoryStore as unknown as jest.Mock).mockReturnValue({
      userInfo: null,
      setUserInfo: mockSetUserInfo,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders age input and gender selection', () => {
    render(<UserInfo />);
    
    expect(screen.getByLabelText(/나이/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/성별/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /저장/i })).toBeInTheDocument();
  });

  it('validates age input - only accepts numbers', async () => {
    render(<UserInfo />);
    
    const ageInput = screen.getByLabelText(/나이/i) as HTMLInputElement;
    await userEvent.type(ageInput, 'abc');
    
    // When typing non-numeric characters, the input should remain empty
    expect(ageInput.value).toBe('');
  });

  it('validates age range (1-100)', async () => {
    render(<UserInfo />);
    
    const ageInput = screen.getByLabelText(/나이/i);
    const saveButton = screen.getByRole('button', { name: /저장/i });
    
    // Test age < 1
    await userEvent.clear(ageInput);
    await userEvent.type(ageInput, '0');
    await userEvent.click(saveButton);
    
    expect(screen.getByText(/나이는 1세에서 100세 사이여야 합니다/i)).toBeInTheDocument();
    expect(mockSetUserInfo).not.toHaveBeenCalled();
    
    // Test age > 100
    await userEvent.clear(ageInput);
    await userEvent.type(ageInput, '101');
    await userEvent.click(saveButton);
    
    expect(screen.getByText(/나이는 1세에서 100세 사이여야 합니다/i)).toBeInTheDocument();
  });

  it('saves user info when valid data is provided', async () => {
    render(<UserInfo />);
    
    const ageInput = screen.getByLabelText(/나이/i);
    const genderSelect = screen.getByLabelText(/성별/i);
    const saveButton = screen.getByRole('button', { name: /저장/i });
    
    await userEvent.type(ageInput, '7');
    await userEvent.selectOptions(genderSelect, 'male');
    await userEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockSetUserInfo).toHaveBeenCalledWith({
        age: 7,
        gender: 'male',
      });
    });
  });

  it('displays saved user info', () => {
    (useStoryStore as unknown as jest.Mock).mockReturnValue({
      userInfo: { age: 8, gender: 'female' },
      setUserInfo: mockSetUserInfo,
    });
    
    render(<UserInfo />);
    
    const ageInput = screen.getByLabelText(/나이/i) as HTMLInputElement;
    const genderSelect = screen.getByLabelText(/성별/i) as HTMLSelectElement;
    
    expect(ageInput.value).toBe('8');
    expect(genderSelect.value).toBe('female');
  });

  it('allows editing saved user info', async () => {
    (useStoryStore as unknown as jest.Mock).mockReturnValue({
      userInfo: { age: 8, gender: 'female' },
      setUserInfo: mockSetUserInfo,
    });
    
    render(<UserInfo />);
    
    const ageInput = screen.getByLabelText(/나이/i);
    const genderSelect = screen.getByLabelText(/성별/i);
    const saveButton = screen.getByRole('button', { name: /저장/i });
    
    await userEvent.clear(ageInput);
    await userEvent.type(ageInput, '10');
    await userEvent.selectOptions(genderSelect, 'other');
    await userEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockSetUserInfo).toHaveBeenCalledWith({
        age: 10,
        gender: 'other',
      });
    });
  });

  it('requires both age and gender to save', async () => {
    render(<UserInfo />);
    
    const saveButton = screen.getByRole('button', { name: /저장/i });
    
    await userEvent.click(saveButton);
    
    expect(screen.getByText(/나이와 성별을 모두 입력해주세요/i)).toBeInTheDocument();
    expect(mockSetUserInfo).not.toHaveBeenCalled();
  });
});
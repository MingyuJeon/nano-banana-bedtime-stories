import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock axios to avoid import issues in tests
jest.mock('axios');

test('renders app header', () => {
  render(<App />);
  const headerElement = screen.getByText(/AI 동화책 만들기/i);
  expect(headerElement).toBeInTheDocument();
});
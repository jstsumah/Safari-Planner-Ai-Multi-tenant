import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';
import React from 'react';

describe('App Component', () => {
  it('renders without crashing', () => {
    // We mock Supabase and other external dependencies if needed
    // For now, just a basic render test
    render(<App />);
    // Check if some basic text is present
    expect(screen.getByText(/Safari/i)).toBeDefined();
  });
});

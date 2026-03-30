import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import LanguageSelectionPage from './LanguageSelectionPage';
import { useAppStore } from '../../store';

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('LanguageSelectionPage', () => {
  beforeEach(() => {
    useAppStore.setState({ language: 'he', completedStep: -1 });
    mockNavigate.mockClear();
  });

  it('renders Hebrew and Arabic buttons', () => {
    render(
      <MemoryRouter>
        <LanguageSelectionPage />
      </MemoryRouter>,
    );
    expect(screen.getByText('עברית')).toBeInTheDocument();
    expect(screen.getByText('عربية')).toBeInTheDocument();
  });

  it('selecting Hebrew sets language=he, completedStep=0, and navigates', () => {
    render(
      <MemoryRouter>
        <LanguageSelectionPage />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByText('עברית'));
    expect(useAppStore.getState().language).toBe('he');
    expect(useAppStore.getState().completedStep).toBe(0);
    expect(mockNavigate).toHaveBeenCalledWith('/onboarding/api-key');
  });

  it('selecting Arabic sets language=ar, completedStep=0, and navigates', () => {
    render(
      <MemoryRouter>
        <LanguageSelectionPage />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByText('عربية'));
    expect(useAppStore.getState().language).toBe('ar');
    expect(useAppStore.getState().completedStep).toBe(0);
    expect(mockNavigate).toHaveBeenCalledWith('/onboarding/api-key');
  });
});

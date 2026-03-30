import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import SetupPage from './SetupPage';
import { useAppStore } from '../../store';
import * as geminiService from '../../services/gemini';

const mockNavigate = vi.fn();
vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

const testConnection = vi.spyOn(geminiService, 'testGeminiConnection');

describe('SetupPage', () => {
  beforeEach(() => {
    useAppStore.setState({ studentName: '', geminiApiKey: '', aiProvider: 'gemini', completedStep: 0 });
    mockNavigate.mockClear();
    testConnection.mockReset();
  });

  it('renders name, API key, and model fields', () => {
    render(
      <MemoryRouter>
        <SetupPage />
      </MemoryRouter>,
    );
    expect(screen.getByText(/שם/)).toBeInTheDocument();
    expect(screen.getByText(/Gemini AI/)).toBeInTheDocument();
    expect(screen.getByText(/דגם/)).toBeInTheDocument();
  });

  it('shows validation errors when testing with empty fields', async () => {
    render(
      <MemoryRouter>
        <SetupPage />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByText('בדוק חיבור'));
    await waitFor(() => {
      expect(screen.getAllByText('שדה חובה').length).toBeGreaterThan(0);
    });
    expect(testConnection).not.toHaveBeenCalled();
  });

  it('shows success message on successful connection test', async () => {
    testConnection.mockResolvedValueOnce({ ok: true });
    render(
      <MemoryRouter>
        <SetupPage />
      </MemoryRouter>,
    );
    fireEvent.change(screen.getByLabelText('שם התלמיד'), { target: { value: 'Test Student' } });
    fireEvent.change(screen.getByLabelText('מפתח API'), { target: { value: 'AIzaXXXX' } });
    fireEvent.click(screen.getByText('בדוק חיבור'));
    await waitFor(() => {
      expect(screen.getByText(/החיבור הצליח/)).toBeInTheDocument();
    });
  });

  it('shows error message on failed connection test', async () => {
    testConnection.mockResolvedValueOnce({ ok: false, error: 'Invalid API key' });
    render(
      <MemoryRouter>
        <SetupPage />
      </MemoryRouter>,
    );
    fireEvent.change(screen.getByLabelText('שם התלמיד'), { target: { value: 'Test Student' } });
    fireEvent.change(screen.getByLabelText('מפתח API'), { target: { value: 'bad-key' } });
    fireEvent.click(screen.getByText('בדוק חיבור'));
    await waitFor(() => {
      expect(screen.getByText('Invalid API key')).toBeInTheDocument();
    });
  });

  it('saves state and navigates to /extract/code when Next is clicked after success', async () => {
    testConnection.mockResolvedValueOnce({ ok: true });
    render(
      <MemoryRouter>
        <SetupPage />
      </MemoryRouter>,
    );
    fireEvent.change(screen.getByLabelText('שם התלמיד'), { target: { value: 'Avi Cohen' } });
    fireEvent.change(screen.getByLabelText('מפתח API'), { target: { value: 'AIzaXXXX' } });
    fireEvent.click(screen.getByText('בדוק חיבור'));
    await waitFor(() => expect(screen.getByText(/הצליח/)).toBeInTheDocument());

    fireEvent.click(screen.getByText('הבא'));
    expect(useAppStore.getState().studentName).toBe('Avi Cohen');
    expect(useAppStore.getState().completedStep).toBe(1);
    expect(mockNavigate).toHaveBeenCalledWith('/extract/code');
  });
});

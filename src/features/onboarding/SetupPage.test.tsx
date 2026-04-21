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

const testGeminiConnection = vi.spyOn(geminiService, 'testGeminiConnection');
const testOpenAIConnection = vi.spyOn(geminiService, 'testOpenAIConnection');
const testClaudeConnection = vi.spyOn(geminiService, 'testClaudeConnection');
const testOllamaConnection = vi.spyOn(geminiService, 'testOllamaConnection');

describe('SetupPage', () => {
  beforeEach(() => {
    useAppStore.setState({
      studentName: '',
      aiProvider: 'gemini',
      geminiApiKey: '',
      geminiModel: 'gemini-2.5-flash',
      openaiApiKey: '',
      openaiModel: 'gpt-4.1-mini',
      completedStep: 0,
    });
    mockNavigate.mockClear();
    testGeminiConnection.mockReset();
    testOpenAIConnection.mockReset();
    testClaudeConnection.mockReset();
    testOllamaConnection.mockReset();
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
    expect(testGeminiConnection).not.toHaveBeenCalled();
  });

  it('shows success message on successful connection test', async () => {
    testGeminiConnection.mockResolvedValueOnce({ ok: true });
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
    testGeminiConnection.mockResolvedValueOnce({ ok: false, error: 'Invalid API key' });
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
    testGeminiConnection.mockResolvedValueOnce({ ok: true });
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

  it('supports OpenAI provider setup and stores its credentials', async () => {
    testOpenAIConnection.mockResolvedValueOnce({ ok: true });
    render(
      <MemoryRouter>
        <SetupPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText('OpenAI'));
    fireEvent.change(screen.getByLabelText('שם התלמיד'), { target: { value: 'Noa Levi' } });
    fireEvent.change(screen.getByLabelText('מפתח API'), { target: { value: 'sk-test' } });
    fireEvent.click(screen.getByText('בדוק חיבור'));

    await waitFor(() => {
      expect(screen.getByText(/החיבור הצליח/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('הבא'));
    expect(useAppStore.getState().aiProvider).toBe('openai');
    expect(useAppStore.getState().openaiApiKey).toBe('sk-test');
    expect(useAppStore.getState().completedStep).toBe(1);
    expect(mockNavigate).toHaveBeenCalledWith('/extract/code');
  });

  it('supports Claude provider setup and stores its credentials', async () => {
    testClaudeConnection.mockResolvedValueOnce({ ok: true });
    render(
      <MemoryRouter>
        <SetupPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText('Claude'));
    fireEvent.change(screen.getByLabelText('שם התלמיד'), { target: { value: 'Dana Cohen' } });
    fireEvent.change(screen.getByLabelText('מפתח API'), { target: { value: 'sk-ant-test' } });
    fireEvent.click(screen.getByText('בדוק חיבור'));

    await waitFor(() => {
      expect(screen.getByText(/החיבור הצליח/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('הבא'));
    expect(useAppStore.getState().aiProvider).toBe('claude');
    expect(useAppStore.getState().claudeApiKey).toBe('sk-ant-test');
    expect(useAppStore.getState().completedStep).toBe(1);
    expect(mockNavigate).toHaveBeenCalledWith('/extract/code');
  });

  it('supports Ollama provider setup and stores its credentials', async () => {
    testOllamaConnection.mockResolvedValueOnce({ ok: true });
    render(
      <MemoryRouter>
        <SetupPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText('Ollama'));
    fireEvent.change(screen.getByLabelText('שם התלמיד'), { target: { value: 'Yossi Levi' } });
    fireEvent.click(screen.getByText('בדוק חיבור'));

    await waitFor(() => {
      expect(screen.getByText(/החיבור הצליח/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('הבא'));
    expect(useAppStore.getState().aiProvider).toBe('ollama');
    expect(useAppStore.getState().ollamaBaseUrl).toBe('http://localhost:11434');
    expect(useAppStore.getState().ollamaModel).toBe('llama3');
    expect(useAppStore.getState().completedStep).toBe(1);
    expect(mockNavigate).toHaveBeenCalledWith('/extract/code');
  });
});

import type { StateCreator } from 'zustand';
import type { AppState, ChapterKey, GenerationSlice } from '../types';

const CHAPTER_KEYS: ChapterKey[] = [
  'introduction',
  'techStack',
  'systemAnalysis',
  'database',
  'serverImplementation',
  'clientImplementation',
  'userGuide',
  'reflection',
  'difficulties',
  'whatNext',
  'appendices',
];

export const createGenerationSlice: StateCreator<AppState, [], [], GenerationSlice> = () => ({
  generatedContent: Object.fromEntries(
    CHAPTER_KEYS.map((k) => [k, { content: '', status: 'idle' as const }]),
  ) as GenerationSlice['generatedContent'],
  diagrams: {
    uml: { mermaidCode: '', status: 'idle' },
    erd: { mermaidCode: '', status: 'idle' },
    dfd: { mermaidCode: '', status: 'idle' },
    usecase: { mermaidCode: '', status: 'idle' },
  },
  generationQueue: [],
  isGenerating: false,
});

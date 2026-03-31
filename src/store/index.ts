import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createOnboardingSlice } from './slices/onboarding';
import { createExtractionSlice } from './slices/extraction';
import { createGenerationSlice } from './slices/generation';
import { createExportSlice } from './slices/export';
import type { AppState } from './types';

export const useAppStore = create<AppState>()(
  persist(
    (...args) => ({
      ...createOnboardingSlice(...args),
      ...createExtractionSlice(...args),
      ...createGenerationSlice(...args),
      ...createExportSlice(...args),
    }),
    {
      name: 'apb-session',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state): Partial<AppState> => ({
        // SECURITY: Never persist API key to any storage
        language: state.language,
        geminiModel: state.geminiModel,
        studentName: state.studentName,
        projectType: state.projectType,
        completedStep: state.completedStep,
        dbSchema: state.dbSchema,
        classes: state.classes, // serialisable — no File fields
        projectFiles: state.projectFiles, // serialisable — plain text
        // Strip File objects from screenshots — they are not serialisable
        screenshots: state.screenshots.map((s) => ({ ...s, file: null })),
        extractionErrors: state.extractionErrors,
        generatedContent: state.generatedContent,
        diagrams: state.diagrams,
        generationQueue: state.generationQueue,
        isGenerating: false, // never restore generating state
        previewHtml: state.previewHtml,
        exportStatus: 'idle',
        // EXPLICITLY EXCLUDED (not listed = not persisted):
        //   geminiApiKey — security requirement (NFR6)
        //   screenshots[].file — not serialisable
      }),
    },
  ),
);

export type { AppState } from './types';

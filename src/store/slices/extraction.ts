import type { StateCreator } from 'zustand';
import type { AppState, ExtractionSlice } from '../types';

export const createExtractionSlice: StateCreator<AppState, [], [], ExtractionSlice> = () => ({
  dbSchema: null,
  classes: [],
  projectFiles: [],
  screenshots: [],
  extractionErrors: {},
});

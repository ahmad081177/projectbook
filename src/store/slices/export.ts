import type { StateCreator } from 'zustand';
import type { AppState, ExportSlice } from '../types';

export const createExportSlice: StateCreator<AppState, [], [], ExportSlice> = () => ({
  previewHtml: '',
  exportStatus: 'idle',
  lastExportDate: undefined,
});

import type { StateCreator } from 'zustand';
import type { AppState, OnboardingSlice } from '../types';

export const createOnboardingSlice: StateCreator<AppState, [], [], OnboardingSlice> = () => ({
  language: 'he',
  geminiApiKey: '',
  geminiModel: 'gemini-2.5-flash',
  studentName: '',
  projectType: null,
  completedStep: -1,
});

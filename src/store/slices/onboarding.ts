import type { StateCreator } from 'zustand';
import type { AiProvider, AppState, OnboardingSlice } from '../types';

export const createOnboardingSlice: StateCreator<AppState, [], [], OnboardingSlice> = () => ({
  language: 'he',
  aiProvider: 'gemini' as AiProvider,
  geminiApiKey: '',
  geminiModel: 'gemini-2.5-flash',
  azureEndpoint: '',
  azureApiKey: '',
  azureDeploymentName: '',
  azureApiVersion: '2024-02-01',
  studentName: '',
  projectType: null,
  completedStep: -1,
});

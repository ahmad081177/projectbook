// LAYOUT RULE: Always use Tailwind logical properties.
// ✅ ms-4 me-4 ps-4 pe-4 text-start text-end
// ❌ ml-4 mr-4 pl-4 pr-4 text-left text-right

export const APP_NAME = 'AutoProjectBook';
export const SESSION_STORAGE_KEY = 'apb-session';
export const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com';
export const OPENAI_API_BASE = 'https://api.openai.com';
export const CLAUDE_API_BASE = 'https://api.anthropic.com';
export const OLLAMA_DEFAULT_BASE = 'http://localhost:11434';

export const CHAPTER_KEYS = [
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
] as const;

export const WIZARD_STEPS = {
  LANGUAGE: 0,
  API_KEY: 1,
  CODE_UPLOAD: 2,
  DB_UPLOAD: 3,
  SCREENSHOTS: 4,
  GENERATION: 5,
  REVIEW: 6,
  EXPORT: 7,
} as const;

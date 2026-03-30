import he from './he.json';
import ar from './ar.json';
import { useAppStore } from '../store';
import type { Language } from '../store/types';

const strings: Record<Language, Record<string, string>> = { he, ar };

export function useTranslation() {
  const language = useAppStore((s) => s.language);
  const t = (key: string): string => strings[language][key] ?? key;
  return { t, language };
}

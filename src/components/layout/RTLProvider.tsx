import { useEffect, type ReactNode } from 'react';
import { useAppStore } from '../../store';

export default function RTLProvider({ children }: { children: ReactNode }) {
  const language = useAppStore((s) => s.language);

  useEffect(() => {
    document.documentElement.setAttribute('dir', 'rtl');
    document.documentElement.setAttribute('lang', language);
  }, [language]);

  return <>{children}</>;
}

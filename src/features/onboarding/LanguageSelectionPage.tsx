import { useNavigate } from 'react-router';
import { useAppStore } from '../../store';
import type { Language } from '../../store/types';

interface LanguageOption {
  code: Language;
  label: string;
  flag: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: 'he', label: 'עברית', flag: '🇮🇱' },
  { code: 'ar', label: 'عربية', flag: '🇵🇸' },
];

export default function LanguageSelectionPage() {
  const navigate = useNavigate();

  const handleSelect = (lang: Language) => {
    useAppStore.setState({ language: lang, completedStep: 0 });
    void navigate('/onboarding/api-key');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="flex flex-col sm:flex-row gap-6 w-full max-w-lg">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleSelect(lang.code)}
            dir="rtl"
            className={[
              'flex-1 flex flex-col items-center justify-center gap-4 rounded-2xl',
              'bg-white border-2 border-gray-200 shadow-sm',
              'py-12 px-8',
              'text-gray-900 font-semibold text-2xl',
              'transition-all duration-150',
              'hover:border-blue-500 hover:shadow-md hover:scale-105',
              'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300',
              'active:scale-100',
            ].join(' ')}
          >
            <span className="text-6xl" aria-hidden="true">
              {lang.flag}
            </span>
            <span>{lang.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

import { useNavigate } from 'react-router';
import { useAppStore } from '../../store';
import type { Language } from '../../store/types';

interface LanguageOption {
  code: Language;
  label: string;
  flag: string;
  tagline: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: 'he', label: 'עברית', flag: '🇮🇱', tagline: 'לתלמידי הנדסת תוכנה בישראל' },
  { code: 'ar', label: 'عربية', flag: '🇵🇸', tagline: 'لطلاب هندسة البرمجيات في إسرائيل' },
];

export default function LanguageSelectionPage() {
  const navigate = useNavigate();

  const handleSelect = (lang: Language) => {
    useAppStore.setState({ language: lang, completedStep: 0 });
    void navigate('/onboarding/api-key');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-50 flex flex-col items-center justify-center p-6 gap-10">

      {/* Branding */}
      <div className="text-center flex flex-col items-center gap-3">
        <span className="text-6xl" aria-hidden="true">📚</span>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">AutoProjectBook</h1>
        <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
          כלי אוטומטי ליצירת ספר הפרוייקט / أداة إنشاء كتاب المشروع تلقائيًا
        </p>
      </div>

      {/* Language tiles */}
      <div className="w-full max-w-sm">
        <p className="text-center text-xs text-gray-400 font-medium uppercase tracking-widest mb-4">
          בחר שפה / اختر اللغة
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              dir="rtl"
              className={[
                'flex-1 flex flex-col items-center justify-center gap-3 rounded-2xl',
                'bg-white border-2 border-gray-200 shadow-sm',
                'py-10 px-6',
                'transition-all duration-150',
                'hover:border-blue-500 hover:shadow-md hover:scale-105',
                'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300',
                'active:scale-100',
              ].join(' ')}
            >
              <span className="text-5xl" aria-hidden="true">{lang.flag}</span>
              <span className="text-2xl font-bold text-gray-900">{lang.label}</span>
              <span className="text-xs text-gray-400 text-center">{lang.tagline}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Feature highlights */}
      <ul className="text-xs text-gray-500 flex flex-col gap-2 text-center">
        <li>✨ יוצר מסמך Word מוכן להגשה בעזרת Gemini AI / أنشئ مستند Word جاهز للتقديم</li>
        <li>🔒 פרטיותיך לא עוזבים את הדפדפן / بياناتك لا تغادر متصفحتك</li>
        <li>⚡ מהקוד שלך לספר מוכן בכמה דקות / من كودك إلى كتاب جاهز في دقائق</li>
      </ul>
    </div>
  );
}

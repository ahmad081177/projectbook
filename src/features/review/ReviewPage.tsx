import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import Badge from '../../components/ui/Badge';
import type { BadgeStatus } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { useTranslation } from '../../i18n';
import { generateChapter, type GenerationContext } from '../../services/gemini';
import { useAppStore } from '../../store';
import type { ChapterKey } from '../../store/types';

const CHAPTER_ORDER: ChapterKey[] = [
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
];

const CHAPTER_LABELS: Record<ChapterKey, string> = {
  introduction: 'מבוא',
  techStack: 'סקירת טכנולוגיות',
  systemAnalysis: 'ניתוח מערכת',
  database: 'מסד נתונים',
  serverImplementation: 'מימוש צד שרת',
  clientImplementation: 'מימוש צד לקוח',
  userGuide: 'מדריך משתמש',
  reflection: 'רפלקסיה',
  difficulties: 'קשיים ופתרונות',
  whatNext: 'פיתוחים עתידיים',
  appendices: 'נספחים',
};

function statusToBadge(status: string): { badge: BadgeStatus; label: string } {
  switch (status) {
    case 'complete': return { badge: 'success', label: '✓ הושלם' };
    case 'failed': return { badge: 'error', label: '✕ נכשל' };
    case 'generating': return { badge: 'info', label: '⟳ מייצר' };
    case 'skipped': return { badge: 'idle', label: '— דולג' };
    default: return { badge: 'idle', label: '○ ממתין' };
  }
}

export default function ReviewPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { chapterKey } = useParams<{ chapterKey?: ChapterKey }>();

  const generatedContent = useAppStore((s) => s.generatedContent);
  const language = useAppStore((s) => s.language);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const activeKey: ChapterKey = CHAPTER_ORDER.includes(chapterKey as ChapterKey)
    ? (chapterKey as ChapterKey)
    : 'introduction';

  const activeChapter = generatedContent[activeKey];

  const handleDownload = () => {
    void navigate('/export');
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    const s = useAppStore.getState();
    const ctx: GenerationContext = {
      apiKey: s.geminiApiKey,
      model: s.geminiModel,
      language: s.language,
      studentName: s.studentName,
      projectType: s.projectType,
      classes: s.classes,
      tables: s.dbSchema?.tables ?? [],
      screenshots: s.screenshots.map((sc) => ({
        screenName: sc.screenName,
        caption: sc.caption,
        userType: sc.userType,
      })),
    };
    useAppStore.setState((prev) => ({
      generatedContent: { ...prev.generatedContent, [activeKey]: { content: '', status: 'generating' } },
    }));
    try {
      const content = await generateChapter(activeKey, ctx);
      useAppStore.setState((prev) => ({
        generatedContent: { ...prev.generatedContent, [activeKey]: { content, status: 'complete', lastGenerated: new Date().toISOString() } },
      }));
    } catch {
      useAppStore.setState((prev) => ({
        generatedContent: { ...prev.generatedContent, [activeKey]: { content: '', status: 'failed' } },
      }));
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 flex flex-col sm:flex-row max-w-5xl w-full mx-auto">
        {/* Sidebar: chapter list */}
        <aside className="w-full sm:w-56 bg-white border-b sm:border-b-0 sm:border-e border-gray-200 p-4 flex flex-col gap-1">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            פרקים
          </h2>
          {CHAPTER_ORDER.map((key) => {
            const { badge, label } = statusToBadge(generatedContent[key].status);
            return (
              <button
                key={key}
                onClick={() => void navigate(`/review/${key}`)}
                className={[
                  'flex items-center justify-between w-full px-3 py-2 rounded-md text-start text-sm',
                  'transition-colors',
                  key === activeKey
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50',
                ].join(' ')}
              >
                <span>{CHAPTER_LABELS[key]}</span>
                <Badge status={badge}>{label}</Badge>
              </button>
            );
          })}

          {/* Diagrams */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              דיאגרמות
            </h2>
            <button
              onClick={() => void navigate('/review/diagrams')}
              className="w-full px-3 py-2 rounded-md text-start text-sm text-gray-700 hover:bg-gray-50"
            >
              UML + ERD
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {/* Regenerate button for failed/empty chapters */}
          {(activeChapter.status === 'failed' || (activeChapter.status === 'complete' && !activeChapter.content)) && (
            <div className="mb-4 flex items-center gap-3">
              <button
                type="button"
                onClick={() => void handleRegenerate()}
                disabled={isRegenerating}
                className="flex items-center gap-2 rounded-lg border border-amber-400 bg-amber-50 text-amber-800 text-sm font-medium px-4 py-2 hover:bg-amber-100 transition-colors disabled:opacity-50"
              >
                {isRegenerating ? <Spinner size="sm" /> : '🔄'}
                {isRegenerating ? 'מייצר...' : 'צור פרק מחדש'}
              </button>
            </div>
          )}
          <div
            dir={language === 'he' || language === 'ar' ? 'rtl' : 'ltr'}
            className="prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap leading-relaxed"
          >
            {isRegenerating ? (
              <p className="text-blue-600 italic">מייצר תוכן...</p>
            ) : activeChapter.status === 'failed' ? (
              <p className="text-amber-600 italic">
                פרק זה נכשל במהלך היצירה. ניתן לערוך בWord לאחר הורדה.
              </p>
            ) : activeChapter.content ? (
              activeChapter.content
            ) : (
              <p className="text-gray-400 italic">לא נוצר תוכן עדיין.</p>
            )}
          </div>
        </main>
      </div>

      {/* Bottom action bar */}
      <footer className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <p className="text-xs text-gray-500">
            {t('warning.desktop.only').includes('Word')
              ? 'פתח ב-Microsoft Word לאחר ההורדה לעריכה נוספת'
              : ''}
          </p>
          <Button onClick={handleDownload}>{t('download.button')}</Button>
        </div>
      </footer>
    </div>
  );
}

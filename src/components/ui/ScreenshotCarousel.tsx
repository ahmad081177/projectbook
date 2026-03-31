import { useEffect, useState } from 'react';
import Button from './Button';
import { useToastStore } from './Toast';
import { useTranslation } from '../../i18n';
import type { Screenshot, ScreenshotChapter } from '../../store/types';

interface ScreenshotCarouselProps {
  screenshots: Screenshot[];
  startIndex: number;
  onUpdate: (id: string, patch: Partial<Screenshot>) => void;
  onClose: () => void;
}

const USER_TYPE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'regular', label: 'User' },
  { value: 'both', label: 'Both' },
] as const;

/**
 * Auto-suggest a chapter tag based on the screen name keywords.
 * Returns undefined if no strong match — caller should default to 'userGuide'.
 */
function suggestChapterFromName(name: string): ScreenshotChapter | undefined {
  const lower = name.toLowerCase();

  // Introduction hints
  if (/\b(login|sign.?in|sign.?up|register|home|welcome|main|ראשי|تسجيل|رئيسي|כניסה|הרשמה)\b/i.test(lower))
    return 'introduction';

  // System analysis hints
  if (/\b(diagram|erd|uml|use.?case|flow|chart|תרשים|ניתוח|مخطط|تحليل|database|db|מסד|قاعدة)\b/i.test(lower))
    return 'systemAnalysis';

  // Server implementation hints
  if (/\b(server|backend|api|controller|service|handler|class|code|שרת|خادم|كود)\b/i.test(lower))
    return 'serverImplementation';

  // Client implementation hints
  if (/\b(client|frontend|css|style|layout|design|ui|עיצוב|لقوח|واجهة|تصميم)\b/i.test(lower))
    return 'clientImplementation';

  // User guide hints (broad — admin/user screens)
  if (/\b(admin|manage|settings|config|dashboard|screen|form|page|view|panel|ניהול|מסך|הגדרות|إدار|شاشة|إعداد)\b/i.test(lower))
    return 'userGuide';

  return undefined;
}

export default function ScreenshotCarousel({
  screenshots,
  startIndex,
  onUpdate,
  onClose,
}: ScreenshotCarouselProps) {
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  const [index, setIndex] = useState(Math.min(startIndex, screenshots.length - 1));

  // Local edit state for the current slide
  const current = screenshots[index];
  const [screenName, setScreenName] = useState(current?.screenName ?? '');
  const [caption, setCaption] = useState(current?.caption ?? '');
  const [userType, setUserType] = useState<Screenshot['userType']>(current?.userType ?? 'both');
  const [isIntro, setIsIntro] = useState(current?.chapterTag === 'introduction');

  // Sync local state when index changes
  useEffect(() => {
    const ss = screenshots[index];
    if (ss) {
      setScreenName(ss.screenName);
      setCaption(ss.caption);
      setUserType(ss.userType);
      setIsIntro(ss.chapterTag === 'introduction');
    }
  }, [index, screenshots]);

  // Derive the chapterTag: intro if toggled, otherwise auto-suggest or default to userGuide
  const resolveChapterTag = (name: string, intro: boolean): ScreenshotChapter => {
    if (intro) return 'introduction';
    return suggestChapterFromName(name) ?? 'userGuide';
  };

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const dir = e.key === 'ArrowLeft' ? 1 : -1; // RTL: left arrow = next
        setIndex((i) => Math.max(0, Math.min(screenshots.length - 1, i + dir)));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [screenshots.length, onClose]);

  // Scroll-lock
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  if (!current) return null;

  const goTo = (nextIndex: number) => {
    setIndex(Math.max(0, Math.min(screenshots.length - 1, nextIndex)));
  };

  const saveAndNext = () => {
    const chapterTag = resolveChapterTag(screenName, isIntro);
    onUpdate(current.id, { screenName, caption, userType, chapterTag });
    if (index < screenshots.length - 1) {
      goTo(index + 1);
    } else {
      addToast(t('carousel.done'), 'success');
      onClose();
    }
  };

  const skip = () => {
    if (index < screenshots.length - 1) {
      goTo(index + 1);
    } else {
      onClose();
    }
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
          <span className="text-sm font-medium text-gray-500">
            {index + 1} {t('carousel.of')} {screenshots.length}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Image */}
        <div className="flex-1 overflow-hidden bg-gray-100 flex items-center justify-center min-h-48">
          <img
            src={current.thumbnailUrl}
            alt={current.screenName}
            className="max-h-[40vh] max-w-full object-contain"
          />
        </div>

        {/* Form */}
        <div className="flex flex-col gap-3 p-5">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">{t('upload.screenshots.screenName')}</label>
            <input
              type="text"
              value={screenName}
              onChange={(e) => setScreenName(e.target.value)}
              placeholder={t('carousel.screenNameHint')}
              className="rounded border border-gray-300 px-3 py-2 text-sm"
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">{t('carousel.description')}</label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder={t('carousel.descriptionHint')}
              className="rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-600">{t('upload.screenshots.userType')}</span>
            <div className="flex gap-2">
              {USER_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setUserType(opt.value)}
                  className={[
                    'flex-1 rounded-md border py-1.5 text-sm font-medium transition-colors',
                    userType === opt.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50',
                  ].join(' ')}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="intro-toggle"
              checked={isIntro}
              onChange={(e) => setIsIntro(e.target.checked)}
              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <label htmlFor="intro-toggle" className="text-sm text-gray-700">
              {t('carousel.useAsIntro')}
            </label>
          </div>
        </div>

        {/* Navigation arrows + action buttons */}
        <div className="flex items-center gap-3 px-5 pb-5">
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            disabled={index === 0}
            className="rounded-full w-9 h-9 flex items-center justify-center border border-gray-300 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
            aria-label={t('carousel.prev')}
          >
            ›
          </button>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            disabled={index === screenshots.length - 1}
            className="rounded-full w-9 h-9 flex items-center justify-center border border-gray-300 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
            aria-label={t('carousel.next')}
          >
            ‹
          </button>

          <div className="flex gap-2 ms-auto">
            <Button variant="secondary" onClick={skip}>
              {t('carousel.skip')}
            </Button>
            <Button onClick={saveAndNext}>
              {index < screenshots.length - 1 ? t('carousel.saveAndNext') : t('status.complete')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

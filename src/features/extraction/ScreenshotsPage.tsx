import { useState } from 'react';
import { useNavigate } from 'react-router';
import WizardLayout from '../../components/layout/WizardLayout';
import Button from '../../components/ui/Button';
import FileDropZone from '../../components/ui/FileDropZone';
import ScreenshotCarousel from '../../components/ui/ScreenshotCarousel';
import { useTranslation } from '../../i18n';
import { useAppStore } from '../../store';
import type { Screenshot } from '../../store/types';

const MAX_SCREENSHOTS = 30;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

function buildScreenshot(file: File, index: number): Screenshot {
  return {
    id: `ss-${Date.now()}-${index}`,
    caption: '',
    screenName: file.name.replace(/\.[^.]+$/, ''),
    userType: 'both',
    chapterTag: 'userGuide',
    thumbnailUrl: URL.createObjectURL(file),
    file,
  };
}

function isAnnotated(ss: Screenshot): boolean {
  return ss.caption.trim() !== '';
}

export default function ScreenshotsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const existingScreenshots = useAppStore((s) => s.screenshots);
  const [screenshots, setScreenshots] = useState<Screenshot[]>(existingScreenshots);
  const [errors, setErrors] = useState<string[]>([]);
  const [carouselOpen, setCarouselOpen] = useState(false);
  const [carouselStart, setCarouselStart] = useState(0);

  const handleFiles = (files: File[]) => {
    const valid: File[] = [];
    const newErrors: string[] = [];

    for (const f of files) {
      if (f.size > MAX_FILE_SIZE) {
        newErrors.push(`${f.name}: exceeds 5 MB`);
        continue;
      }
      if (!f.type.startsWith('image/')) {
        newErrors.push(`${f.name}: not an image`);
        continue;
      }
      valid.push(f);
    }

    setErrors(newErrors);
    setScreenshots((prev) => {
      const combined = [
        ...prev,
        ...valid.map((f, i) => buildScreenshot(f, prev.length + i)),
      ];
      return combined.slice(0, MAX_SCREENSHOTS);
    });

    if (valid.length > 0) {
      setCarouselStart(0);
      setCarouselOpen(true);
    }
  };

  const updateScreenshot = (id: string, patch: Partial<Screenshot>) => {
    setScreenshots((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    );
  };

  const removeScreenshot = (id: string) => {
    setScreenshots((prev) => {
      const removed = prev.find((s) => s.id === id);
      if (removed?.thumbnailUrl) URL.revokeObjectURL(removed.thumbnailUrl);
      return prev.filter((s) => s.id !== id);
    });
  };

  const clearAllScreenshots = () => {
    setScreenshots((prev) => {
      prev.forEach((s) => { if (s.thumbnailUrl) URL.revokeObjectURL(s.thumbnailUrl); });
      return [];
    });
  };

  const openCarouselAt = (index: number) => {
    setCarouselStart(index);
    setCarouselOpen(true);
  };

  const openAnnotateButton = () => {
    const firstUnannotated = screenshots.findIndex((s) => !isAnnotated(s));
    openCarouselAt(firstUnannotated >= 0 ? firstUnannotated : 0);
  };

  const handleNext = () => {
    useAppStore.setState({ screenshots, completedStep: 4 });
    void navigate('/generate');
  };

  const handleSkip = () => {
    useAppStore.setState({ screenshots: [], completedStep: 4 });
    void navigate('/generate');
  };

  return (
    <>
      {carouselOpen && screenshots.length > 0 && (
        <ScreenshotCarousel
          screenshots={screenshots}
          startIndex={carouselStart}
          onUpdate={updateScreenshot}
          onClose={() => setCarouselOpen(false)}
        />
      )}

      <WizardLayout
        actions={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => void navigate('/extract/database')} className="flex-1">
              {t('nav.back')}
            </Button>
            <Button variant="secondary" onClick={handleSkip} className="flex-1">
              {t('nav.skip')}
            </Button>
            <Button onClick={handleNext} className="flex-1">
              {t('nav.next')}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-6">
          {screenshots.length < MAX_SCREENSHOTS && (
            <FileDropZone
              accept="image/*"
              multiple
              label={t('upload.screenshots.label')}
              sublabel={t('upload.screenshots.sub')}
              onFiles={handleFiles}
            />
          )}

          {errors.length > 0 && (
            <ul className="text-xs text-red-600 space-y-0.5">
              {errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}

          {screenshots.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {screenshots.length} {t('carousel.of')} {MAX_SCREENSHOTS}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={clearAllScreenshots}
                    className="text-xs text-red-500 hover:text-red-700 underline"
                  >
                    🗑️ {t('upload.screenshots.clearAll')}
                  </button>
                  <Button variant="secondary" onClick={openAnnotateButton}>
                    {t('carousel.annotate')}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {screenshots.map((ss, i) => (
                  <div
                    key={ss.id}
                    className={[
                      'flex flex-col gap-1 rounded-lg border p-2 bg-white cursor-pointer transition-colors',
                      isAnnotated(ss) ? 'border-green-400 ring-1 ring-green-300' : 'border-gray-200 hover:border-blue-300',
                    ].join(' ')}
                    onClick={() => openCarouselAt(i)}
                  >
                    <div className="relative">
                      <img
                        src={ss.thumbnailUrl}
                        alt={ss.screenName}
                        className="w-full h-28 object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeScreenshot(ss.id); }}
                        className="absolute top-1 end-1 bg-red-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center hover:bg-red-700"
                        aria-label={`Remove ${ss.screenName}`}
                      >
                        ✕
                      </button>
                      {isAnnotated(ss) && (
                        <span className="absolute bottom-1 start-1 bg-green-500 text-white text-xs rounded px-1">✓</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 truncate">{ss.screenName}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {screenshots.length >= MAX_SCREENSHOTS && (
            <p className="text-xs text-amber-600">Maximum {MAX_SCREENSHOTS} screenshots reached.</p>
          )}
        </div>
      </WizardLayout>
    </>
  );
}
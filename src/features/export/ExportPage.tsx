import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import WizardLayout from '../../components/layout/WizardLayout';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import type { BadgeStatus } from '../../components/ui/Badge';
import { useTranslation } from '../../i18n';
import { buildAndDownloadDocument } from '../../services/docBuilder';
import { useAppStore } from '../../store';
import type { ChapterKey } from '../../store/types';

const CHECKLIST: { key: ChapterKey; required: boolean }[] = [
  { key: 'introduction', required: true },
  { key: 'techStack', required: true },
  { key: 'systemAnalysis', required: true },
  { key: 'database', required: true },
  { key: 'serverImplementation', required: true },
  { key: 'clientImplementation', required: true },
  { key: 'userGuide', required: true },
  { key: 'reflection', required: true },
  { key: 'difficulties', required: true },
  { key: 'whatNext', required: true },
  { key: 'appendices', required: false },
];

function chapterBadge(status: string): { badge: BadgeStatus; label: string } {
  if (status === 'complete') return { badge: 'success', label: '✓' };
  if (status === 'failed') return { badge: 'warning', label: '⚠' };
  if (status === 'skipped') return { badge: 'idle', label: '—' };
  return { badge: 'idle', label: '○' };
}

export default function ExportPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const generatedContent = useAppStore((s) => s.generatedContent);
  const diagrams = useAppStore((s) => s.diagrams);
  const studentName = useAppStore((s) => s.studentName);
  const language = useAppStore((s) => s.language);
  const screenshots = useAppStore((s) => s.screenshots);
  const dbSchema = useAppStore((s) => s.dbSchema);
  const classes = useAppStore((s) => s.classes);
  const projectFiles = useAppStore((s) => s.projectFiles);

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  // Mark Export step as active in the step indicator
  useEffect(() => {
    useAppStore.setState({ completedStep: 6 });
  }, []);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const screenshotFiles = await Promise.all(
        screenshots
          .filter((s) => s.file !== null)
          .map(async (s) => ({
            arrayBuffer: await s.file!.arrayBuffer(),
            screenName: s.screenName,
            caption: s.caption,
            userType: s.userType,
            chapterTag: s.chapterTag,
          })),
      );
      await buildAndDownloadDocument({
        studentName,
        language,
        generatedContent,
        diagrams,
        screenshotFiles,
        tables: dbSchema?.tables ?? [],
        classes,
        projectFiles,
      });
      setDownloaded(true);
      useAppStore.setState({ exportStatus: 'done', lastExportDate: new Date().toISOString() });
    } catch (err) {
      console.error('Export failed', err);
      useAppStore.setState({ exportStatus: 'error' });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleStartOver = () => {
    useAppStore.setState({
      language: 'he',
      geminiApiKey: '',
      studentName: '',
      projectType: null,
      completedStep: -1,
      dbSchema: null,
      classes: [],
      screenshots: [],
      extractionErrors: {},
      generatedContent: Object.fromEntries(
        Object.keys(generatedContent).map((k) => [k, { content: '', status: 'idle' }]),
      ) as typeof generatedContent,
      isGenerating: false,
      previewHtml: '',
      exportStatus: 'idle',
    });
    void navigate('/');
  };

  return (
    <WizardLayout
      actions={
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => void navigate('/review/introduction')} className="flex-1">
            {t('export.back')}
          </Button>
        </div>
      }
    >
      <div className="w-full max-w-lg mx-auto flex flex-col gap-6">
        {/* Compliance checklist */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-3">
          <h2 className="text-base font-semibold text-gray-800">{t('export.checklist.title')}</h2>
          <ul className="flex flex-col gap-2">
            {CHECKLIST.map(({ key, required }) => {
              const { badge, label: badgeLabel } = chapterBadge(generatedContent[key].status);
              return (
                <li key={key} className="flex items-center justify-between text-sm">
                  <span className={required ? 'text-gray-800' : 'text-gray-500'}>
                    {t(`gen.select.section.${key}`)}
                    {!required && <span className="text-xs text-gray-400 ms-1">{t('export.optional')}</span>}
                  </span>
                  <Badge status={badge}>{badgeLabel}</Badge>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Download button */}
        <Button
          fullWidth
          size="lg"
          onClick={() => void handleDownload()}
          isLoading={isDownloading}
        >
          {downloaded ? t('export.redownload') : t('download.button')}
        </Button>

        {downloaded && (
          <p className="text-sm text-center text-gray-500">
            {t('export.wordHint')}
          </p>
        )}

        {/* Diagram status */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between text-sm">
          <span className="text-gray-700">{t('export.diagrams')}</span>
          <div className="flex gap-2">
            <Badge status={diagrams.uml.status === 'complete' ? 'success' : diagrams.uml.status === 'failed' ? 'warning' : 'idle'}>
              UML
            </Badge>
            <Badge status={diagrams.erd.status === 'complete' ? 'success' : diagrams.erd.status === 'failed' ? 'warning' : 'idle'}>
              ERD
            </Badge>
          </div>
        </div>

        {/* Start over */}
        <button
          type="button"
          onClick={handleStartOver}
          className="text-sm text-gray-400 hover:text-gray-600 underline text-center"
        >
          {t('start.over')}
        </button>
      </div>
    </WizardLayout>
  );
}

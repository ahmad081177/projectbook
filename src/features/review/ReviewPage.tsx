import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import WizardHeader from '../../components/layout/WizardHeader';
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

function getProviderCredentials(store: ReturnType<typeof useAppStore.getState>) {
  return {
    apiKey: store.aiProvider === 'openai' ? store.openaiApiKey : store.geminiApiKey,
    model: store.aiProvider === 'openai' ? store.openaiModel : store.geminiModel,
  };
}

function statusToBadge(
  status: string,
  t: (key: string) => string,
): { badge: BadgeStatus; label: string } {
  switch (status) {
    case 'complete':   return { badge: 'success', label: t('review.status.complete') };
    case 'failed':     return { badge: 'error',   label: t('review.status.failed') };
    case 'generating': return { badge: 'info',    label: t('review.status.generating') };
    case 'skipped':    return { badge: 'idle',    label: t('review.status.skipped') };
    default:           return { badge: 'idle',    label: t('review.status.pending') };
  }
}

export default function ReviewPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { chapterKey } = useParams<{ chapterKey?: ChapterKey }>();

  const generatedContent = useAppStore((s) => s.generatedContent);
  const diagrams = useAppStore((s) => s.diagrams);
  const language = useAppStore((s) => s.language);
  const isRtl = language === 'he' || language === 'ar';
  const [isRegenerating, setIsRegenerating] = useState(false);

  const activeKey: ChapterKey = CHAPTER_ORDER.includes(chapterKey as ChapterKey)
    ? (chapterKey as ChapterKey)
    : 'introduction';

  const activeChapter = generatedContent[activeKey];

  const tokenTotals = useMemo(() => {
    let input = 0, output = 0, estimated = false;
    Object.values(generatedContent).forEach((ch) => {
      if (ch.usage) { input += ch.usage.inputTokens; output += ch.usage.outputTokens; estimated = estimated || ch.usage.estimated; }
    });
    [diagrams.uml, diagrams.erd].forEach((d) => {
      if (d.usage) { input += d.usage.inputTokens; output += d.usage.outputTokens; estimated = estimated || d.usage.estimated; }
    });
    return { input, output, total: input + output, estimated, hasData: input + output > 0 };
  }, [generatedContent, diagrams]);

  const handleDownload = () => {
    void navigate('/export');
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    const s = useAppStore.getState();
    const providerCreds = getProviderCredentials(s);
    const ctx: GenerationContext = {
      provider: s.aiProvider,
      apiKey: providerCreds.apiKey,
      model: providerCreds.model,
      azureCfg: s.aiProvider === 'azure-openai' ? {
        endpoint: s.azureEndpoint,
        apiKey: s.azureApiKey,
        deploymentName: s.azureDeploymentName,
        apiVersion: s.azureApiVersion,
      } : null,
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
      generatedContent: { ...prev.generatedContent, [activeKey]: { content: '', status: 'generating', usage: undefined } },
    }));
    try {
      const result = await generateChapter(activeKey, ctx);
      useAppStore.setState((prev) => ({
        generatedContent: { ...prev.generatedContent, [activeKey]: { content: result.text, status: 'complete', lastGenerated: new Date().toISOString(), usage: result.usage } },
      }));
    } catch {
      useAppStore.setState((prev) => ({
        generatedContent: { ...prev.generatedContent, [activeKey]: { content: '', status: 'failed', usage: undefined } },
      }));
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <WizardHeader />
      <div className="flex-1 flex flex-col sm:flex-row max-w-5xl w-full mx-auto">
        {/* Sidebar: chapter list */}
        <aside className="w-full sm:w-56 bg-white border-b sm:border-b-0 sm:border-e border-gray-200 p-4 flex flex-col gap-1">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            {t('review.chapters')}
          </h2>
          {CHAPTER_ORDER.map((key) => {
            const { badge, label } = statusToBadge(generatedContent[key].status, t);
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
                <span>{t(`gen.select.section.${key}`)}</span>
                <Badge status={badge}>{label}</Badge>
              </button>
            );
          })}

          {/* Diagrams */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              {t('review.diagrams')}
            </h2>
            <button
              onClick={() => void navigate('/review/diagrams')}
              className="w-full px-3 py-2 rounded-md text-start text-sm text-gray-700 hover:bg-gray-50"
            >
              UML + ERD
            </button>
          </div>

          {/* Compact token summary */}
          {tokenTotals.hasData && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] bg-sky-50 border border-sky-100 leading-none">
                  <span className="font-semibold text-sky-700">{tokenTotals.input.toLocaleString()}</span>
                  <span className="text-sky-400">{t('gen.tokens.input')}</span>
                </span>
                <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] bg-emerald-50 border border-emerald-100 leading-none">
                  <span className="font-semibold text-emerald-700">{tokenTotals.output.toLocaleString()}</span>
                  <span className="text-emerald-400">{t('gen.tokens.output')}</span>
                </span>
                {tokenTotals.estimated && (
                  <span className="text-amber-500 text-[12px] font-bold leading-none" title={t('gen.tokens.estimated')}>≈</span>
                )}
              </div>
              <div className="text-[10px] text-gray-400">{t('gen.tokens.total')}: {tokenTotals.total.toLocaleString()}</div>
            </div>
          )}
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
                {isRegenerating ? t('review.regenerating') : t('review.regenerate')}
              </button>
            </div>
          )}
          <div
            dir={isRtl ? 'rtl' : 'ltr'}
            className={`max-w-none text-gray-800 whitespace-pre-wrap leading-relaxed text-sm ${isRtl ? 'text-right' : 'text-left'}`}
          >
            {isRegenerating ? (
              <p className="text-blue-600 italic">{t('review.generating.content')}</p>
            ) : activeChapter.status === 'failed' ? (
              <p className="text-amber-600 italic">{t('review.failed.message')}</p>
            ) : activeChapter.content ? (
              activeChapter.content
            ) : (
              <p className="text-gray-400 italic">{t('review.empty')}</p>
            )}
          </div>
        </main>
      </div>

      {/* Bottom action bar */}
      <footer className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <Button variant="secondary" onClick={() => void navigate('/generate')}>
            {t('review.backToGenerate')}
          </Button>
          <Button onClick={handleDownload}>{t('download.button')}</Button>
        </div>
      </footer>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import WizardHeader from '../../components/layout/WizardHeader';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import ProgressBar from '../../components/ui/ProgressBar';
import { useTranslation } from '../../i18n';
import {
  generateChapter,
  generateClassDescriptions,
  generateErdDiagram,
  type GenerationContext,
} from '../../services/gemini';
import { useAppStore } from '../../store';
import type { AiUsageStats, ChapterKey, SectionStatus } from '../../store/types';

interface GenerationTask {
  id: string;
  label: string;
  status: SectionStatus | 'pending';
  usage?: AiUsageStats;
}

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

const ALL_SECTION_IDS = [...CHAPTER_ORDER, 'erd'];

function buildTasks(
  t: (key: string) => string,
  selected: Set<string>,
  includeClassDescriptions: boolean,
): GenerationTask[] {
  return [
    { id: 'read-code', label: t('gen.task.readCode'), status: 'pending' },
    { id: 'read-db', label: t('gen.task.readDb'), status: 'pending' },
    ...CHAPTER_ORDER
      .filter((key) => selected.has(key))
      .map((key) => ({
        id: key,
        label: `${t(`gen.chapter.${key}`)}...`,
        status: 'pending' as const,
      })),
    ...(selected.has('serverImplementation') && includeClassDescriptions
      ? [{ id: 'class-descriptions', label: t('gen.task.classDescriptions'), status: 'pending' as const }]
      : []),
    ...(selected.has('erd') ? [{ id: 'erd', label: t('gen.task.erd'), status: 'pending' as const }] : []),
  ];
}

function StatusIcon({ status }: { status: GenerationTask['status'] }) {
  if (status === 'complete') return <span className="text-green-600">✓</span>;
  if (status === 'failed') return <span className="text-amber-500">⚠</span>;
  if (status === 'generating') return <Spinner size="sm" />;
  return <span className="text-gray-300">○</span>;
}

function getProviderCredentials(store: ReturnType<typeof useAppStore.getState>) {
  return {
    apiKey: store.aiProvider === 'openai' ? store.openaiApiKey : store.geminiApiKey,
    model: store.aiProvider === 'openai' ? store.openaiModel : store.geminiModel,
  };
}

function getProviderLabel(provider: AiUsageStats['provider'], t: (key: string) => string): string {
  if (provider === 'openai') return t('provider.openai');
  if (provider === 'azure-openai') return t('provider.azure');
  return t('provider.gemini');
}

function formatTokenCount(value: number): string {
  return value.toLocaleString();
}

export default function GenerationPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const store = useAppStore.getState();
  const hasVisibleClasses = store.classes.some((cls) => !cls.isExcluded);
  // Only skip the splash if generation is already in-flight (navigated away mid-run)
  const [isStarted, setIsStarted] = useState(() => useAppStore.getState().isGenerating);
  const [tasks, setTasks] = useState<GenerationTask[]>(() => buildTasks(t, new Set(ALL_SECTION_IDS), hasVisibleClasses));
  const [hasAllFailed, setHasAllFailed] = useState(false);
  const [failedKeys, setFailedKeys] = useState<ChapterKey[]>([]);
  const [isDone, setIsDone] = useState(false);
  const [isStopped, setIsStopped] = useState(false);
  const [previewSnippet, setPreviewSnippet] = useState<{ label: string; text: string } | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  // Section selection state — drives the splash checkbox UI
  const [selected, setSelected] = useState<Set<string>>(() => new Set(ALL_SECTION_IDS));
  // Ref keeps the latest selection accessible inside the generation useEffect closure
  const selectedRef = useRef<Set<string>>(new Set(ALL_SECTION_IDS));
  const started = useRef(false);
  const abortRef = useRef(false);
  const startTimeRef = useRef<number>(0);
  const previewScrollRef = useRef<HTMLDivElement>(null);

  const toggleSection = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      selectedRef.current = next;
      return next;
    });
  };

  const selectAll = () => {
    const next = new Set(ALL_SECTION_IDS);
    setSelected(next);
    selectedRef.current = next;
  };

  const deselectAll = () => {
    const next = new Set<string>();
    setSelected(next);
    selectedRef.current = next;
  };

  const handleStart = () => {
    setTasks(buildTasks(t, selectedRef.current, hasVisibleClasses));
    setIsStarted(true);
  };

  const completedCount = tasks.filter((t) => t.status === 'complete' || t.status === 'failed').length;
  const successCount = tasks.filter((t) => t.status === 'complete').length;
  const progress = Math.round((completedCount / tasks.length) * 100);
  const tokenSummary = tasks.reduce(
    (acc, task) => {
      if (!task.usage) return acc;
      acc.inputTokens += task.usage.inputTokens;
      acc.outputTokens += task.usage.outputTokens;
      acc.totalTokens += task.usage.totalTokens;
      acc.hasEstimated = acc.hasEstimated || task.usage.estimated;
      return acc;
    },
    { inputTokens: 0, outputTokens: 0, totalTokens: 0, hasEstimated: false },
  );

  // Elapsed timer — ticks every second while generating
  useEffect(() => {
    if (isDone) return;
    startTimeRef.current = Date.now();
    const id = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [isDone]);

  // Auto-scroll preview panel to bottom when new content arrives
  useEffect(() => {
    if (previewScrollRef.current) {
      previewScrollRef.current.scrollTop = previewScrollRef.current.scrollHeight;
    }
  }, [previewSnippet]);

  const updateTask = (id: string, patch: Partial<GenerationTask>) => {
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, ...patch } : task)));
  };

  useEffect(() => {
    if (!isStarted || started.current) return;
    started.current = true;

    const run = async () => {
      const providerCreds = getProviderCredentials(store);
      const ctx: GenerationContext = {
        provider: store.aiProvider,
        apiKey: providerCreds.apiKey,
        model: providerCreds.model,
        azureCfg: store.aiProvider === 'azure-openai' ? {
          endpoint: store.azureEndpoint,
          apiKey: store.azureApiKey,
          deploymentName: store.azureDeploymentName,
          apiVersion: store.azureApiVersion,
        } : null,
        language: store.language,
        studentName: store.studentName,
        projectType: store.projectType,
        classes: store.classes,
        tables: store.dbSchema?.tables ?? [],
        screenshots: store.screenshots.map((s) => ({
          screenName: s.screenName,
          caption: s.caption,
          userType: s.userType,
        })),
      };

      updateTask('read-code', { status: 'generating', usage: undefined });
        await new Promise((r) => setTimeout(r, 400));
      updateTask('read-code', { status: 'complete', usage: undefined });
      updateTask('read-db', { status: 'generating', usage: undefined });
        await new Promise((r) => setTimeout(r, 300));
      updateTask('read-db', { status: 'complete', usage: undefined });

      // Step 2: Generate each chapter sequentially with a 1-second gap
      // to stay under Gemini free-tier rate limit (~15 RPM).
      const sel = selectedRef.current;

      // Mark non-selected chapters as skipped up front
      for (const key of CHAPTER_ORDER) {
        if (!sel.has(key)) {
          useAppStore.setState((s) => ({
            generatedContent: {
              ...s.generatedContent,
              [key]: { content: s.generatedContent[key]?.content ?? '', status: 'skipped', usage: undefined },
            },
          }));
        }
      }

      let failedCount = 0;
      const localFailedKeys: ChapterKey[] = [];
      for (const key of CHAPTER_ORDER) {
        if (abortRef.current) break;
        if (!sel.has(key)) continue;
        updateTask(key, { status: 'generating', usage: undefined });
        useAppStore.setState((s) => ({
          generatedContent: {
            ...s.generatedContent,
            [key]: { content: '', status: 'generating', usage: undefined },
          },
        }));

        try {
          const result = await generateChapter(key, ctx);
          useAppStore.setState((s) => ({
            generatedContent: {
              ...s.generatedContent,
              [key]: { content: result.text, status: 'complete', lastGenerated: new Date().toISOString(), usage: result.usage },
            },
          }));
          updateTask(key, { status: 'complete', usage: result.usage });
          // Show first ~300 words (~1800 chars) of the generated chapter as a live preview
          const snippet = result.text.trim().slice(0, 1800);
          setPreviewSnippet({ label: t(`gen.chapter.${key}`), text: snippet });
        } catch {
          failedCount++;
          localFailedKeys.push(key);
          useAppStore.setState((s) => ({
            generatedContent: {
              ...s.generatedContent,
              [key]: { content: '', status: 'failed', usage: undefined },
            },
          }));
          updateTask(key, { status: 'failed', usage: undefined });
        }

        // 1-second breathing room between calls
        if (!abortRef.current) await new Promise((r) => setTimeout(r, 1000));
      }

      // Step 2.5: Enrich class descriptions and expose it as its own step.
      if (!abortRef.current && sel.has('serverImplementation') && ctx.classes.some((c) => !c.isExcluded)) {
        updateTask('class-descriptions', { status: 'generating', usage: undefined });
        try {
          const result = await generateClassDescriptions(ctx);
          if (Object.keys(result.descriptions).length > 0) {
            useAppStore.setState((s) => ({
              classes: s.classes.map((cls) => {
                const desc = result.descriptions[cls.name];
                if (!desc) return cls;
                return {
                  ...cls,
                  xmlDocComment: cls.xmlDocComment?.trim() || desc.classDesc || cls.xmlDocComment,
                  methods: cls.methods.map((m) => ({
                    ...m,
                    xmlDocComment: m.xmlDocComment?.trim() || desc.methods[m.name] || m.xmlDocComment,
                  })),
                };
              }),
            }));
          }
          updateTask('class-descriptions', { status: 'complete', usage: result.usage });
        } catch {
          updateTask('class-descriptions', { status: 'failed', usage: undefined });
        }
      }

      // Step 3: Generate diagrams (only if selected)
      if (sel.has('erd')) {
        updateTask('erd', { status: 'generating', usage: undefined });
        try {
          const result = await generateErdDiagram(ctx);
          useAppStore.setState((s) => ({
            diagrams: { ...s.diagrams, erd: { mermaidCode: result.text, status: 'complete', usage: result.usage } },
          }));
          updateTask('erd', { status: 'complete', usage: result.usage });
        } catch {
          useAppStore.setState((s) => ({
            diagrams: { ...s.diagrams, erd: { mermaidCode: '', status: 'failed', usage: undefined } },
          }));
          updateTask('erd', { status: 'failed', usage: undefined });
        }
      }

      // Complete
      const selectedChapters = CHAPTER_ORDER.filter((k) => sel.has(k));
      setHasAllFailed(failedCount > 0 && failedCount === selectedChapters.length);
      setFailedKeys(localFailedKeys);
      setIsDone(true);
      if (!abortRef.current) {
        useAppStore.setState({ isGenerating: false, completedStep: 5 });
        if (failedCount === 0) {
          setTimeout(() => void navigate('/review/introduction'), 800);
        }
      } else {
        setIsStopped(true);
        useAppStore.setState({ isGenerating: false, completedStep: 5 });
      }
    };

    useAppStore.setState({ isGenerating: true });
    void run();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStarted]);

  // Retry only the chapters that failed (re-uses the same ctx)
  const retryFailed = async () => {
    if (failedKeys.length === 0) return;
    const store2 = useAppStore.getState();
    const providerCreds = getProviderCredentials(store2);
    const ctx: GenerationContext = {
      provider: store2.aiProvider,
      apiKey: providerCreds.apiKey,
      model: providerCreds.model,
      azureCfg: store2.aiProvider === 'azure-openai' ? {
        endpoint: store2.azureEndpoint,
        apiKey: store2.azureApiKey,
        deploymentName: store2.azureDeploymentName,
        apiVersion: store2.azureApiVersion,
      } : null,
      language: store2.language,
      studentName: store2.studentName,
      projectType: store2.projectType,
      classes: store2.classes,
      tables: store2.dbSchema?.tables ?? [],
      screenshots: store2.screenshots.map((s) => ({
        screenName: s.screenName,
        caption: s.caption,
        userType: s.userType,
      })),
    };
    const stillFailed: ChapterKey[] = [];
    for (const key of failedKeys) {
      updateTask(key, { status: 'generating', usage: undefined });
      useAppStore.setState((s) => ({
        generatedContent: { ...s.generatedContent, [key]: { content: '', status: 'generating', usage: undefined } },
      }));
      try {
        const result = await generateChapter(key, ctx);
        useAppStore.setState((s) => ({
          generatedContent: { ...s.generatedContent, [key]: { content: result.text, status: 'complete', lastGenerated: new Date().toISOString(), usage: result.usage } },
        }));
        updateTask(key, { status: 'complete', usage: result.usage });
      } catch {
        stillFailed.push(key);
        useAppStore.setState((s) => ({
          generatedContent: { ...s.generatedContent, [key]: { content: '', status: 'failed', usage: undefined } },
        }));
        updateTask(key, { status: 'failed', usage: undefined });
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
    setFailedKeys(stillFailed);
    if (stillFailed.length === 0) {
      setTimeout(() => void navigate('/review/introduction'), 500);
    }
  };

  // ── Ready splash (shown before generation starts) ──────────────────────
  if (!isStarted) {
    const classCount = store.classes.filter((c) => !c.isExcluded).length;
    const tableCount = store.dbSchema?.tables?.length ?? 0;
    const ssCount = store.screenshots.length;
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <WizardHeader />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 max-w-lg w-full flex flex-col items-center gap-5 text-center">
            <div className="text-5xl">📖</div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{t('gen.title.ready')}</h1>
              <p className="text-sm text-gray-500 mt-2">{t('gen.subtitle.ready')}</p>
            </div>
            <div className="flex flex-col gap-2 text-sm text-gray-600 w-full bg-gray-50 rounded-xl p-4 text-start">
              <span>📁 {classCount} {t('gen.ready.classes')}</span>
              <span>🗄️ {tableCount} {t('gen.ready.tables')}</span>
              <span>🖼️ {ssCount} {t('gen.ready.screenshots')}</span>
            </div>

            {/* Section selector */}
            <div className="w-full border border-gray-200 rounded-xl p-4 text-start">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-700">{t('gen.select.title')}</span>
                <div className="flex gap-2">
                  <button type="button" onClick={selectAll}
                    className="text-xs text-blue-600 hover:underline">{t('gen.select.all')}</button>
                  <span className="text-gray-300">|</span>
                  <button type="button" onClick={deselectAll}
                    className="text-xs text-gray-500 hover:underline">{t('gen.select.none')}</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                {ALL_SECTION_IDS.map((id) => (
                  <label key={id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selected.has(id)}
                      onChange={() => toggleSection(id)}
                      className="w-4 h-4 rounded accent-blue-600"
                    />
                    <span className="text-sm text-gray-700 truncate">
                      {t(`gen.select.section.${id}`)}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <Button fullWidth size="lg" onClick={handleStart} disabled={selected.size === 0}>
              {t('gen.start')}
            </Button>
            <button
              type="button"
              onClick={() => void navigate('/extract/screenshots')}
              className="text-sm text-gray-400 hover:text-gray-600 underline"
            >
              {t('nav.back')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <WizardHeader />
      <div className="flex flex-col p-6 flex-1 min-h-0">
      {/* ── Header: full width ── */}
      <div className="w-full max-w-6xl mx-auto flex flex-col gap-3 mb-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-800">
            {isDone ? t('gen.title.done') : t('gen.title.generating')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isDone
              ? failedKeys.length > 0
                ? `${failedKeys.length} ${t('gen.subtitle.failedChapters')}`
                : t('gen.subtitle.done')
              : t('gen.subtitle.pleaseWait')}
          </p>
        </div>

        {/* Stats bar */}
        <div className="flex items-center justify-between text-xs text-gray-500 px-1">
          <span>{t('gen.stats.completed')}: {successCount} / {tasks.length}</span>
          {!isDone && (
            <span>
              {t('gen.stats.time')} {Math.floor(elapsedSec / 60).toString().padStart(2, '0')}:{(elapsedSec % 60).toString().padStart(2, '0')}
            </span>
          )}
          <span>{progress}%</span>
        </div>

        <ProgressBar value={progress} />

        {tokenSummary.totalTokens > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-center">
              <div className="text-[11px] text-gray-500">{t('gen.tokens.input')}</div>
              <div className="text-sm font-semibold text-gray-800">{formatTokenCount(tokenSummary.inputTokens)}</div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-center">
              <div className="text-[11px] text-gray-500">{t('gen.tokens.output')}</div>
              <div className="text-sm font-semibold text-gray-800">{formatTokenCount(tokenSummary.outputTokens)}</div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-center">
              <div className="text-[11px] text-gray-500">{t('gen.tokens.total')}</div>
              <div className="text-sm font-semibold text-gray-800">{formatTokenCount(tokenSummary.totalTokens)}</div>
            </div>
          </div>
        )}

        {tokenSummary.hasEstimated && (
          <div className="text-[11px] text-gray-500 text-center">{t('gen.tokens.estimated')}</div>
        )}

        {hasAllFailed && !isStopped && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {t('status.failed')} — {t('download.button')} {t('gen.stillAvailable')}
          </div>
        )}

        {isStopped && (
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800">
            {t('gen.stopped')}
          </div>
        )}
      </div>

      {/* ── Two-column body ── */}
      <div className="w-full max-w-6xl mx-auto flex gap-4 flex-1 min-h-0">

        {/* LEFT: task checklist + controls */}
        <div className="w-72 flex-shrink-0 bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-2 overflow-y-auto">
          <ul className="flex flex-col gap-2 flex-1">
            {tasks.map((task) => (
              <li key={task.id} className="flex items-start gap-3 text-sm">
                <div className="pt-0.5"><StatusIcon status={task.status} /></div>
                <div className="min-w-0">
                  <div
                    className={
                      task.status === 'complete'
                        ? 'text-gray-700'
                        : task.status === 'generating'
                          ? 'text-blue-700 font-medium'
                          : task.status === 'failed'
                            ? 'text-amber-600'
                            : 'text-gray-400'
                    }
                  >
                    {task.label}
                  </div>
                  {task.status === 'complete' && task.usage && (
                    <div className="mt-1.5 flex flex-col gap-1">
                      {/* Provider badge + model name */}
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-600 leading-none">
                          {getProviderLabel(task.usage.provider, t)}
                        </span>
                        <span className="truncate text-[10px] text-gray-400 leading-none">{task.usage.model}</span>
                      </div>
                      {/* Token chips */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] bg-sky-50 border border-sky-100 leading-none">
                          <span className="font-semibold text-sky-700">{formatTokenCount(task.usage.inputTokens)}</span>
                          <span className="text-sky-400">{t('gen.tokens.input')}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] bg-emerald-50 border border-emerald-100 leading-none">
                          <span className="font-semibold text-emerald-700">{formatTokenCount(task.usage.outputTokens)}</span>
                          <span className="text-emerald-400">{t('gen.tokens.output')}</span>
                        </span>
                        {task.usage.estimated && (
                          <span className="text-[11px] text-amber-500 font-bold leading-none" title={t('gen.tokens.estimated')}>≈</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {/* Action buttons once done */}
          {isDone && (
            <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
              {failedKeys.length > 0 && (
                <button
                  type="button"
                  onClick={() => void retryFailed()}
                  className="w-full rounded-lg border border-amber-400 bg-amber-50 text-amber-800 text-sm font-medium py-2 hover:bg-amber-100 transition-colors"
                >
                  {t('gen.retry')} ({failedKeys.length})
                </button>
              )}
              <button
                type="button"
                onClick={() => void navigate('/review/introduction')}
                className="w-full rounded-lg bg-blue-600 text-white text-sm font-medium py-2 hover:bg-blue-700 transition-colors"
              >
                {t('gen.goToReview')}
              </button>
            </div>
          )}

          {/* Stop button while generating */}
          {!isDone && (
            <div className="pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => { abortRef.current = true; }}
                className="w-full text-sm text-red-500 hover:text-red-700 underline py-1"
              >
                {t('gen.stop')}
              </button>
            </div>
          )}
        </div>

        {/* RIGHT: live content preview */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden min-h-[400px]">
          {/* Panel header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 flex-shrink-0">
            <span>📄</span>
            <span className="text-sm font-medium text-gray-700">
              {previewSnippet?.label ?? t('gen.preview.waiting')}
            </span>
          </div>

          {/* Scrollable content */}
          <div ref={previewScrollRef} className="flex-1 overflow-y-auto p-5">
            {previewSnippet ? (
              <p dir="rtl" className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap text-right">
                {previewSnippet.text}
                {previewSnippet.text.length >= 1800 ? '…' : ''}
              </p>
            ) : (
              <p className="text-sm text-gray-400 italic text-center mt-8">
                {t('gen.preview.placeholder')}
              </p>
            )}
          </div>
        </div>

      </div>
      </div>
    </div>
  );
}

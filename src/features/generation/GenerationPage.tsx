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
import type { ChapterKey, SectionStatus } from '../../store/types';

interface GenerationTask {
  id: string;
  label: string;
  status: SectionStatus | 'pending';
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

function buildTasks(t: (key: string) => string, selected: Set<string>): GenerationTask[] {
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
    ...(selected.has('erd') ? [{ id: 'erd', label: t('gen.task.erd'), status: 'pending' as const }] : []),
  ];
}

function StatusIcon({ status }: { status: GenerationTask['status'] }) {
  if (status === 'complete') return <span className="text-green-600">✓</span>;
  if (status === 'failed') return <span className="text-amber-500">⚠</span>;
  if (status === 'generating') return <Spinner size="sm" />;
  return <span className="text-gray-300">○</span>;
}

export default function GenerationPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const store = useAppStore.getState();
  // Only skip the splash if generation is already in-flight (navigated away mid-run)
  const [isStarted, setIsStarted] = useState(() => useAppStore.getState().isGenerating);
  const [tasks, setTasks] = useState<GenerationTask[]>(() => buildTasks(t, new Set(ALL_SECTION_IDS)));
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
    setTasks(buildTasks(t, selectedRef.current));
    setIsStarted(true);
  };

  const completedCount = tasks.filter((t) => t.status === 'complete' || t.status === 'failed').length;
  const successCount = tasks.filter((t) => t.status === 'complete').length;
  const progress = Math.round((completedCount / tasks.length) * 100);

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

  const updateTask = (id: string, status: GenerationTask['status']) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
  };

  useEffect(() => {
    if (!isStarted || started.current) return;
    started.current = true;

    const run = async () => {
      const ctx: GenerationContext = {
        provider: store.aiProvider,
        apiKey: store.geminiApiKey,
        model: store.geminiModel,
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

      // Step 1: "Read" steps (instant UI feedback)
      updateTask('read-code', 'generating');
      await new Promise((r) => setTimeout(r, 400));
      updateTask('read-code', 'complete');

      updateTask('read-db', 'generating');
      await new Promise((r) => setTimeout(r, 300));
      updateTask('read-db', 'complete');

      // Step 2: Generate each chapter sequentially with a 1-second gap
      // to stay under Gemini free-tier rate limit (~15 RPM).
      const sel = selectedRef.current;

      // Mark non-selected chapters as skipped up front
      for (const key of CHAPTER_ORDER) {
        if (!sel.has(key)) {
          useAppStore.setState((s) => ({
            generatedContent: {
              ...s.generatedContent,
              [key]: { content: s.generatedContent[key]?.content ?? '', status: 'skipped' },
            },
          }));
        }
      }

      let failedCount = 0;
      const localFailedKeys: ChapterKey[] = [];
      for (const key of CHAPTER_ORDER) {
        if (abortRef.current) break;
        if (!sel.has(key)) continue;
        updateTask(key, 'generating');
        useAppStore.setState((s) => ({
          generatedContent: {
            ...s.generatedContent,
            [key]: { content: '', status: 'generating' },
          },
        }));

        try {
          const content = await generateChapter(key, ctx);
          useAppStore.setState((s) => ({
            generatedContent: {
              ...s.generatedContent,
              [key]: { content, status: 'complete', lastGenerated: new Date().toISOString() },
            },
          }));
          updateTask(key, 'complete');
          // Show first ~300 words (~1800 chars) of the generated chapter as a live preview
          const snippet = content.trim().slice(0, 1800);
          setPreviewSnippet({ label: t(`gen.chapter.${key}`), text: snippet });
        } catch {
          failedCount++;
          localFailedKeys.push(key);
          useAppStore.setState((s) => ({
            generatedContent: {
              ...s.generatedContent,
              [key]: { content: '', status: 'failed' },
            },
          }));
          updateTask(key, 'failed');
        }

        // 1-second breathing room between calls
        if (!abortRef.current) await new Promise((r) => setTimeout(r, 1000));
      }

      // Step 2.5: Silently enrich class descriptions (no visible task)
      if (!abortRef.current && sel.has('serverImplementation') && ctx.classes.some((c) => !c.isExcluded)) {
        try {
          const descriptions = await generateClassDescriptions(ctx);
          if (Object.keys(descriptions).length > 0) {
            useAppStore.setState((s) => ({
              classes: s.classes.map((cls) => {
                const desc = descriptions[cls.name];
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
        } catch { /* silently skip on failure */ }
      }

      // Step 3: Generate diagrams (only if selected)
      if (sel.has('erd')) {
        updateTask('erd', 'generating');
        try {
          const erdCode = await generateErdDiagram(ctx);
          useAppStore.setState((s) => ({
            diagrams: { ...s.diagrams, erd: { mermaidCode: erdCode, status: 'complete' } },
          }));
          updateTask('erd', 'complete');
        } catch {
          useAppStore.setState((s) => ({
            diagrams: { ...s.diagrams, erd: { mermaidCode: '', status: 'failed' } },
          }));
          updateTask('erd', 'failed');
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
    const ctx: GenerationContext = {
      provider: store2.aiProvider,
      apiKey: store2.geminiApiKey,
      model: store2.geminiModel,
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
      updateTask(key, 'generating');
      useAppStore.setState((s) => ({
        generatedContent: { ...s.generatedContent, [key]: { content: '', status: 'generating' } },
      }));
      try {
        const content = await generateChapter(key, ctx);
        useAppStore.setState((s) => ({
          generatedContent: { ...s.generatedContent, [key]: { content, status: 'complete', lastGenerated: new Date().toISOString() } },
        }));
        updateTask(key, 'complete');
      } catch {
        stillFailed.push(key);
        useAppStore.setState((s) => ({
          generatedContent: { ...s.generatedContent, [key]: { content: '', status: 'failed' } },
        }));
        updateTask(key, 'failed');
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
              <li key={task.id} className="flex items-center gap-3 text-sm">
                <StatusIcon status={task.status} />
                <span
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
                </span>
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
              <p dir="rtl" className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
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

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import Spinner from '../../components/ui/Spinner';
import ProgressBar from '../../components/ui/ProgressBar';
import { useTranslation } from '../../i18n';
import {
  generateChapter,
  generateUmlDiagram,
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

const CHAPTER_LABELS: Record<ChapterKey, string> = {
  introduction: 'כותב מבוא...',
  techStack: 'כותב סקירת טכנולוגיות...',
  systemAnalysis: 'כותב ניתוח מערכת...',
  database: 'כותב פרק מסד נתונים...',
  serverImplementation: 'כותב מימוש צד שרת...',
  clientImplementation: 'כותב מימוש צד לקוח...',
  userGuide: 'כותב מדריך משתמש...',
  reflection: 'כותב רפלקסיה...',
  difficulties: 'כותב קשיים ופתרונות...',
  whatNext: 'כותב פיתוחים עתידיים...',
  appendices: 'כותב נספחים...',
};

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

function buildTasks(): GenerationTask[] {
  const tasks: GenerationTask[] = [
    { id: 'read-code', label: 'קורא את הקוד שלך...', status: 'pending' },
    { id: 'read-db', label: 'קורא את מסד הנתונים...', status: 'pending' },
    ...CHAPTER_ORDER.map((key) => ({
      id: key,
      label: CHAPTER_LABELS[key],
      status: 'pending' as const,
    })),
    { id: 'uml', label: 'יוצר דיאגרמת UML...', status: 'pending' },
    { id: 'erd', label: 'יוצר ERD...', status: 'pending' },
  ];
  return tasks;
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
  const [tasks, setTasks] = useState<GenerationTask[]>(buildTasks);
  const [hasAllFailed, setHasAllFailed] = useState(false);
  const [failedKeys, setFailedKeys] = useState<ChapterKey[]>([]);
  const [isDone, setIsDone] = useState(false);
  const [isStopped, setIsStopped] = useState(false);
  const [previewSnippet, setPreviewSnippet] = useState<{ label: string; text: string } | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const started = useRef(false);
  const abortRef = useRef(false);
  const startTimeRef = useRef<number>(0);
  const previewScrollRef = useRef<HTMLDivElement>(null);

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
    if (started.current) return;
    started.current = true;

    const run = async () => {
      const ctx: GenerationContext = {
        apiKey: store.geminiApiKey,
        model: store.geminiModel,
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
      let failedCount = 0;
      const localFailedKeys: ChapterKey[] = [];
      for (const key of CHAPTER_ORDER) {
        if (abortRef.current) break;
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
          setPreviewSnippet({ label: CHAPTER_LABELS[key].replace('...', ''), text: snippet });
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

      // Step 3: Generate diagrams
      updateTask('uml', 'generating');
      try {
        const umlCode = await generateUmlDiagram(ctx);
        useAppStore.setState((s) => ({
          diagrams: { ...s.diagrams, uml: { mermaidCode: umlCode, status: 'complete' } },
        }));
        updateTask('uml', 'complete');
      } catch {
        useAppStore.setState((s) => ({
          diagrams: { ...s.diagrams, uml: { mermaidCode: '', status: 'failed' } },
        }));
        updateTask('uml', 'failed');
      }

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

      // Complete
      setHasAllFailed(failedCount === CHAPTER_ORDER.length);
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
  }, []);

  // Retry only the chapters that failed (re-uses the same ctx)
  const retryFailed = async () => {
    if (failedKeys.length === 0) return;
    const store2 = useAppStore.getState();
    const ctx: GenerationContext = {
      apiKey: store2.geminiApiKey,
      model: store2.geminiModel,
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col p-6">
      {/* ── Header: full width ── */}
      <div className="w-full max-w-6xl mx-auto flex flex-col gap-3 mb-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-800">
            {isDone ? '✅ יצירת הספר הושלמה' : '⚙️ מייצר את הספר...'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isDone
              ? failedKeys.length > 0
                ? `${failedKeys.length} פרקים נכשלו — לחץ "נסה שוב" לנסות מחדש`
                : 'עובר לסקירה...'
              : 'אנא המתן, הפעולה עשויה לקחת מספר דקות'}
          </p>
        </div>

        {/* Stats bar */}
        <div className="flex items-center justify-between text-xs text-gray-500 px-1">
          <span>הושלמו: {successCount} / {tasks.length}</span>
          {!isDone && (
            <span>
              זמן: {Math.floor(elapsedSec / 60).toString().padStart(2, '0')}:{(elapsedSec % 60).toString().padStart(2, '0')}
            </span>
          )}
          <span>{progress}%</span>
        </div>

        <ProgressBar value={progress} />

        {hasAllFailed && !isStopped && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {t('status.failed')} — {t('download.button')} {'עדיין זמין'}
          </div>
        )}

        {isStopped && (
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800">
            היצירה הופסקה על ידי המשתמש. פרקים שנוצרו זמינים לסקירה.
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
                  🔄 נסה שוב ({failedKeys.length} פרקים)
                </button>
              )}
              <button
                type="button"
                onClick={() => void navigate('/review/introduction')}
                className="w-full rounded-lg bg-blue-600 text-white text-sm font-medium py-2 hover:bg-blue-700 transition-colors"
              >
                עבור לסקירה →
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
                עצור יצירה
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
              {previewSnippet?.label ?? 'ממתין לתוכן...'}
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
                התוכן יופיע כאן בזמן יצירתו...
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

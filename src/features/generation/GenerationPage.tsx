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
  const started = useRef(false);

  const completedCount = tasks.filter((t) => t.status === 'complete' || t.status === 'failed').length;
  const progress = Math.round((completedCount / tasks.length) * 100);

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

      // Step 2: Generate each chapter sequentially
      let failedCount = 0;
      for (const key of CHAPTER_ORDER) {
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
        } catch {
          failedCount++;
          useAppStore.setState((s) => ({
            generatedContent: {
              ...s.generatedContent,
              [key]: { content: '', status: 'failed' },
            },
          }));
          updateTask(key, 'failed');
        }
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
      useAppStore.setState({ isGenerating: false, completedStep: 5 });

      // Auto-advance to review
      setTimeout(() => void navigate('/review/introduction'), 800);
    };

    useAppStore.setState({ isGenerating: true });
    void run();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-start p-8">
      <div className="w-full max-w-2xl flex flex-col gap-6">
        <ProgressBar value={progress} />

        {hasAllFailed && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {t('status.failed')} — {t('download.button')} {'עדיין זמין'}
          </div>
        )}

        <ul className="flex flex-col gap-2">
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
      </div>
    </div>
  );
}

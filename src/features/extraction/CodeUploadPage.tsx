import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import WizardLayout from '../../components/layout/WizardLayout';
import Button from '../../components/ui/Button';
import FileDropZone from '../../components/ui/FileDropZone';
import Select from '../../components/ui/Select';
import { useTranslation } from '../../i18n';
import { parseCSharpFiles, shouldAutoExclude } from '../../services/parsers/csharpParser';
import { useAppStore } from '../../store';
import type { CSharpClass, ProjectType } from '../../store/types';

const PROJECT_TYPE_OPTIONS = [
  { value: '', label: '— Select —' },
  { value: 'blazor', label: 'Blazor Web App' },
  { value: 'wpf', label: 'WPF Desktop App' },
  { value: 'winforms', label: 'Windows Forms' },
  { value: 'android', label: 'Android (Xamarin/MAUI)' },
  { value: 'other', label: 'Other' },
];

interface ParsedState {
  classes: CSharpClass[];
  fileCount: number;
  folderCount: number;
}

export default function CodeUploadPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [parsed, setParsed] = useState<ParsedState | null>(null);
  const [projectType, setProjectType] = useState<ProjectType | ''>('');
  const [showClasses, setShowClasses] = useState(false);
  const [exclusions, setExclusions] = useState<Set<string>>(new Set());
  const [isParsing, setIsParsing] = useState(false);

  const canProceed = !!parsed && projectType !== '';

  const handleFiles = useCallback(async (files: File[]) => {
    const csFiles = files.filter((f) => f.name.endsWith('.cs'));
    if (csFiles.length === 0) return;

    setIsParsing(true);
    try {
      const fileData = await Promise.all(
        csFiles.map(async (f) => ({
          path: (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name,
          content: await f.text(),
        })),
      );

      const classes = parseCSharpFiles(fileData);
      const folders = new Set(
        fileData.map(({ path }) => {
          const parts = path.split(/[\\/]/);
          return parts.length > 1 ? parts.slice(0, -1).join('/') : '';
        }),
      );

      // Auto-exclude known generated files
      const autoExcluded = new Set(
        classes
          .filter((c) => shouldAutoExclude(c.filePath))
          .map((c) => c.filePath),
      );
      setExclusions(autoExcluded);
      setParsed({ classes, fileCount: csFiles.length, folderCount: folders.size });
    } finally {
      setIsParsing(false);
    }
  }, []);

  const toggleExclusion = (filePath: string) => {
    setExclusions((prev) => {
      const next = new Set(prev);
      if (next.has(filePath)) next.delete(filePath);
      else next.add(filePath);
      return next;
    });
  };

  const handleNext = () => {
    if (!parsed || !projectType) return;
    const finalClasses = parsed.classes.map((c) => ({
      ...c,
      isExcluded: exclusions.has(c.filePath),
    }));
    useAppStore.setState({
      classes: finalClasses,
      projectType,
      completedStep: 2,
    });
    void navigate('/extract/database');
  };

  return (
    <WizardLayout
      actions={
        <Button fullWidth onClick={handleNext} disabled={!canProceed}>
          {t('nav.next')}
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        <FileDropZone
          directory
          accept=".cs"
          label={t('upload.code.label')}
          sublabel={t('upload.code.sub')}
          onFiles={(files) => void handleFiles(files)}
          disabled={isParsing}
        />

        {isParsing && (
          <p className="text-sm text-gray-500 text-center">{t('status.generating')}</p>
        )}

        {parsed && !isParsing && (
          <div className="rounded-lg border border-gray-200 bg-white p-4 flex flex-col gap-3">
            <p className="text-sm font-medium text-gray-800">
              {t('upload.code.found')
                .replace('{files}', String(parsed.fileCount))
                .replace('{folders}', String(parsed.folderCount))}
            </p>

            {parsed.classes.length > 0 && (
              <div>
                <button
                  type="button"
                  className="text-xs text-blue-600 underline"
                  onClick={() => setShowClasses((v) => !v)}
                >
                  {showClasses
                    ? t('upload.code.hideClasses')
                    : t('upload.code.showClasses').replace(
                        '{n}',
                        String(parsed.classes.length),
                      )}
                </button>

                {showClasses && (
                  <ul className="mt-2 max-h-48 overflow-y-auto divide-y divide-gray-100">
                    {parsed.classes.map((cls) => (
                      <li
                        key={`${cls.filePath}-${cls.name}`}
                        className="flex items-center gap-2 py-1.5 text-xs"
                      >
                        <input
                          type="checkbox"
                          id={`excl-${cls.name}`}
                          checked={!exclusions.has(cls.filePath)}
                          onChange={() => toggleExclusion(cls.filePath)}
                          className="rounded border-gray-300"
                        />
                        <label htmlFor={`excl-${cls.name}`} className="flex-1 text-gray-700">
                          <span className="font-mono">{cls.name}</span>
                          {cls.isInterface && (
                            <span className="ms-1 text-gray-400">(interface)</span>
                          )}
                          <span className="ms-1 text-gray-400 truncate block">{cls.filePath}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        {parsed && (
          <Select
            label={t('upload.code.projectType')}
            options={PROJECT_TYPE_OPTIONS}
            value={projectType}
            onChange={(e) => setProjectType(e.target.value as ProjectType | '')}
          />
        )}
      </div>
    </WizardLayout>
  );
}

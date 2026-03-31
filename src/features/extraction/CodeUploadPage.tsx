import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router';
import WizardLayout from '../../components/layout/WizardLayout';
import Button from '../../components/ui/Button';
import FileDropZone from '../../components/ui/FileDropZone';
import Select from '../../components/ui/Select';
import { useTranslation } from '../../i18n';
import { parseCSharpFiles, shouldAutoExclude } from '../../services/parsers/csharpParser';
import { useAppStore } from '../../store';
import type { CSharpClass, ProjectFile, ProjectType } from '../../store/types';

/** Non-C# extensions we care about in the project */
const EXTRA_EXTENSIONS = new Set(['.aspx', '.master', '.cshtml', '.config', '.css', '.js']);

const PROJECT_TYPE_OPTIONS = [
  { value: '', label: '— Select —' },
  { value: 'aspnet', label: 'ASP.NET Web Application' },
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

  // Non-C# project files
  const [extraFiles, setExtraFiles] = useState<ProjectFile[]>([]);
  const [showExtraFiles, setShowExtraFiles] = useState(false);
  const [extraExclusions, setExtraExclusions] = useState<Set<string>>(new Set());

  // Accumulates file data across multiple folder picks so all folders are parsed together.
  const accumulatedRef = useRef<{ path: string; content: string }[]>([]);
  const accumulatedExtraRef = useRef<{ path: string; content: string; name: string; ext: string }[]>([]);

  const canProceed = !!parsed && projectType !== '';

  const handleFiles = useCallback(async (files: File[]) => {
    const csFiles = files.filter((f) => f.name.endsWith('.cs'));
    // Collect non-C# project files
    const extraRaw = files.filter((f) => {
      const ext = '.' + f.name.split('.').pop()?.toLowerCase();
      return EXTRA_EXTENSIONS.has(ext);
    });

    if (csFiles.length === 0 && extraRaw.length === 0) return;

    setIsParsing(true);
    try {
      // ── C# files ──
      if (csFiles.length > 0) {
        const newFileData = await Promise.all(
          csFiles.map(async (f) => ({
            path: (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name,
            content: await f.text(),
          })),
        );

        const existingPaths = new Set(accumulatedRef.current.map((fd) => fd.path));
        const merged = [
          ...accumulatedRef.current,
          ...newFileData.filter((fd) => !existingPaths.has(fd.path)),
        ];
        accumulatedRef.current = merged;

        const classes = parseCSharpFiles(merged);
        const folders = new Set(
          merged.map(({ path }) => {
            const parts = path.split(/[\\/]/);
            return parts.length > 1 ? parts.slice(0, -1).join('/') : '';
          }),
        );

        const autoExcluded = new Set(
          classes
            .filter((c) => shouldAutoExclude(c.filePath))
            .map((c) => c.filePath),
        );
        setExclusions(autoExcluded);
        setParsed({ classes, fileCount: merged.length, folderCount: folders.size });
      }

      // ── Non-C# project files ──
      if (extraRaw.length > 0) {
        const newExtra = await Promise.all(
          extraRaw.map(async (f) => {
            const relPath = (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name;
            return {
              path: relPath,
              content: await f.text(),
              name: f.name,
              ext: '.' + f.name.split('.').pop()!.toLowerCase(),
            };
          }),
        );

        const existingExtraPaths = new Set(accumulatedExtraRef.current.map((fd) => fd.path));
        const mergedExtra = [
          ...accumulatedExtraRef.current,
          ...newExtra.filter((fd) => !existingExtraPaths.has(fd.path)),
        ];
        accumulatedExtraRef.current = mergedExtra;

        const pFiles: ProjectFile[] = mergedExtra.map((fd) => ({
          filePath: fd.path,
          fileName: fd.name,
          extension: fd.ext,
          content: fd.content,
          isExcluded: true, // default all extra files to excluded; user opts in
        }));

        setExtraFiles(pFiles);
        setExtraExclusions(new Set(pFiles.map((f) => f.filePath)));
      }
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

  const toggleExtraExclusion = (filePath: string) => {
    setExtraExclusions((prev) => {
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
    const finalProjectFiles = extraFiles.map((f) => ({
      ...f,
      isExcluded: extraExclusions.has(f.filePath),
    }));
    useAppStore.setState({
      classes: finalClasses,
      projectFiles: finalProjectFiles,
      projectType,
      completedStep: 2,
    });
    void navigate('/extract/database');
  };

  return (
    <WizardLayout
      actions={
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => void navigate('/onboarding/api-key')} className="flex-1">
            {t('nav.back')}
          </Button>
          <Button fullWidth onClick={handleNext} disabled={!canProceed} className="flex-1">
            {t('nav.next')}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <FileDropZone
          directory
          accept=".cs,.aspx,.master,.cshtml,.config,.css,.js"
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
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-800">
                {t('upload.code.found')
                  .replace('{files}', String(parsed.fileCount))
                  .replace('{folders}', String(parsed.folderCount))}
              </p>
              {/* Merge additional folders without losing what was already parsed */}
              <label className="cursor-pointer text-xs text-blue-600 hover:text-blue-800 underline flex items-center gap-1">
                📂 {t('upload.code.addFolder')}
                <input
                  type="file"
                  className="hidden"
                  // @ts-expect-error webkitdirectory is valid but not in TS DOM types
                  webkitdirectory=""
                  multiple
                  accept=".cs,.aspx,.master,.cshtml,.config,.css,.js"
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? []);
                    if (files.length > 0) void handleFiles(files);
                    // Reset so the same folder can be re-selected
                    e.target.value = '';
                  }}
                />
              </label>
            </div>

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

        {/* Non-C# project files */}
        {extraFiles.length > 0 && !isParsing && (
          <div className="rounded-lg border border-gray-200 bg-white p-4 flex flex-col gap-3">
            <p className="text-sm font-medium text-gray-800">
              {t('upload.code.foundExtra')
                .replace('{count}', String(extraFiles.length))
                .replace('{types}', [...new Set(extraFiles.map((f) => f.extension))].join(', '))}
            </p>
            <button
              type="button"
              className="text-xs text-blue-600 underline text-start"
              onClick={() => setShowExtraFiles((v) => !v)}
            >
              {showExtraFiles
                ? t('upload.code.hideClasses')
                : t('upload.code.projectFiles')}
            </button>
            {showExtraFiles && (
              <ul className="mt-2 max-h-48 overflow-y-auto divide-y divide-gray-100">
                {extraFiles.map((pf) => (
                  <li key={pf.filePath} className="flex items-center gap-2 py-1.5 text-xs">
                    <input
                      type="checkbox"
                      checked={!extraExclusions.has(pf.filePath)}
                      onChange={() => toggleExtraExclusion(pf.filePath)}
                      className="rounded border-gray-300"
                    />
                    <span className="flex-1 text-gray-700">
                      <span className="font-mono">{pf.fileName}</span>
                      <span className="ms-1 text-gray-400 truncate block">{pf.filePath}</span>
                    </span>
                  </li>
                ))}
              </ul>
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

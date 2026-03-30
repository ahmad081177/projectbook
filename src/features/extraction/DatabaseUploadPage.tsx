import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import WizardLayout from '../../components/layout/WizardLayout';
import Button from '../../components/ui/Button';
import FileDropZone from '../../components/ui/FileDropZone';
import { useTranslation } from '../../i18n';
import { parseAccessFile } from '../../services/parsers/accessParser';
import { useAppStore } from '../../store';
import type { DatabaseSchema } from '../../store/types';

export default function DatabaseUploadPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [schema, setSchema] = useState<DatabaseSchema | null>(null);
  const [parseError, setParseError] = useState('');
  const [showFallback, setShowFallback] = useState(false);
  const [skipDb, setSkipDb] = useState(false);
  const [fallbackImages, setFallbackImages] = useState<File[]>([]);
  const [isParsing, setIsParsing] = useState(false);

  const canProceed = skipDb || schema !== null || fallbackImages.length > 0;

  const handleDbFile = useCallback(async (files: File[]) => {
    const file = files.find((f) => /\.(mdb|accdb)$/i.test(f.name));
    if (!file) {
      setParseError('Please upload a .mdb or .accdb file');
      return;
    }

    setIsParsing(true);
    setParseError('');
    try {
      const buffer = await file.arrayBuffer();
      const result = parseAccessFile(file.name, buffer);
      if (!result) {
        setParseError('File does not appear to be a valid Access database');
        setShowFallback(true);
      } else {
        setSchema(result);
        setShowFallback(false);
      }
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Failed to read file');
      setShowFallback(true);
    } finally {
      setIsParsing(false);
    }
  }, []);

  const handleNext = () => {
    if (skipDb) {
      useAppStore.setState({ dbSchema: null, completedStep: 3 });
    } else if (schema) {
      useAppStore.setState({ dbSchema: schema, completedStep: 3 });
    } else if (fallbackImages.length > 0) {
      // Screenshots stored separately for Gemini vision processing
      const screenshotEntries = fallbackImages.map((file, i) => ({
        id: `db-screenshot-${i}`,
        caption: '',
        screenName: `DB Screenshot ${i + 1}`,
        userType: 'admin' as const,
        thumbnailUrl: URL.createObjectURL(file),
        file,
      }));
      useAppStore.setState({
        dbSchema: { source: 'manual', tables: [] },
        screenshots: screenshotEntries,
        completedStep: 3,
      });
    }
    void navigate('/extract/screenshots');
  };

  return (
    <WizardLayout
      actions={
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => void navigate('/extract/code')} className="flex-1">
            {t('nav.back')}
          </Button>
          <Button fullWidth onClick={handleNext} disabled={!canProceed} className="flex-1">
            {t('nav.next')}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Primary path: Access DB file upload */}
        {!showFallback && (
          <FileDropZone
            accept=".mdb,.accdb"
            multiple={false}
            label={t('upload.db.label')}
            sublabel={t('upload.db.sub')}
            onFiles={(files) => void handleDbFile(files)}
            disabled={isParsing}
          />
        )}

        {isParsing && (
          <p className="text-sm text-gray-500 text-center">{t('status.generating')}</p>
        )}

        {parseError && (
          <p className="text-sm text-red-600">{parseError}</p>
        )}

        {/* Success: show table summary */}
        {schema && !isParsing && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="text-sm font-medium text-green-800">
              {t('upload.db.found')
                .replace('{tables}', String(schema.tables.length))
                .replace('{rels}', '—')}
            </p>
            {schema.tables.length > 0 && (
              <ul className="mt-2 space-y-0.5">
                {schema.tables.map((tbl) => (
                  <li key={tbl.name} className="text-xs text-gray-700 font-mono">
                    {tbl.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Fallback: screenshot upload */}
        {showFallback && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-gray-600">{t('upload.db.fallbackLink')}</p>
            <FileDropZone
              accept="image/*"
              multiple
              label={t('upload.screenshots.label')}
              sublabel={t('upload.screenshots.sub')}
              onFiles={(files) => setFallbackImages((prev) => [...prev, ...files])}
            />
            {fallbackImages.length > 0 && (
              <p className="text-xs text-gray-500">
                {fallbackImages.length} image(s) selected
              </p>
            )}
          </div>
        )}

        {/* Toggle fallback link */}
        {!showFallback && !schema && (
          <button
            type="button"
            className="text-sm text-blue-600 underline self-start"
            onClick={() => setShowFallback(true)}
          >
            {t('upload.db.fallbackLink')}
          </button>
        )}

        {/* Skip option */}
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={skipDb}
            onChange={(e) => setSkipDb(e.target.checked)}
            className="rounded border-gray-300"
          />
          {t('upload.db.skip')}
        </label>
        {skipDb && (
          <p className="text-xs text-amber-600">{t('upload.db.skipWarning')}</p>
        )}
      </div>
    </WizardLayout>
  );
}

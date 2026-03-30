import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import WizardLayout from '../../components/layout/WizardLayout';
import Button from '../../components/ui/Button';
import FileDropZone from '../../components/ui/FileDropZone';
import { useTranslation } from '../../i18n';
import { parseAccessFile } from '../../services/parsers/accessParser';
import { parseSqlFile } from '../../services/parsers/sqlParser';
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
    const sqlFile = files.find((f) => /\.sql$/i.test(f.name));
    const accessFile = files.find((f) => /\.(mdb|accdb)$/i.test(f.name));

    if (!sqlFile && !accessFile) {
      setParseError('Please upload a .sql, .mdb, or .accdb file');
      return;
    }

    setIsParsing(true);
    setParseError('');
    try {
      let result: DatabaseSchema | null = null;

      if (sqlFile) {
        const text = await sqlFile.text();
        result = parseSqlFile(text);
        if (!result) {
          setParseError('No CREATE TABLE statements found in the SQL file');
          setShowFallback(true);
        } else {
          setSchema(result);
          setShowFallback(false);
        }
      } else if (accessFile) {
        const buffer = await accessFile.arrayBuffer();
        result = parseAccessFile(accessFile.name, buffer);
        if (!result) {
          setParseError('File does not appear to be a valid Access database');
          setShowFallback(true);
        } else {
          setSchema(result);
          setShowFallback(false);
        }
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
        {/* Primary path: DB file upload (.sql, .mdb, .accdb) */}
        {!showFallback && (
          <>
            <FileDropZone
              accept=".sql,.mdb,.accdb"
              multiple={false}
              label="העלאת קובץ מסד נתונים"
              sublabel=".sql (מומלץ), .accdb או .mdb (Access)"
              onFiles={(files) => void handleDbFile(files)}
              disabled={isParsing}
            />
            <p className="text-xs text-gray-400 text-center">
              יציאת SQL מ-Access: פתח Access → External Data → Export → Text File / SQL
            </p>
          </>
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
              {schema.source === 'sql' && (
                <span className="ms-2 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                  SQL ✔ עמודות + קשרים
                </span>
              )}
            </p>
            {schema.tables.length > 0 && (
              <ul className="mt-2 space-y-1">
                {schema.tables.map((tbl) => (
                  <li key={tbl.name} className="text-xs text-gray-700">
                    <span className="font-mono font-semibold">{tbl.name}</span>
                    {tbl.columns.length > 0 && (
                      <span className="ms-1 text-gray-400">
                        ({tbl.columns.length} עמודות
                        {tbl.columns.filter((c) => c.isPrimaryKey).length > 0 &&
                          `, PK: ${tbl.columns.filter((c) => c.isPrimaryKey).map((c) => c.name).join(', ')}`}
                        )
                      </span>
                    )}
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

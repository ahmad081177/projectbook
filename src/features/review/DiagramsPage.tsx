import { useNavigate } from 'react-router';
import Button from '../../components/ui/Button';
import { useTranslation } from '../../i18n';
import { useAppStore } from '../../store';

export default function DiagramsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const diagrams = useAppStore((s) => s.diagrams);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 max-w-4xl w-full mx-auto p-6 flex flex-col gap-8">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">דיאגרמת מחלקות (UML)</h2>
          {diagrams.uml.status === 'complete' && diagrams.uml.mermaidCode ? (
            <pre className="bg-gray-900 text-green-300 rounded-lg p-4 text-xs overflow-x-auto whitespace-pre-wrap font-mono">
              {diagrams.uml.mermaidCode}
            </pre>
          ) : (
            <p className="text-gray-400 text-sm italic">
              {diagrams.uml.status === 'failed' ? '⚠ לא נוצרה דיאגרמה' : 'ממתין לייצור...'}
            </p>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">ERD — מסד נתונים</h2>
          {diagrams.erd.status === 'complete' && diagrams.erd.mermaidCode ? (
            <pre className="bg-gray-900 text-green-300 rounded-lg p-4 text-xs overflow-x-auto whitespace-pre-wrap font-mono">
              {diagrams.erd.mermaidCode}
            </pre>
          ) : (
            <p className="text-gray-400 text-sm italic">
              {diagrams.erd.status === 'failed' ? '⚠ לא נוצרה דיאגרמה' : 'ממתין לייצור...'}
            </p>
          )}
        </div>
      </div>

      <footer className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex justify-end gap-3">
          <Button variant="secondary" onClick={() => void navigate('/review/introduction')}>
            חזרה לפרקים
          </Button>
          <Button onClick={() => void navigate('/export')}>
            {t('download.button')}
          </Button>
        </div>
      </footer>
    </div>
  );
}

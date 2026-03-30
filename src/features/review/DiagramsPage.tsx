import { useNavigate } from 'react-router';
import WizardHeader from '../../components/layout/WizardHeader';
import Button from '../../components/ui/Button';
import { useTranslation } from '../../i18n';
import { useAppStore } from '../../store';

export default function DiagramsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const diagrams = useAppStore((s) => s.diagrams);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <WizardHeader />
      <div className="flex-1 max-w-4xl w-full mx-auto p-6 flex flex-col gap-8">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">{t('review.erd.title')}</h2>
          {diagrams.erd.status === 'complete' && diagrams.erd.mermaidCode ? (
            <pre className="bg-gray-900 text-green-300 rounded-lg p-4 text-xs overflow-x-auto whitespace-pre-wrap font-mono text-left" dir="ltr">
              {diagrams.erd.mermaidCode}
            </pre>
          ) : (
            <p className="text-gray-400 text-sm italic">
              {diagrams.erd.status === 'failed' ? t('review.erd.notCreated') : t('review.erd.waiting')}
            </p>
          )}
        </div>
      </div>

      <footer className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex justify-end gap-3">
          <Button variant="secondary" onClick={() => void navigate('/review/introduction')}>
            {t('review.backToChapters')}
          </Button>
          <Button onClick={() => void navigate('/export')}>
            {t('download.button')}
          </Button>
        </div>
      </footer>
    </div>
  );
}


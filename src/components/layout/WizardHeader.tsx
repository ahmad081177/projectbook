import { useTranslation } from '../../i18n';
import StepIndicator from './StepIndicator';

/**
 * Shared sticky top bar rendered on every wizard page.
 * Pages that use WizardLayout get this automatically.
 * Pages with custom full-screen layouts (Review, Generation, Diagrams) import it directly.
 */
export default function WizardHeader() {
  const { t } = useTranslation();
  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-2 flex-shrink-0">
      <div className="max-w-5xl mx-auto flex flex-col gap-1">
        <p className="text-center text-xs font-semibold text-blue-700 tracking-widest uppercase select-none">
          {t('app.subtitle')} · AutoProjectBook
        </p>
        <StepIndicator />
      </div>
    </header>
  );
}

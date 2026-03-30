import { useNavigate } from 'react-router';
import { useTranslation } from '../../i18n';
import { useAppStore } from '../../store';
import { WIZARD_STEPS } from '../../utils/constants';

const STEP_KEYS = [
  'step.language',
  'step.setup',
  'step.code',
  'step.database',
  'step.screenshots',
  'step.generate',
  'step.review',
  'step.export',
] as const;

const STEP_ROUTES = [
  '/',
  '/onboarding/api-key',
  '/extract/code',
  '/extract/database',
  '/extract/screenshots',
  '/generate',
  '/review/introduction',
  '/export',
] as const;

const TOTAL_STEPS = Object.keys(WIZARD_STEPS).length;

export default function StepIndicator() {
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const completedStep = useAppStore((s) => s.completedStep);
  const isGenerating = useAppStore((s) => s.isGenerating);

  // Current step is completedStep + 1 (0-indexed: completedStep=-1 means at step 0)
  const currentStep = completedStep + 1;

  const steps = Array.from({ length: TOTAL_STEPS }, (_, i) => ({
    number: i + 1,
    label: t(STEP_KEYS[i]),
    state: i < currentStep ? 'complete' : i === currentStep ? 'active' : 'locked',
  }));

  const isRtl = language === 'he' || language === 'ar';

  return (
    <nav
      aria-label="Wizard steps"
      className={`flex items-center justify-center gap-0 overflow-x-auto py-2 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {steps.map((step, index) => (
        <div
          key={step.number}
          className={`flex items-center ${isRtl && index < steps.length - 1 ? 'flex-row-reverse' : ''}`}
        >
          {/* Connector line (not before the first step) */}
          {index > 0 && (
            <div
              className={`h-px w-8 flex-shrink-0 ${index <= currentStep ? 'bg-blue-600' : 'bg-gray-200'}`}
            />
          )}

          {/* Step circle + label */}
          <div className="flex flex-col items-center gap-1">
            {step.state === 'complete' ? (
              <button
                type="button"
                onClick={() => { if (!isGenerating) void navigate(STEP_ROUTES[index]); }}
                aria-label={`${step.label} — ${t('step.goBack')}`}
                className={[
                  'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                  'bg-green-600 text-white',
                  isGenerating
                    ? 'cursor-not-allowed opacity-60'
                    : 'cursor-pointer hover:ring-2 hover:ring-green-400 hover:ring-offset-1',
                ].join(' ')}
              >
                ✓
              </button>
            ) : (
              <div
                aria-current={step.state === 'active' ? 'step' : undefined}
                className={[
                  'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                  step.state === 'active'
                    ? 'bg-blue-600 text-white ring-2 ring-blue-300 ring-offset-1'
                    : 'bg-gray-200 text-gray-400',
                  isGenerating ? 'cursor-not-allowed opacity-60' : '',
                ].join(' ')}
              >
                {step.number}
              </div>
            )}
            <span
              className={`hidden sm:block text-xs font-medium whitespace-nowrap ${
                step.state === 'active'
                  ? 'text-blue-600'
                  : step.state === 'complete'
                    ? 'text-green-700'
                    : 'text-gray-400'
              }`}
            >
              {step.label}
            </span>
          </div>
        </div>
      ))}
    </nav>
  );
}

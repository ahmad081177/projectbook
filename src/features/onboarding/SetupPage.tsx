import { useState } from 'react';
import { useNavigate } from 'react-router';
import WizardLayout from '../../components/layout/WizardLayout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { useTranslation } from '../../i18n';
import { testAzureConnection, testGeminiConnection, type AzureConfig } from '../../services/gemini';
import { useAppStore } from '../../store';
import type { AiProvider, GeminiModel } from '../../store/types';
import { KNOWN_GEMINI_MODELS } from '../../store/types';

const GEMINI_MODEL_OPTIONS = [
  ...KNOWN_GEMINI_MODELS.map((m) => ({ value: m, label: m })),
  { value: '__custom__', label: 'Custom model...' },
];

type ConnectionStatus = 'idle' | 'testing' | 'success' | 'error';

export default function SetupPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const storedName = useAppStore((s) => s.studentName);
  const storedProvider = useAppStore((s) => s.aiProvider);
  const storedModel = useAppStore((s) => s.geminiModel);
  const storedGeminiKey = useAppStore((s) => s.geminiApiKey);
  const storedAzureEndpoint = useAppStore((s) => s.azureEndpoint);
  const storedAzureKey = useAppStore((s) => s.azureApiKey);
  const storedAzureDeployment = useAppStore((s) => s.azureDeploymentName);
  const storedAzureApiVersion = useAppStore((s) => s.azureApiVersion);

  const [name, setName] = useState(storedName);
  const [provider, setProvider] = useState<AiProvider>(storedProvider);

  // Gemini state
  const isKnownModel = (KNOWN_GEMINI_MODELS as readonly string[]).includes(storedModel);
  const [geminiKey, setGeminiKey] = useState(storedGeminiKey);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [modelSelect, setModelSelect] = useState<string>(isKnownModel ? storedModel : '__custom__');
  const [customModel, setCustomModel] = useState<string>(isKnownModel ? '' : storedModel);

  // Azure state
  const [azureEndpoint, setAzureEndpoint] = useState(storedAzureEndpoint);
  const [azureKey, setAzureKey] = useState(storedAzureKey);
  const [showAzureKey, setShowAzureKey] = useState(false);
  const [azureDeployment, setAzureDeployment] = useState(storedAzureDeployment);
  const [azureApiVersion, setAzureApiVersion] = useState(storedAzureApiVersion || '2024-02-01');

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');
  const [connectionError, setConnectionError] = useState('');
  const [nameError, setNameError] = useState('');

  const effectiveModel: GeminiModel = modelSelect === '__custom__' ? customModel : modelSelect;

  const canProceed = connectionStatus === 'success' && name.trim().length > 0;

  const resetConnection = () => {
    if (connectionStatus !== 'idle') setConnectionStatus('idle');
  };

  const validate = (): boolean => {
    let valid = true;
    if (!name.trim()) { setNameError(t('error.required')); valid = false; }
    else setNameError('');
    return valid;
  };

  const handleTest = async () => {
    if (!validate()) return;
    setConnectionStatus('testing');
    setConnectionError('');

    if (provider === 'gemini') {
      const result = await testGeminiConnection(geminiKey, effectiveModel);
      if (result.ok) {
        setConnectionStatus('success');
      } else {
        setConnectionStatus('error');
        setConnectionError(result.error ?? t('error.connection'));
      }
    } else {
      const cfg: AzureConfig = {
        endpoint: azureEndpoint,
        apiKey: azureKey,
        deploymentName: azureDeployment,
        apiVersion: azureApiVersion,
      };
      const result = await testAzureConnection(cfg);
      if (result.ok) {
        setConnectionStatus('success');
      } else {
        setConnectionStatus('error');
        setConnectionError(result.error ?? t('error.connection'));
      }
    }
  };

  const handleNext = () => {
    if (!canProceed) return;
    if (provider === 'gemini') {
      useAppStore.setState({
        studentName: name.trim(),
        aiProvider: 'gemini',
        geminiApiKey: geminiKey,
        geminiModel: effectiveModel,
        completedStep: 1,
      });
    } else {
      useAppStore.setState({
        studentName: name.trim(),
        aiProvider: 'azure-openai',
        azureEndpoint,
        azureApiKey: azureKey,
        azureDeploymentName: azureDeployment,
        azureApiVersion,
        completedStep: 1,
      });
    }
    void navigate('/extract/code');
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
        <Input
          label={t('field.name')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={nameError}
          autoComplete="name"
          autoFocus
        />

        {/* Provider toggle */}
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-gray-700">{t('field.provider')}</span>
          <div className="flex rounded-md border border-gray-300 overflow-hidden">
            {(['gemini', 'azure-openai'] as AiProvider[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => { setProvider(p); resetConnection(); }}
                className={[
                  'flex-1 py-2 text-sm font-medium transition-colors',
                  provider === p
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50',
                ].join(' ')}
              >
                {p === 'gemini' ? t('provider.gemini') : t('provider.azure')}
              </button>
            ))}
          </div>
        </div>

        {provider === 'gemini' ? (
          <>
            <div className="flex flex-col gap-2">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Input
                    label={t('field.apiKey')}
                    type={showGeminiKey ? 'text' : 'password'}
                    value={geminiKey}
                    onChange={(e) => { setGeminiKey(e.target.value); resetConnection(); }}
                    autoComplete="off"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowGeminiKey((v) => !v)}
                  className="mb-0.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-md"
                  aria-label={showGeminiKey ? 'Hide key' : 'Show key'}
                >
                  {showGeminiKey ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Select
                label={t('field.model')}
                options={GEMINI_MODEL_OPTIONS}
                value={modelSelect}
                onChange={(e) => { setModelSelect(e.target.value); resetConnection(); }}
              />
              {modelSelect === '__custom__' && (
                <Input
                  label={t('field.customModel')}
                  placeholder="e.g. gemini-2.5-pro or gpt-4o"
                  value={customModel}
                  onChange={(e) => { setCustomModel(e.target.value); resetConnection(); }}
                  autoComplete="off"
                />
              )}
            </div>
          </>
        ) : (
          <>
            <Input
              label={t('field.azureEndpoint')}
              placeholder="https://your-resource.openai.azure.com"
              value={azureEndpoint}
              onChange={(e) => { setAzureEndpoint(e.target.value); resetConnection(); }}
              autoComplete="off"
            />

            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input
                  label={t('field.apiKey')}
                  type={showAzureKey ? 'text' : 'password'}
                  value={azureKey}
                  onChange={(e) => { setAzureKey(e.target.value); resetConnection(); }}
                  autoComplete="off"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowAzureKey((v) => !v)}
                className="mb-0.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-md"
                aria-label={showAzureKey ? 'Hide key' : 'Show key'}
              >
                {showAzureKey ? '🙈' : '👁'}
              </button>
            </div>

            <Input
              label={t('field.azureDeployment')}
              placeholder="e.g. gpt-4o"
              value={azureDeployment}
              onChange={(e) => { setAzureDeployment(e.target.value); resetConnection(); }}
              autoComplete="off"
            />

            <Input
              label={t('field.azureApiVersion')}
              value={azureApiVersion}
              onChange={(e) => { setAzureApiVersion(e.target.value); resetConnection(); }}
              autoComplete="off"
            />
          </>
        )}

        {/* Connection test result */}
        {connectionStatus === 'success' && (
          <p className="text-sm text-green-600 font-medium">✓ {t('connection.success')}</p>
        )}
        {connectionStatus === 'error' && (
          <p className="text-sm text-red-600">{connectionError || t('error.connection')}</p>
        )}

        <Button
          variant="secondary"
          size="sm"
          isLoading={connectionStatus === 'testing'}
          onClick={() => void handleTest()}
          className="self-start"
        >
          {t('connection.test')}
        </Button>
      </div>
    </WizardLayout>
  );
}


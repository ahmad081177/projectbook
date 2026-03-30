import { useState } from 'react';
import { useNavigate } from 'react-router';
import WizardLayout from '../../components/layout/WizardLayout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { useTranslation } from '../../i18n';
import { testGeminiConnection } from '../../services/gemini';
import { useAppStore } from '../../store';
import type { GeminiModel } from '../../store/types';

const MODEL_OPTIONS: { value: GeminiModel; label: string }[] = [
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (recommended)' },
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
  { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
  { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
];

type ConnectionStatus = 'idle' | 'testing' | 'success' | 'error';

export default function SetupPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const storedName = useAppStore((s) => s.studentName);
  const storedModel = useAppStore((s) => s.geminiModel);

  const [name, setName] = useState(storedName);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [model, setModel] = useState<GeminiModel>(storedModel);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');
  const [connectionError, setConnectionError] = useState('');

  const [nameError, setNameError] = useState('');
  const [keyError, setKeyError] = useState('');

  const canProceed = connectionStatus === 'success' && name.trim().length > 0;

  const validate = () => {
    let valid = true;
    if (!name.trim()) {
      setNameError(t('error.required'));
      valid = false;
    } else {
      setNameError('');
    }
    if (!apiKey.trim()) {
      setKeyError(t('error.required'));
      valid = false;
    } else {
      setKeyError('');
    }
    return valid;
  };

  const handleTest = async () => {
    if (!validate()) return;
    setConnectionStatus('testing');
    setConnectionError('');

    const result = await testGeminiConnection(apiKey, model);
    if (result.ok) {
      setConnectionStatus('success');
    } else {
      setConnectionStatus('error');
      setConnectionError(result.error ?? t('error.connection'));
    }
  };

  const handleNext = () => {
    if (!canProceed) return;
    useAppStore.setState({
      studentName: name.trim(),
      geminiApiKey: apiKey,
      geminiModel: model,
      completedStep: 1,
    });
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

        <div className="flex flex-col gap-2">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Input
                label={t('field.apiKey')}
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  if (connectionStatus !== 'idle') setConnectionStatus('idle');
                }}
                error={keyError}
                autoComplete="off"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowKey((v) => !v)}
              className="mb-0.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-md"
              aria-label={showKey ? 'Hide key' : 'Show key'}
            >
              {showKey ? '🙈' : '👁'}
            </button>
          </div>

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

        <Select
          label={t('field.model')}
          options={MODEL_OPTIONS}
          value={model}
          onChange={(e) => {
            setModel(e.target.value as GeminiModel);
            if (connectionStatus === 'success') setConnectionStatus('idle');
          }}
        />
      </div>
    </WizardLayout>
  );
}

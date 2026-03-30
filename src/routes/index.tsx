import { createBrowserRouter } from 'react-router';
import App from '../App';
import StepGuard from './guards/StepGuard';
import LanguageSelectionPage from '../features/onboarding/LanguageSelectionPage';
import SetupPage from '../features/onboarding/SetupPage';
import CodeUploadPage from '../features/extraction/CodeUploadPage';
import DatabaseUploadPage from '../features/extraction/DatabaseUploadPage';
import ScreenshotsPage from '../features/extraction/ScreenshotsPage';
import GenerationPage from '../features/generation/GenerationPage';
import ReviewPage from '../features/review/ReviewPage';
import DiagramsPage from '../features/review/DiagramsPage';
import ExportPage from '../features/export/ExportPage';

// Placeholder page components — replaced by real feature pages in later stories
function Placeholder({ title }: { title: string }) {
  return <div className="p-8 text-start text-gray-500">{title} — coming soon</div>;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <LanguageSelectionPage /> },
      {
        path: 'onboarding',
        children: [
          {
            path: 'api-key',
            element: (
              <StepGuard requiredStep={0}>
                <SetupPage />
              </StepGuard>
            ),
          },
        ],
      },
      {
        path: 'extract',
        children: [
          {
            path: 'code',
            element: (
              <StepGuard requiredStep={1}>
                <CodeUploadPage />
              </StepGuard>
            ),
          },
          {
            path: 'database',
            element: (
              <StepGuard requiredStep={2}>
                <DatabaseUploadPage />
              </StepGuard>
            ),
          },
          {
            path: 'screenshots',
            element: (
              <StepGuard requiredStep={3}>
                <ScreenshotsPage />
              </StepGuard>
            ),
          },
        ],
      },
      {
        path: 'generate',
        element: (
          <StepGuard requiredStep={4}>
            <GenerationPage />
          </StepGuard>
        ),
      },
      {
        path: 'review/:chapterKey',
        element: (
          <StepGuard requiredStep={5}>
            <ReviewPage />
          </StepGuard>
        ),
      },
      {
        path: 'review/diagrams',
        element: (
          <StepGuard requiredStep={5}>
            <DiagramsPage />
          </StepGuard>
        ),
      },
      {
        path: 'preview',
        element: (
          <StepGuard requiredStep={5}>
            <Placeholder title="Preview" />
          </StepGuard>
        ),
      },
      {
        path: 'export',
        element: (
          <StepGuard requiredStep={5}>
            <ExportPage />
          </StepGuard>
        ),
      },
    ],
  },
]);

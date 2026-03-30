import type { ReactNode } from 'react';
import WizardHeader from './WizardHeader';

interface WizardLayoutProps {
  children: ReactNode;
  /** CTA button(s) rendered in the bottom action bar */
  actions?: ReactNode;
  /** Hide the step indicator (e.g. language selection screen) */
  showSteps?: boolean;
}

export default function WizardLayout({
  children,
  actions,
  showSteps = true,
}: WizardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Step indicator + app title pinned at top */}
      {showSteps && <WizardHeader />}

      {/* Page content */}
      <main className="flex-1 flex flex-col">
        <div className="max-w-2xl w-full mx-auto px-4 py-8 flex-1">
          {children}
        </div>
      </main>

      {/* Bottom action bar */}
      {actions && (
        <footer className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-4">
          <div className="max-w-2xl mx-auto">{actions}</div>
        </footer>
      )}
    </div>
  );
}

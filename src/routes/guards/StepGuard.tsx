import { type ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useAppStore } from '../../store';

interface StepGuardProps {
  requiredStep: number;
  children: ReactNode;
}

export default function StepGuard({ requiredStep, children }: StepGuardProps) {
  const completedStep = useAppStore((s) => s.completedStep);
  if (completedStep < requiredStep) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

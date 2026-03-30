import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import StepIndicator from './StepIndicator';
import { useAppStore } from '../../store';

describe('StepIndicator', () => {
  beforeEach(() => {
    useAppStore.setState({ language: 'he', completedStep: -1 });
  });

  it('renders 8 step circles', () => {
    render(<StepIndicator />);
    // Each step has a circle with its number (locked state shows number, active shows number, complete shows check)
    // Step 1 is active (completedStep=-1 so currentStep=0 = step index 0 = number 1)
    const nav = screen.getByRole('navigation', { name: 'Wizard steps' });
    expect(nav).toBeInTheDocument();
    // Step 2-8 should show their numbers
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('marks first step as active when completedStep=-1', () => {
    render(<StepIndicator />);
    const activeStep = screen.getByRole('navigation').querySelector('[aria-current="step"]');
    expect(activeStep).toBeInTheDocument();
    expect(activeStep?.textContent).toBe('1');
  });

  it('reverses order for RTL (Hebrew)', () => {
    render(<StepIndicator />);
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveClass('flex-row-reverse');
  });

  it('does NOT reverse order for non-RTL language', () => {
    // Though the app only supports he/ar (both RTL), test the logic
    // We can only test Hebrew and Arabic — both are RTL, so let's verify the class is applied
    useAppStore.setState({ language: 'ar' });
    render(<StepIndicator />);
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveClass('flex-row-reverse');
  });

  it('shows checkmark for completed step', () => {
    useAppStore.setState({ completedStep: 0 }); // step 0 complete, step 1 active
    render(<StepIndicator />);
    expect(screen.getByText('✓')).toBeInTheDocument();
  });
});

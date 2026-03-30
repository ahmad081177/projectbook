import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Input from './Input';

describe('Input', () => {
  it('renders label', () => {
    render(<Input label="Name" />);
    expect(screen.getByText('Name')).toBeInTheDocument();
  });

  it('shows error message and sets aria-invalid', () => {
    render(<Input label="Email" error="Required" />);
    expect(screen.getByText('Required')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('textbox')).toHaveClass('border-red-500');
  });

  it('shows helper text when no error', () => {
    render(<Input label="Key" helperText="Paste your API key here" />);
    expect(screen.getByText('Paste your API key here')).toBeInTheDocument();
  });

  it('does not show helper text when there is an error', () => {
    render(<Input label="Key" error="Invalid" helperText="Paste your API key here" />);
    expect(screen.queryByText('Paste your API key here')).not.toBeInTheDocument();
  });
});

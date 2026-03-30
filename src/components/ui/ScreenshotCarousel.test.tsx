import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ScreenshotCarousel from './ScreenshotCarousel';
import type { Screenshot } from '../../store/types';

const makeShot = (id: string, name: string): Screenshot => ({
  id,
  caption: '',
  screenName: name,
  userType: 'both',
  thumbnailUrl: `blob:test/${id}`,
  file: null,
});

const shots: Screenshot[] = [
  makeShot('a', 'Screen A'),
  makeShot('b', 'Screen B'),
  makeShot('c', 'Screen C'),
];

describe('ScreenshotCarousel', () => {
  it('renders the first screenshot and progress indicator', () => {
    render(
      <ScreenshotCarousel
        screenshots={shots}
        startIndex={0}
        onUpdate={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText(/1.*3/)).toBeTruthy();
    expect(screen.getByDisplayValue('Screen A')).toBeTruthy();
  });

  it('saves and advances to next on Save & Next', () => {
    const onUpdate = vi.fn();
    render(
      <ScreenshotCarousel
        screenshots={shots}
        startIndex={0}
        onUpdate={onUpdate}
        onClose={vi.fn()}
      />,
    );
    const nameInput = screen.getByDisplayValue('Screen A') as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Login Screen' } });

    fireEvent.click(screen.getByText(/שמור|Save/i));
    expect(onUpdate).toHaveBeenCalledWith('a', expect.objectContaining({ screenName: 'Login Screen' }));
    // Should advance — progress shows "2 of 3"
    expect(screen.getByText(/2.*3/)).toBeTruthy();
  });

  it('skip does not call onUpdate and advances', () => {
    const onUpdate = vi.fn();
    render(
      <ScreenshotCarousel
        screenshots={shots}
        startIndex={0}
        onUpdate={onUpdate}
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText(/דלג|Skip/i));
    expect(onUpdate).not.toHaveBeenCalled();
    expect(screen.getByText(/2.*3/)).toBeTruthy();
  });

  it('calls onClose when Escape key pressed', () => {
    const onClose = vi.fn();
    render(
      <ScreenshotCarousel
        screenshots={shots}
        startIndex={0}
        onUpdate={vi.fn()}
        onClose={onClose}
      />,
    );
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('opens at startIndex', () => {
    render(
      <ScreenshotCarousel
        screenshots={shots}
        startIndex={2}
        onUpdate={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText(/3.*3/)).toBeTruthy();
    expect(screen.getByDisplayValue('Screen C')).toBeTruthy();
  });

  it('calls onClose when last item is saved', () => {
    const onClose = vi.fn();
    render(
      <ScreenshotCarousel
        screenshots={[makeShot('x', 'Only')]}
        startIndex={0}
        onUpdate={vi.fn()}
        onClose={onClose}
      />,
    );
    fireEvent.click(screen.getByText(/הושלם|complete/i));
    expect(onClose).toHaveBeenCalled();
  });
});

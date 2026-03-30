import { render } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import RTLProvider from './RTLProvider';
import { useAppStore } from '../../store';

describe('RTLProvider', () => {
  beforeEach(() => {
    useAppStore.setState({ language: 'he' });
  });

  it('sets dir=rtl on <html> for Hebrew', () => {
    render(<RTLProvider><div>test</div></RTLProvider>);
    expect(document.documentElement.getAttribute('dir')).toBe('rtl');
    expect(document.documentElement.getAttribute('lang')).toBe('he');
  });

  it('sets lang=ar on <html> when language is Arabic', () => {
    useAppStore.setState({ language: 'ar' });
    render(<RTLProvider><div>test</div></RTLProvider>);
    expect(document.documentElement.getAttribute('lang')).toBe('ar');
  });
});

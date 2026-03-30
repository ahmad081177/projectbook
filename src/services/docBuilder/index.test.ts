/**
 * Unit tests for docBuilder helpers — Story 8-3 (markdownToDocxParagraphs)
 */
import { describe, it, expect } from 'vitest';
import { markdownToDocxParagraphs, parseInlineMarkdown } from './index';

/** Extract the pStyle value string from a Paragraph (e.g. 'Heading2', undefined for normal) */
function getParagraphStyle(para: unknown): string | undefined {
  // Path: Paragraph.root[0]=pPr → pPr.root[0]=w:pStyle → pStyle.root[0]=_attr → _attr.root.val.value
  const p = para as {
    root?: Array<{
      root?: Array<{
        root?: Array<{ root?: { val?: { value?: string } } }>;
      }>;
    }>;
  };
  return p?.root?.[0]?.root?.[0]?.root?.[0]?.root?.val?.value;
}

// ── parseInlineMarkdown ─────────────────────────────────────────────────────

describe('parseInlineMarkdown', () => {
  it('returns at least one TextRun for plain text', () => {
    const runs = parseInlineMarkdown('hello world');
    expect(runs.length).toBeGreaterThanOrEqual(1);
  });

  it('falls back to single run when no patterns match', () => {
    const runs = parseInlineMarkdown('no markdown here');
    expect(runs.length).toBeGreaterThanOrEqual(1);
  });

  it('produces multiple runs when mixing bold and plain text', () => {
    const runs = parseInlineMarkdown('prefix **bold** suffix');
    expect(runs.length).toBeGreaterThanOrEqual(2);
  });
});

// ── markdownToDocxParagraphs ────────────────────────────────────────────────

describe('markdownToDocxParagraphs', () => {
  it('returns Paragraph array for plain text', () => {
    const paras = markdownToDocxParagraphs('Simple paragraph.');
    expect(paras).toHaveLength(1);
  });

  it('produces a Heading2 paragraph for ## headings', () => {
    const paras = markdownToDocxParagraphs('## My Heading');
    expect(paras).toHaveLength(1);
    expect(getParagraphStyle(paras[0])).toBe('Heading2');
  });

  it('produces a Heading3 paragraph for ### headings', () => {
    const paras = markdownToDocxParagraphs('### Sub Heading');
    expect(paras).toHaveLength(1);
    expect(getParagraphStyle(paras[0])).toBe('Heading3');
  });

  it('produces a Heading4 paragraph for #### headings', () => {
    const paras = markdownToDocxParagraphs('#### Deep Heading');
    expect(paras).toHaveLength(1);
    expect(getParagraphStyle(paras[0])).toBe('Heading4');
  });

  it('plain text paragraphs do NOT have a heading style', () => {
    const paras = markdownToDocxParagraphs('Just a sentence.');
    expect(getParagraphStyle(paras[0])).toBeUndefined();
  });

  it('skips --- horizontal rule lines', () => {
    const paras = markdownToDocxParagraphs('Line one\n---\nLine two');
    expect(paras.length).toBeLessThanOrEqual(2);
  });

  it('treats blank lines as paragraph breaks', () => {
    const paras = markdownToDocxParagraphs('First block\n\nSecond block');
    expect(paras).toHaveLength(2);
  });

  it('handles bullet lines starting with -', () => {
    const paras = markdownToDocxParagraphs('- item one\n- item two');
    expect(paras).toHaveLength(2);
  });

  it('produces correct paragraph count for mixed input', () => {
    const input = `## Section\nSome text with **bold**.\n\n- bullet`;
    const paras = markdownToDocxParagraphs(input);
    expect(paras.length).toBeGreaterThanOrEqual(3);
  });

  it('returns empty array for empty input', () => {
    const paras = markdownToDocxParagraphs('');
    expect(paras).toHaveLength(0);
  });
});

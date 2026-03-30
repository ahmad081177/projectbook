# Story 8-3: DOCX Rich Text Formatting + Table of Contents Support

**Epic:** 8 — Document Export
**Story ID:** 8-3
**Status:** review
**Date:** 2026-03-30
**Project:** AutoProjectBook (Sefer-Proyekt-Wizard)

---

## Story

As a student downloading my project book,
I want the generated Word document to use proper heading styles, bold text, italic text, and underlined text matching the AI's markdown output,
so that I can use Word's "Insert → Table of Contents" feature to automatically generate a table of contents, and the document looks professionally formatted.

---

## Problem Being Solved

Currently `splitIntoParagraphs()` in `src/services/docBuilder/index.ts` splits the AI response on double newlines and renders every block as a plain `rtlParagraph()`. The AI consistently returns **markdown-formatted text** with:
- `## Section Heading` → should become `HeadingLevel.HEADING_2` paragraph
- `### Sub-heading` → should become `HeadingLevel.HEADING_3` paragraph
- `**bold text**` → should become a `TextRun` with `bold: true`
- `*italic text*` or `_italic text_` → `TextRun` with `italics: true`
- `__underline__` → `TextRun` with `underline: {}`

Because all content is rendered as `Normal` style paragraphs, Word cannot detect heading structure, so "Insert Table of Contents" produces nothing useful.

---

## Acceptance Criteria

1. A new function `markdownToDocxParagraphs(text: string): Paragraph[]` in `docBuilder/index.ts` replaces all calls to `splitIntoParagraphs()` within `buildChapterSection()`, `buildIntroWithScreenshot()`, and `buildUserGuideWithScreenshots()`.

2. Heading detection (line-level, applied to whole paragraph):
   - `## Heading text` → `new Paragraph({ ...RTL_PARA, heading: HeadingLevel.HEADING_2, children: [new TextRun({ ...HEADING2_RUN, text: 'Heading text' })] })`
   - `### Sub-heading text` → `HeadingLevel.HEADING_3` with `HEADING2_RUN` style (13pt bold)
   - `#### Sub-sub-heading` → `HeadingLevel.HEADING_4` with `HEBREW_RUN` bold

3. Inline inline formatting within regular paragraphs:
   - `**word**` → `TextRun` with `bold: true`
   - `*word*` or `_word_` → `TextRun` with `italics: true`
   - `__word__` → `TextRun` with `underline: {}`
   - Nested: `**_bold italic_**` → `bold: true, italics: true`
   - All `TextRun`s must still include `...HEBREW_RUN` (font: David MT, size: 24)

4. Paragraphs that contain NO markdown formatting continue to render as plain `rtlParagraph()` — no regression.

5. `---` horizontal rules are skipped (not rendered).

6. Bullet lines starting with `-` or `•` get an indent (`indent: { left: 720 }`) and a bullet character prepended.

7. `chapterHeading()` (the main H1 per chapter) is **not changed** — it already uses `HeadingLevel.HEADING_1`.

8. After the change, a `.docx` opened in Word shows the Navigation Pane populated with all `##` and `###` headings from the AI response.

9. `npm run typecheck` passes clean. `npm run build` succeeds. `npm test -- --run` stays 68/68.

---

## Key Files

| File | Change |
|------|--------|
| `src/services/docBuilder/index.ts` | Add `markdownToDocxParagraphs()`, replace `splitIntoParagraphs()` calls |
| `src/services/docBuilder/styles.ts` | Optionally add `HEADING3_RUN`, `HEADING4_RUN` run styles |

No other files need modification.

---

## Implementation Guide

### Step 1 — Add heading run styles to `styles.ts`

```typescript
export const HEADING3_RUN: Partial<IRunOptions> = {
  ...HEBREW_RUN,
  bold: true,
  size: 24, // 12pt bold
};

export const HEADING4_RUN: Partial<IRunOptions> = {
  ...HEBREW_RUN,
  bold: true,
  size: 24,
};
```

### Step 2 — Inline markdown parser helper

Write a helper `parseInlineMarkdown(text: string): TextRun[]` that walks the string and emits `TextRun` nodes:

```typescript
function parseInlineMarkdown(text: string): TextRun[] {
  // Use a simple regex-based tokenizer
  // Pattern priority: **bold**, *italic*, _italic_, __underline__, plain
  // Each segment gets ...HEBREW_RUN as base, then overrides
}
```

Key regex: `/(\*\*_.+?_\*\*|\*\*.+?\*\*|__[^_]+__|_[^_]+_|\*[^*]+\*|[^*_]+)/g`

### Step 3 — Full `markdownToDocxParagraphs(text: string): Paragraph[]`

```typescript
function markdownToDocxParagraphs(text: string): Paragraph[] {
  const lines = text.split('\n');
  const paragraphs: Paragraph[] = [];
  let block: string[] = [];

  const flushBlock = () => {
    if (!block.length) return;
    const joined = block.join('\n').trim();
    block = [];
    if (!joined) return;
    paragraphs.push(new Paragraph({
      ...RTL_PARA,
      children: parseInlineMarkdown(joined),
    }));
  };

  for (const raw of lines) {
    const line = raw.trimEnd();

    // Skip horizontal rules
    if (/^---+$/.test(line)) { flushBlock(); continue; }

    // Heading levels
    const h4 = line.match(/^####\s+(.*)/);
    const h3 = line.match(/^###\s+(.*)/);
    const h2 = line.match(/^##\s+(.*)/);
    if (h2 || h3 || h4) {
      flushBlock();
      const match = (h2 ?? h3 ?? h4)!;
      const level = h4 ? 4 : h3 ? 3 : 2;
      const headingLevel = level === 2 ? HeadingLevel.HEADING_2 : level === 3 ? HeadingLevel.HEADING_3 : HeadingLevel.HEADING_4;
      const runStyle = level === 2 ? HEADING2_RUN : HEADING3_RUN;
      paragraphs.push(new Paragraph({
        ...RTL_PARA,
        heading: headingLevel,
        children: [new TextRun({ ...runStyle, text: match[1] })],
      }));
      continue;
    }

    // Bullet items
    if (/^[-•]\s+/.test(line)) {
      flushBlock();
      paragraphs.push(new Paragraph({
        ...RTL_PARA,
        indent: { right: 720 },
        children: parseInlineMarkdown('• ' + line.replace(/^[-•]\s+/, '')),
      }));
      continue;
    }

    // Blank line = paragraph break
    if (line === '') { flushBlock(); continue; }

    block.push(line);
  }
  flushBlock();
  return paragraphs;
}
```

### Step 4 — Replace all `splitIntoParagraphs()` calls

In `buildChapterSection()`, change:
```typescript
paragraphs.push(...splitIntoParagraphs(content));
```
to:
```typescript
paragraphs.push(...markdownToDocxParagraphs(content));
```

Apply the same replacement in `buildIntroWithScreenshot()` and `buildUserGuideWithScreenshots()`.

### Step 5 — Remove `splitIntoParagraphs()` function (it is now unused)

---

## Technical Constraints

- All `TextRun` nodes **must** include `...HEBREW_RUN` (font David MT, size 24). Never omit this or text will render in Times New Roman.
- Heading paragraphs need BOTH `heading: HeadingLevel.HEADING_X` AND `...RTL_PARA` to remain right-aligned.
- Do NOT change `chapterHeading()` — it handles H1 chapter titles.
- The `docx` library version in use imports from `'docx'` directly — check `HeadingLevel` is already imported in `index.ts` (it is).

---

## Testing

- Add a unit test in `src/services/docBuilder/index.test.ts` (create file if not exists) that calls `markdownToDocxParagraphs` with a sample multi-format string and asserts:
  - `## Title` produces a paragraph with `heading === HeadingLevel.HEADING_2`
  - `**bold**` produces a TextRun with `bold === true`
  - Plain text produces a TextRun with `bold` undefined/false
- Manual smoke test: generate a full docx, open in Word, verify Navigation Pane shows chapter structure.

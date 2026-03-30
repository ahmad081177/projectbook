# Story 8-4: Distribute Screenshots Across All Document Sections

**Epic:** 8 — Document Export
**Story ID:** 8-4
**Status:** ready-for-dev
**Date:** 2026-03-30
**Project:** AutoProjectBook (Sefer-Proyekt-Wizard)

---

## Story

As a student downloading my project book,
I want my uploaded screenshots to appear inside the relevant chapter sections (System Analysis, Server Implementation, Client Implementation, User Guide, and Introduction),
so that each section of the book contains visual evidence related to its topic rather than all images being concentrated only in the User Guide chapter.

---

## Problem Being Solved

Currently only two chapters embed screenshots:
- **Introduction** (`buildIntroWithScreenshot`) — embeds `screenshotFiles[0]`
- **User Guide** (`buildUserGuideWithScreenshots`) — embeds ALL screenshots

All other chapters (System Analysis, Server Implementation, Client Implementation, etc.) contain only AI-generated text — no images at all.

Students upload screenshots of their running application specifically to make the document richer. The expectation is that each major section that describes functionality has at least one relevant image.

---

## Acceptance Criteria

1. Screenshots are distributed across chapter sections using a round-robin strategy:
   - **Introduction** → `screenshotFiles[0]` if available (existing behaviour — already done in `buildIntroWithScreenshot`)
   - **System Analysis** → `screenshotFiles[1]` if available, appended after the chapter text
   - **Server Implementation** → `screenshotFiles[2]` if available, appended after the chapter text
   - **Client Implementation** → `screenshotFiles[3]` if available, appended after the chapter text
   - **User Guide** → all remaining screenshots (`screenshotFiles[4...]`) if available, PLUS the first 4 are shown again as a gallery (existing behaviour keeps all of them — no regression)

2. When fewer than 5 screenshots are uploaded, the unmatched sections get no image — **no error, no placeholder**.

3. When `screenshotFiles` is empty (user skipped the step or array is empty), all sections fall back to text-only — **no regression compared to current behaviour**.

4. Each embedded screenshot in a non-User-Guide chapter is rendered as:
   ```
   [H2 heading: screenshot.screenName]
   [ImageRun width:420, height:280]
   [italic caption paragraph]
   [user-type note paragraph in gray 10pt]
   ```
   Reuse the same pattern already used in `buildUserGuideWithScreenshots()`.

5. The assignment of screenshots to sections is **index-based** (screenshot 0→intro, 1→sysAnalysis, 2→server, 3→client, 4+→userGuide) — no AI analysis, no smart matching.

6. `npm run typecheck` passes clean. `npm run build` succeeds. `npm test -- --run` stays 68/68.

---

## Key Files

| File | Change |
|------|--------|
| `src/services/docBuilder/index.ts` | Update `buildChapterSection()` calls and/or create per-chapter builder variants |

No other files need modification. `BuildDocumentInput` interface already includes `screenshotFiles`.

---

## Current Architecture Context

**`buildAndDownloadDocument()`** is the main function in `src/services/docBuilder/index.ts`. It calls:

```typescript
const chapterSections: Paragraph[] = CHAPTER_ORDER.flatMap((key) => {
  if (key === 'introduction') {
    return buildIntroWithScreenshot(content, status, screenshotFiles?.[0]);
  }
  if (key === 'userGuide') {
    return buildUserGuideWithScreenshots(content, status, screenshotFiles);
  }
  return buildChapterSection(key, content, status);
});
```

## Implementation Guide

### Step 1 — Create `buildChapterSectionWithOptionalScreenshot()`

Extract a shared helper that appends one optional screenshot after a chapter's text:

```typescript
function appendOptionalScreenshot(
  paragraphs: Paragraph[],
  screenshot: BuildDocumentInput['screenshotFiles'][number] | undefined,
): void {
  if (!screenshot) return;
  paragraphs.push(
    new Paragraph({
      ...RTL_PARA,
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun({ ...HEADING2_RUN, text: screenshot.screenName })],
    }),
  );
  try {
    paragraphs.push(
      new Paragraph({
        ...RTL_PARA,
        alignment: AlignmentType.CENTER,
        children: [
          new ImageRun({
            type: 'png',
            data: screenshot.arrayBuffer,
            transformation: { width: 420, height: 280 },
          }),
        ],
      }),
    );
  } catch { /* skip image on failure */ }
  if (screenshot.caption) {
    paragraphs.push(
      new Paragraph({
        ...RTL_PARA,
        children: [new TextRun({ ...HEBREW_RUN, italics: true, text: screenshot.caption })],
      }),
    );
  }
  paragraphs.push(
    new Paragraph({
      ...RTL_PARA,
      children: [new TextRun({ ...HEBREW_RUN, italics: true, size: 20, color: '6B7280',
        text: `(סוג משתמש: ${USER_TYPE_HE[screenshot.userType]})` })],
    }),
  );
}
```

### Step 2 — Update `buildAndDownloadDocument()` flatMap

Change the `CHAPTER_ORDER.flatMap(...)` block to:

```typescript
const ss = input.screenshotFiles ?? [];

const chapterSections: Paragraph[] = CHAPTER_ORDER.flatMap((key) => {
  const content = input.generatedContent[key].content;
  const status = input.generatedContent[key].status;

  if (key === 'introduction') {
    return buildIntroWithScreenshot(content, status, ss[0]);
  }
  if (key === 'systemAnalysis') {
    const paras = buildChapterSection(key, content, status);
    appendOptionalScreenshot(paras, ss[1]);
    return paras;
  }
  if (key === 'serverImplementation') {
    const paras = buildChapterSection(key, content, status);
    appendOptionalScreenshot(paras, ss[2]);
    return paras;
  }
  if (key === 'clientImplementation') {
    const paras = buildChapterSection(key, content, status);
    appendOptionalScreenshot(paras, ss[3]);
    return paras;
  }
  if (key === 'userGuide') {
    return buildUserGuideWithScreenshots(content, status, ss);
  }
  return buildChapterSection(key, content, status);
});
```

### Step 3 — Verify `USER_TYPE_HE` is accessible

`USER_TYPE_HE` is already defined at module scope in `docBuilder/index.ts` — no import needed.

---

## Technical Constraints

- The index positions (0→intro, 1→sysAnalysis, 2→server, 3→client, 4+→userGuide) are **fixed** — do not add configuration.
- `buildUserGuideWithScreenshots()` already handles `screenshotFiles` null/empty gracefully — do not change its internal logic.
- `buildIntroWithScreenshot()` already handles undefined screenshot — no change needed.
- `appendOptionalScreenshot()` must silently skip if the screenshot is undefined (guard at top of function).
- All `ImageRun` nodes must be wrapped in try/catch — images can fail to embed.

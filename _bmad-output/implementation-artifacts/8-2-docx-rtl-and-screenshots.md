# Story 8-2: docx Full RTL Enforcement + Screenshot Images in User Guide

**Epic:** 8 — Document Export  
**Story ID:** 8-2  
**Status:** done  
**Date:** 2026-03-30  
**Project:** AutoProjectBook (Sefer-Proyekt-Wizard)

---

## Story

As a student downloading my project book,
I want all document sections to be properly Right-to-Left formatted, and my uploaded screenshots to appear as actual images inside the User Guide chapter with their captions,
so that my teacher receives a professional Hebrew/Arabic document that exactly matches the expected academic format.

---

## Acceptance Criteria

### RTL Enforcement
1. The `Document` constructor in `docBuilder/index.ts` includes `settings: { defaultTabStop: 709, displayDocTitle: true }` and every `Section` in `sections[]` has `properties.bidi: true`.
2. All `Paragraph` nodes in the document — including cover page paragraphs, heading paragraphs, code-block paragraphs in the diagram section, and placeholder paragraphs — use `RTL_PARA` merged into their options.
3. `styles.ts` `RTL_PARA` already has `bidirectional: true` and `alignment: AlignmentType.RIGHT` — verify these are correct and not overridden anywhere.
4. After fix: open the generated `.docx` in Word — all text runs RTL, font is David MT, headings are right-aligned.

### Screenshot Embedding
5. `BuildDocumentInput` is extended with `screenshotFiles: Array<{ arrayBuffer: ArrayBuffer; screenName: string; caption: string; userType: string }>`.
6. `buildAndDownloadDocument()` reads each screenshot's `ArrayBuffer` (passed in from `ExportPage.tsx` which reads from the store's `Screenshot.file`) and embeds them as `ImageRun` nodes in the User Guide chapter.
7. `buildUserGuideWithScreenshots()` helper function produces: for each screenshot: a H2 heading (`screenName`), an `ImageRun` (width: 480, height: 320 proportional), an italic caption paragraph, a user-type note paragraph.
8. When `screenshotFiles` is empty (user skipped or page was refreshed), the User Guide section falls back to text-only (current behaviour) — no regression.
9. Screenshot images are sized to fit an A4 page width with margins: max `width: 480` points.
10. `npm run typecheck` clean; `npm run build` succeeds.

---

## Tasks / Subtasks

- [ ] Task 1 — Add Document-level RTL settings
  - [ ] 1.1 In `buildAndDownloadDocument()`, update `new Document({...})` to add:
    ```typescript
    settings: {
      defaultTabStop: 709,
      displayDocTitle: true,
    },
    ```
  - [ ] 1.2 Add `properties: { bidi: true }` to all entries in `sections[]` (currently only one section)

- [ ] Task 2 — Audit and fix all paragraph nodes for RTL
  - [ ] 2.1 Cover page `Paragraph` nodes: all already use `...RTL_PARA` — verify ✓
  - [ ] 2.2 `chapterHeading()`: verify it spreads `RTL_PARA` ✓
  - [ ] 2.3 `rtlParagraph()`: verify it spreads `RTL_PARA` ✓
  - [ ] 2.4 Fix `pageBreak()` — add `...RTL_PARA`:
    ```typescript
    function pageBreak(): Paragraph {
      return new Paragraph({ ...RTL_PARA, children: [new PageBreak()] });
    }
    ```
  - [ ] 2.5 Fix diagram section code-block `Paragraph` nodes — replace bare `new Paragraph({...})` with `new Paragraph({ ...RTL_PARA, children: [...] })`

- [ ] Task 3 — Extend `BuildDocumentInput` with screenshot files
  - [ ] 3.1 Add `screenshotFiles?: Array<{ arrayBuffer: ArrayBuffer; screenName: string; caption: string; userType: 'admin' | 'regular' | 'both' }>` to `BuildDocumentInput` in `docBuilder/index.ts`

- [ ] Task 4 — Implement `buildUserGuideWithScreenshots()`
  - [ ] 4.1 Add `import { ImageRun } from 'docx'` to `docBuilder/index.ts`
  - [ ] 4.2 New function:
    ```typescript
    function buildUserGuideWithScreenshots(
      aiContent: string,
      status: string,
      screenshotFiles: BuildDocumentInput['screenshotFiles'],
    ): Paragraph[]
    ```
  - [ ] 4.3 First: `[...splitIntoParagraphs(aiContent)]` (the AI text)
  - [ ] 4.4 Then for each screenshot file:
    - H2 heading: `screenName`
    - `new Paragraph({ ...RTL_PARA, children: [new ImageRun({ type: 'png', data: arrayBuffer, transformation: { width: 480, height: 320 } })] })`
    - Caption paragraph (italic): `caption`
    - User-type note (small, italic): `(${userTypeHebrew})`
  - [ ] 4.5 When `screenshotFiles` is empty or undefined, fall back to `buildChapterSection('userGuide', aiContent, status)`

- [ ] Task 5 — Update `chapterSections` build loop
  - [ ] 5.1 In `buildAndDownloadDocument()`, handle `'userGuide'` chapter specially:
    - When `input.screenshotFiles && input.screenshotFiles.length > 0` AND `key === 'userGuide'` → call `buildUserGuideWithScreenshots()`
    - Otherwise → existing `buildChapterSection()`

- [ ] Task 6 — Update `ExportPage.tsx`
  - [ ] 6.1 Before calling `buildAndDownloadDocument()`, read each `screenshot.file?.arrayBuffer()` asynchronously
  - [ ] 6.2 Build the `screenshotFiles` array from resolved `ArrayBuffer`s (skip any with `file === null`)
  - [ ] 6.3 Pass `screenshotFiles` to `buildAndDownloadDocument(input)`

- [ ] Task 7 — User-type to Hebrew mapping
  - [ ] 7.1 `const USER_TYPE_HE = { admin: 'מנהל', regular: 'משתמש', both: 'מנהל ומשתמש' }`

- [ ] Task 8 — Tests & Validation
  - [ ] 8.1 `npm run typecheck` — no errors
  - [ ] 8.2 `npm run test` — all tests pass (no unit tests needed for `buildUserGuideWithScreenshots` as it uses DOM ImageRun; manual test only)
  - [ ] 8.3 Manual smoke: generate document with screenshots → verify images appear in Word; generate without screenshots → verify graceful fallback

---

## Dev Notes

### Section `bidi: true` in docx v9
```typescript
sections: [{
  properties: {
    bidi: true,           // entire section is RTL
    page: { ... },
  },
  children: [...],
}]
```
The `bidi: true` on the Section is the most reliable way to force Word to treat the entire section layout as RTL, ensuring the ruler direction, page numbering position, etc. are all correct.

### ImageRun for PNG
```typescript
import { ImageRun } from 'docx';
new ImageRun({
  type: 'png',
  data: arrayBuffer,        // ArrayBuffer from File.arrayBuffer()
  transformation: { width: 480, height: 320 },  // in points
})
```

### Reading Files in ExportPage
```typescript
const screenshotFiles = await Promise.all(
  screenshots
    .filter(s => s.file !== null)
    .map(async s => ({
      arrayBuffer: await s.file!.arrayBuffer(),
      screenName: s.screenName,
      caption: s.caption,
      userType: s.userType,
    }))
);
```
Note: If the user refreshed the browser, `s.file` will be `null` (File objects can't be persisted). The filter handles this gracefully.

### Key Files
- `src/services/docBuilder/index.ts` — all major changes
- `src/services/docBuilder/styles.ts` — may need `sectionProperties` export
- `src/features/export/ExportPage.tsx` — read file ArrayBuffers before calling builder

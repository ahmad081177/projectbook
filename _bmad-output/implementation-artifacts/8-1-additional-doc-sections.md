# Story 8-1: Additional Document Sections — Tech Stack, Difficulties, What-Next

**Epic:** 8 — Document Export  
**Story ID:** 8-1  
**Status:** done  
**Date:** 2026-03-30  
**Project:** AutoProjectBook (Sefer-Proyekt-Wizard)

---

## Story

As a student generating my project book,
I want the document to include a tech-stack overview section (in the introduction or system analysis), a "Difficulties and Challenges" section, and a "What's Next / Future Development" section,
so that my project book is more complete and meets the MoE expectation of personal reflection and forward thinking.

---

## Acceptance Criteria

1. Three new `ChapterKey` values are added: `'techStack'`, `'difficulties'`, `'whatNext'`.
2. `CHAPTER_TITLES` in `docBuilder/index.ts` maps: `techStack` → `'סקירת טכנולוגיות'`, `difficulties` → `'קשיים ופתרונות'`, `whatNext` → `'פיתוחים עתידיים'`.
3. `CHAPTER_ORDER` in `docBuilder/index.ts` positions the three sections:
   - `techStack` appears after `introduction` (index 1)
   - `difficulties` appears after `reflection` (index 7)
   - `whatNext` is the last section before `appendices`
4. Gemini prompts for the three new chapters exist in `CHAPTER_PROMPTS`:
   - `techStack`: lists detected tech stack, frameworks, languages, and asks Gemini to describe why they were chosen (~300 words)
   - `difficulties`: asks Gemini to describe 3-5 common difficulties students face with the specific project type and how they are typically solved (~350 words)
   - `whatNext`: asks Gemini to suggest 3-5 realistic future enhancements for the specific project type (~300 words)
5. `CHAPTER_WORD_COUNTS` is updated for the 3 new keys.
6. `GenerationPage.tsx` includes the 3 new chapters in `CHAPTER_ORDER` and `CHAPTER_LABELS` so they appear in the generation progress list.
7. `ReviewPage.tsx` sidebar chapter list correctly renders the 3 new chapters with their Hebrew titles and status badges.
8. `ExportPage.tsx` compliance checklist includes the 3 new chapters.
9. Store types: `ChapterKey` union type in `src/store/types.ts` is updated to include the 3 new keys.
10. `npm run typecheck` clean; all 37+ unit tests pass.

---

## Tasks / Subtasks

- [ ] Task 1 — Extend `ChapterKey` type
  - [ ] 1.1 In `src/store/types.ts`, add `'techStack' | 'difficulties' | 'whatNext'` to `ChapterKey` union

- [ ] Task 2 — Add Gemini prompts in `gemini.ts`
  - [ ] 2.1 Add to `CHAPTER_WORD_COUNTS`: `techStack: 300, difficulties: 350, whatNext: 300`
  - [ ] 2.2 Add to `CHAPTER_PROMPTS`:
    ```
    techStack: (ctx) =>
      `${buildProjectSummary(ctx)}
      תאר את ערימת הטכנולוגיות בפרויקט: שפות תכנות, פריימוורקים, ספריות וכלים.
      הסבר מדוע נבחרו טכנולוגיות אלו. אורך: כ-${CHAPTER_WORD_COUNTS.techStack} מילים.`,

    difficulties: (ctx) =>
      `${buildProjectSummary(ctx)}
      תאר 3-5 קשיים טכניים שתלמיד נתקל בהם בפיתוח פרויקט מסוג ${ctx.projectType}.
      עבור כל קושי: תיאור הבעיה, כיצד נפתרה, ומה נלמד. אורך: כ-${CHAPTER_WORD_COUNTS.difficulties} מילים.`,

    whatNext: (ctx) =>
      `${buildProjectSummary(ctx)}
      הצע 3-5 שיפורים עתידיים ריאליסטיים לפרויקט מסוג ${ctx.projectType}.
      עבור כל שיפור: תיאור, ערך למשתמש, ומה נדרש לממש. אורך: כ-${CHAPTER_WORD_COUNTS.whatNext} מילים.`,
    ```
  - [ ] 2.3 Note: `buildProjectSummary()` is added in Story 5-1 — this story depends on 5-1 or must duplicate the summary inline

- [ ] Task 3 — Update `CHAPTER_ORDER` in `gemini.ts`
  - [ ] 3.1 New order: `introduction`, `techStack`, `systemAnalysis`, `database`, `serverImplementation`, `clientImplementation`, `userGuide`, `reflection`, `difficulties`, `whatNext`, `appendices`

- [ ] Task 4 — Update `docBuilder/index.ts`
  - [ ] 4.1 Add 3 new entries to `CHAPTER_TITLES`
  - [ ] 4.2 Update `CHAPTER_ORDER` to match the new order from Task 3

- [ ] Task 5 — Update `GenerationPage.tsx`
  - [ ] 5.1 Add 3 new entries to `CHAPTER_LABELS`:
    ```
    techStack: 'כותב סקירת טכנולוגיות...',
    difficulties: 'כותב קשיים ופתרונות...',
    whatNext: 'כותב פיתוחים עתידיים...',
    ```
  - [ ] 5.2 Add the 3 new chapter keys to the `CHAPTER_ORDER` local constant (or import the shared one)

- [ ] Task 6 — Verify `ReviewPage.tsx` and `ExportPage.tsx`
  - [ ] 6.1 Both pages iterate over `CHAPTER_ORDER` from the store/types — no code changes if they use the type, but verify they render the new titles correctly
  - [ ] 6.2 `ExportPage.tsx` checklist: if it hardcodes chapter keys, add the 3 new ones

- [ ] Task 7 — Tests
  - [ ] 7.1 `npm run typecheck` — no TypeScript errors
  - [ ] 7.2 All existing tests pass with the extended `ChapterKey` type

---

## Dev Notes

### Dependency on Story 5-1
`buildProjectSummary(ctx)` is implemented in Story 5-1. If implementing this story first, either:
- Duplicate a simplified summary inline in the prompts, OR
- Implement the two stories together

Recommended: implement Story 5-1 first, then this story.

### Chapter Order Shared Constant
Both `gemini.ts` and `docBuilder/index.ts` define `CHAPTER_ORDER` locally. Consider extracting to `src/utils/constants.ts` to keep them in sync — but this is optional and should only be done if the dev identifies it as a quick win during the story.

### Key Files
- `src/store/types.ts` — extend `ChapterKey`
- `src/services/gemini.ts` — prompts + `CHAPTER_WORD_COUNTS` + `CHAPTER_ORDER`
- `src/services/docBuilder/index.ts` — `CHAPTER_TITLES` + `CHAPTER_ORDER`
- `src/features/generation/GenerationPage.tsx` — `CHAPTER_LABELS` + `CHAPTER_ORDER`
- `src/features/review/ReviewPage.tsx` — verify, likely no changes
- `src/features/export/ExportPage.tsx` — verify checklist

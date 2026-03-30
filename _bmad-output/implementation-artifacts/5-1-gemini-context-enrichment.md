# Story 5-1: Gemini Context Enrichment & Generation Quality Fixes

**Epic:** 5 — AI Content Generation  
**Story ID:** 5-1  
**Status:** done  
**Date:** 2026-03-30  
**Project:** AutoProjectBook (Sefer-Proyekt-Wizard)

---

## Story

As a student generating my project book,
I want Gemini to receive full project context (type, tech stack, student name, all tables, screenshot count) in every chapter prompt,
so that the generated text specifically describes *my* project rather than a generic one.

---

## Acceptance Criteria

1. A `buildProjectSummary(ctx)` function exists in `gemini.ts` and returns a structured Hebrew/Arabic preamble string listing: student name, project type (in Hebrew), tech-stack auto-detected label, top 5 active class names, table count + table names, screenshot count.
2. Every chapter prompt in `CHAPTER_PROMPTS` has `buildProjectSummary(ctx)` prepended to its existing content.
3. `GenerationContext` is extended with `screenshots: Array<{ screenName: string; caption: string; userType: string }>` so screenshot metadata is available to `userGuide` and `introduction` chapters.
4. The `userGuide` chapter prompt includes screenshot names and captions when screenshots are present.
5. `callGemini()` generation config uses `temperature: 0.4` (was `0.7`) and `topP: 0.85` for more consistent academic register.
6. Tech-stack auto-detection (`detectTechStack()`) reads class names from the CSharp classes and returns a human-readable label: "ASP.NET Web API", "Blazor WebAssembly", "WinForms", "WPF", "Android (Xamarin)", "Console Application", or "אחר" for unrecognised.
7. `GenerationPage.tsx` passes the `screenshots` array from the store into the `GenerationContext` it builds.
8. All existing 37 unit tests still pass; typecheck is clean.

---

## Tasks / Subtasks

- [ ] Task 1 — Extend `GenerationContext` type
  - [ ] 1.1 Add `screenshots: Array<{ screenName: string; caption: string; userType: string }>` to `GenerationContext` interface in `gemini.ts`

- [ ] Task 2 — Implement `detectTechStack()`
  - [ ] 2.1 In `gemini.ts`, add `function detectTechStack(classes: CSharpClass[]): string`
  - [ ] 2.2 Pattern matching logic:
    - Class names containing `Controller` → "ASP.NET Web API"
    - Class names containing `ComponentBase` or file paths with `.razor` → "Blazor"
    - Class names containing `Form` and not `WpfForm` → "WinForms"
    - Class names containing `Window` or `ViewModel` → "WPF"
    - Class names containing `Activity` or `Fragment` → "Android"
    - else → "אחר"
  - [ ] 2.3 Map result to Hebrew display label

- [ ] Task 3 — Implement `buildProjectSummary()`
  - [ ] 3.1 In `gemini.ts`, add `function buildProjectSummary(ctx: GenerationContext): string`
  - [ ] 3.2 Output format (Hebrew):
    ```
    ── פרטי הפרויקט ──
    שם הסטודנט: {studentName}
    סוג פרויקט: {projectType in Hebrew} ({techStack auto-detected})
    מחלקות עיקריות: {top 5 active class names, comma-separated}
    מסד נתונים: {tableCount} טבלאות ({table names, comma-separated})
    צילומי מסך: {screenshotCount} צילומים
    ──────────────────
    ```
  - [ ] 3.3 Handles `language === 'ar'` with Arabic labels

- [ ] Task 4 — Update all `CHAPTER_PROMPTS`
  - [ ] 4.1 Prepend `buildProjectSummary(ctx)` to every `CHAPTER_PROMPTS[key](ctx)` return value
  - [ ] 4.2 Update `userGuide` prompt to include screenshot list:
    ```
    צילומי מסך זמינים:
    {screenshots.map(s => `- ${s.screenName}: ${s.caption} (${s.userType})`).join('\n')}
    ```

- [ ] Task 5 — Update generation config
  - [ ] 5.1 In `callGemini()`, change `temperature: 0.7` → `temperature: 0.4`
  - [ ] 5.2 Add `topP: 0.85` to `generationConfig`
  - [ ] 5.3 ~~`maxOutputTokens: 2048`~~ → already bumped to `8192` (B-01 fix)

- [ ] Task 6 — Update `GenerationPage.tsx`
  - [ ] 6.1 Read `screenshots` from store and map to `{ screenName, caption, userType }[]`
  - [ ] 6.2 Include in `GenerationContext` built before the generation loop runs

- [x] Task 7 — Tests & validation
  - [x] 7.1 Add unit tests for `detectTechStack()` covering all tech-stack variants
  - [x] 7.2 Add unit tests for `buildProjectSummary()` — verify all fields present, Hebrew labels correct
  - [x] 7.3 `npm run typecheck` clean; all tests pass

---

## Dev Notes

### Project Type to Hebrew Mapping
```typescript
const PROJECT_TYPE_HE: Record<ProjectType, string> = {
  blazor: 'Blazor',
  wpf: 'WPF',
  winforms: 'WinForms',
  android: 'Android',
  other: 'אחר',
};
```

### Screenshot Context in userGuide
When `screenshots.length === 0`, add fallback line: `"אין צילומי מסך — הוסף ידנית למדריך"`

### Key Files
- `src/services/gemini.ts` — all changes here
- `src/features/generation/GenerationPage.tsx` — pass screenshots to context
- `src/services/parsers/csharpParser.test.ts` — no changes needed; new tests can go in same file or `gemini.test.ts`

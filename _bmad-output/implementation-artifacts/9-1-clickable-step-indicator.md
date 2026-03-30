# Story 9.1: Clickable Step Indicator — Jump to Any Completed Step

**Epic:** 9 — Navigation & UX Polish
**Story ID:** 9-1
**Status:** review
**Date:** 2026-03-30
**Project:** AutoProjectBook (Sefer-Proyekt-Wizard)

---

## Story

As a student working on my project book,
I want to click any completed (✓) step circle in the top wizard header to jump directly back to that step,
so that I can quickly revisit an earlier step (e.g., re-upload code, change DB, or recheck screenshots) without pressing the Back button multiple times.

---

## Acceptance Criteria

1. **Completed steps are clickable:** Any step circle whose `state === 'complete'` is rendered as a clickable `<button>` element. Steps whose `state === 'active'` or `state === 'locked'` remain non-interactive `<div>` elements (same as today).

2. **Click navigates to the correct route:** Each completed step maps to a canonical "entry route" per the table in Dev Notes below. Clicking the circle uses `react-router`'s `useNavigate()` to navigate to that route.

3. **Navigation blocked while generating:** If `isGenerating` is `true` in the store, clicking any completed step circle does nothing (no navigation). The cursor shows `cursor-not-allowed` on all step circles while generation is in progress.

4. **Clickable circles have clear visual affordance:** Completed step circles show `cursor-pointer` and a hover effect (`hover:ring-2 hover:ring-green-400 hover:ring-offset-1`) when clickable. Non-clickable circles retain unchanged styling.

5. **Active step is never clickable:** The ring-highlighted blue active step is not a button and does not emit a click event.

6. **Locked/future steps are never clickable:** Unchanged from current behaviour.

7. **Accessibility:** Clickable step buttons have `aria-label` = `"${step.label} — לחץ לחזרה"` (Hebrew) or corresponding translation key. `role="button"` is implicit from `<button>` element.

8. **Regression guard:** `npm run typecheck` passes, `npm test -- --run` stays at 68/68, existing StepIndicator tests still pass (they can be updated if the rendered element changes from `div` to `button`).

---

## Tasks / Subtasks

- [x] Task 1 — Add i18n key for back-navigation aria-label (AC: 7)
  - [x] 1.1: Add `"step.goBack": "לחץ לחזרה"` to `src/i18n/he.json`
  - [x] 1.2: Add `"step.goBack": "انقر للرجوع"` to `src/i18n/ar.json`

- [x] Task 2 — Add step-to-route mapping in `StepIndicator` (AC: 2)
  - [x] 2.1: Add a `STEP_ROUTES` constant array (index-aligned with steps) mapping each step index to its entry path string

- [x] Task 3 — Make completed steps clickable (AC: 1, 2, 3, 4, 5, 6, 7)
  - [x] 3.1: Add `const navigate = useNavigate()` and `const isGenerating = useAppStore((s) => s.isGenerating)` inside `StepIndicator`
  - [x] 3.2: For each step, wrap the circle `<div>` in a `<button>` when `state === 'complete' && !isGenerating`; keep as `<div>` otherwise
  - [x] 3.3: Add hover ring + `cursor-pointer` class to completed clickable circles; add `cursor-not-allowed opacity-60` to ALL circles when `isGenerating`
  - [x] 3.4: Button `onClick` calls `navigate(STEP_ROUTES[index])`

- [x] Task 4 — Update existing StepIndicator tests if needed (AC: 8)
  - [x] 4.1: Run tests; fix any assertion that hard-codes `div` role for completed steps

- [x] Task 5 — Verify regression (AC: 8)
  - [x] 5.1: `npm run typecheck` — clean
  - [x] 5.2: `npm test -- --run` — 68/68 ✅

---

## Dev Notes

### Step-to-Route Mapping

| Step index | Step name | Entry route |
|---|---|---|
| 0 | Language | `/` |
| 1 | Setup (API Key) | `/onboarding/api-key` |
| 2 | Code Upload | `/extract/code` |
| 3 | Database Upload | `/extract/database` |
| 4 | Screenshots | `/extract/screenshots` |
| 5 | Generation | `/generate` |
| 6 | Review | `/review/introduction` |
| 7 | Export | `/export` |

```typescript
const STEP_ROUTES = [
  '/',
  '/onboarding/api-key',
  '/extract/code',
  '/extract/database',
  '/extract/screenshots',
  '/generate',
  '/review/introduction',
  '/export',
] as const;
```

### Current `StepIndicator` Circle Rendering Pattern

Each step circle is currently a standalone `<div>` inside a `flex` wrapper:

```tsx
<div
  aria-current={step.state === 'active' ? 'step' : undefined}
  className={[ /* bg-green-600 / bg-blue-600 / bg-gray-200 ... */ ].join(' ')}
>
  {step.state === 'complete' ? '✓' : step.number}
</div>
```

Replace ONLY the circle element — not the outer `<div>` or the label `<span>`. The connector lines between steps remain unchanged.

**Target pattern:**

```tsx
{step.state === 'complete' ? (
  <button
    type="button"
    onClick={() => !isGenerating && navigate(STEP_ROUTES[index])}
    aria-label={`${step.label} — ${t('step.goBack')}`}
    className={[
      'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold',
      'bg-green-600 text-white',
      isGenerating
        ? 'cursor-not-allowed opacity-60'
        : 'cursor-pointer hover:ring-2 hover:ring-green-400 hover:ring-offset-1',
    ].join(' ')}
  >
    ✓
  </button>
) : (
  <div
    aria-current={step.state === 'active' ? 'step' : undefined}
    className={[
      'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold',
      step.state === 'active'
        ? 'bg-blue-600 text-white ring-2 ring-blue-300 ring-offset-1'
        : 'bg-gray-200 text-gray-400',
      isGenerating ? 'cursor-not-allowed opacity-60' : '',
    ].join(' ')}
  >
    {step.number}
  </div>
)}
```

### StepGuard Compatibility

`StepGuard` only blocks navigation when `completedStep < requiredStep`. Navigating to a completed step always satisfies `completedStep >= requiredStep`, so the guard will never redirect — no changes to `StepGuard` needed.

### Key Files to Touch

| File | Change |
|------|--------|
| `src/components/layout/StepIndicator.tsx` | Add `STEP_ROUTES`, `useNavigate`, `isGenerating`, replace circle div with conditional button |
| `src/components/layout/StepIndicator.test.tsx` | Update any assertion that assumes the completed-step circle is a `<div>` |
| `src/i18n/he.json` | Add `"step.goBack"` key |
| `src/i18n/ar.json` | Add `"step.goBack"` key |

**DO NOT touch:**
- `src/routes/guards/StepGuard.tsx` — no changes required
- `src/components/layout/WizardHeader.tsx` — no changes required
- Any other page component

### References

- [Source: src/components/layout/StepIndicator.tsx] — current rendering pattern
- [Source: src/utils/constants.ts#L23] — `WIZARD_STEPS` mapping (use as reference, do not import it into StepIndicator — use the local `STEP_ROUTES` array instead)
- [Source: src/routes/guards/StepGuard.tsx] — guard logic, no changes needed
- [Source: src/routes/index.tsx] — all route paths
- [Source: src/store/types.ts] — `isGenerating: boolean` in store

---

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

### Completion Notes List

### File List

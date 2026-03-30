# Story 4-1: Screenshot Carousel Annotation Editor

**Epic:** 4 — Screenshot Gallery  
**Story ID:** 4-1  
**Status:** done  
**Date:** 2026-03-30  
**Project:** AutoProjectBook (Sefer-Proyekt-Wizard)

---

## Story

As a student annotating my uploaded screenshots,
I want a large-image carousel modal where I can see each screenshot clearly and fill in its title, description, and role one at a time,
so that I can provide accurate metadata that improves the AI-generated User Guide chapter.

---

## Acceptance Criteria

1. A `ScreenshotCarousel` modal component opens after images are uploaded, auto-starting at the first unannotated image.
2. The modal shows the current image at large size (~70% width of modal, max ~600px height), the image index ("Screen 3 of 12"), a text input for `screenName`, a text input for `caption`, and a 3-option toggle for `userType` (Admin / User / Both).
3. "Save & Next" saves the current image's metadata and advances to the next; on the last image it closes the modal and shows a toast.
4. "Skip" advances without saving metadata changes.
5. `←` / `→` arrow keys also navigate between images; `Esc` closes modal.
6. The thumbnail grid on the main page shows annotated images with a green border and unannotated with a gray border.
7. Clicking any thumbnail in the grid re-opens the carousel starting at that image.
8. An "Annotate / Review" button on the page opens the carousel at the first unannotated image when all images are uploaded.
9. The modal is fully RTL-compatible (labels, inputs, button order follows `dir` from `RTLProvider`).
10. `ScreenshotCarousel.test.tsx` covers: opens on upload, navigation works, save updates metadata, skip does not update, keyboard navigation, close on last save.

---

## Tasks / Subtasks

- [ ] Task 1 — Create `ScreenshotCarousel` modal component
  - [ ] 1.1 `src/components/ui/ScreenshotCarousel.tsx` — props: `screenshots`, `startIndex`, `onUpdate`, `onClose`
  - [ ] 1.2 Large image display with `object-contain`, full viewport-width-safe sizing
  - [ ] 1.3 Progress indicator "X of N"
  - [ ] 1.4 `screenName` input (pre-filled from filename)
  - [ ] 1.5 `caption` input (empty initially)
  - [ ] 1.6 `userType` toggle — 3 buttons: Admin / User / Both
  - [ ] 1.7 "Save & Next" and "Skip" buttons
  - [ ] 1.8 Left/Right nav arrows; keyboard `keydown` listener for `ArrowLeft`, `ArrowRight`, `Enter`, `Escape`
  - [ ] 1.9 Overlay/backdrop, `z-50`, scroll-lock while open

- [ ] Task 2 — Update `ScreenshotsPage.tsx`
  - [ ] 2.1 On new files added via `handleFiles()` → set `carouselOpen: true, carouselStart: 0`
  - [ ] 2.2 Clicking any thumbnail → open carousel at that image's index
  - [ ] 2.3 "Annotate / Review" button visible when `screenshots.length > 0`; opens at first unannotated
  - [ ] 2.4 Green border (`ring-2 ring-green-400`) on annotated thumbnails; gray on unannotated
  - [ ] 2.5 Remove old inline `input` / `select` fields from thumbnail cards (replaced by carousel)

- [ ] Task 3 — Tests
  - [ ] 3.1 `ScreenshotCarousel.test.tsx` — mock screenshots array, test all ACs

---

## Dev Notes

### Component Interface
```typescript
// src/components/ui/ScreenshotCarousel.tsx
interface ScreenshotCarouselProps {
  screenshots: Screenshot[];
  startIndex: number;
  onUpdate: (id: string, patch: Partial<Screenshot>) => void;
  onClose: () => void;
}
```

### Annotated Detection Logic
A screenshot is "annotated" when `caption.trim() !== ''` OR `screenName` was manually changed from the auto-generated filename.

### RTL Note
Button order in RTL: `[← Prev]` appears on the RIGHT side visually; `[Next →]` on LEFT. Use `flex-row-reverse` or logical `ms-auto` / `me-auto`.

### Do Not
- Do not use any new npm packages; the modal is pure Tailwind + React state
- Do not remove the thumbnail grid — it remains as a visual overview
- Inline row metadata inputs can be removed in Task 2.5 since the carousel replaces them; only thumbnail + remove button stays in the grid

### Key Files
- `src/features/extraction/ScreenshotsPage.tsx` — main page (modify)
- `src/components/ui/ScreenshotCarousel.tsx` — new component
- `src/components/ui/ScreenshotCarousel.test.tsx` — new test
- `src/store/types.ts` — `Screenshot` type (no changes needed)
- `src/i18n/he.json` + `ar.json` — add keys: `carousel.prev`, `carousel.next`, `carousel.skip`, `carousel.saveAndNext`, `carousel.annotate`, `carousel.of`

# Story 6-1: Render UML/ERD Diagrams as PNG Images in Document

**Epic:** 6 — Diagram Generation  
**Story ID:** 6-1  
**Status:** done  
**Date:** 2026-03-30  
**Project:** AutoProjectBook (Sefer-Proyekt-Wizard)

---

## Story

As a student downloading my project book,
I want the UML class diagram and ERD to appear as actual rendered images in the Word document (not raw Mermaid code),
so that my teacher can see proper professional diagrams without needing to run any tooling.

---

## Acceptance Criteria

1. `src/utils/mermaid.ts` exports `mermaidToImageBuffer(code: string): Promise<ArrayBuffer>` which: initialises Mermaid, renders the code to SVG, draws onto a `<canvas>`, and returns the result as a PNG `ArrayBuffer`.
2. `buildDiagramsSection()` in `docBuilder/index.ts` calls `mermaidToImageBuffer()` for both UML and ERD codes and embeds them as `ImageRun` (from `docx`) instead of plain text code blocks.
3. If rendering fails (Mermaid parse error), the fallback is a placeholder paragraph: `'[דיאגרמה לא ניתנת לרינדור — הוסף ידנית]'` — same graceful degradation as the current code path, no unhandled rejection.
4. The `DiagramsPage.tsx` in-app review panel is **not changed** — it still shows the raw Mermaid code for browser preview.
5. `buildAndDownloadDocument()` signature and return type are unchanged; only the diagram rendering inside it changes.
6. Diagram images in the docx are sized at `width: 580, height: 380` (points) — fits on an A4 page with RTL margins.
7. `npm run typecheck` clean; `npm run build` succeeds with no new errors.
8. Manual test: generate a document with at least one diagram code and confirm the `.docx` contains an embedded image (open in Word and verify).

---

## Tasks / Subtasks

- [ ] Task 1 — Implement `mermaidToImageBuffer()` in `src/utils/mermaid.ts`
  - [ ] 1.1 Install nothing new — use `mermaid` (already in `node_modules` as Mermaid is used in `DiagramsPage`)
        > Check: if `mermaid` is not in deps, add `"mermaid": "^11"` to `package.json` dependencies
  - [ ] 1.2 `mermaid.initialize({ startOnLoad: false, theme: 'default' })`
  - [ ] 1.3 `const { svg } = await mermaid.render('mermaid-export-' + Date.now(), code)`
  - [ ] 1.4 Create `<img>` element, set `src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)))`
  - [ ] 1.5 Await `img.decode()`; draw to `<canvas>` at `width=1160, height=760` (2× for retina → scaled to 580×380 in docx)
  - [ ] 1.6 `canvas.toBlob('image/png')` → convert to `ArrayBuffer` via `FileReader` or `Response`
  - [ ] 1.7 Return `ArrayBuffer`; if any step throws, re-throw with a clear message
  - [ ] 1.8 Clean up temp DOM elements after use

- [ ] Task 2 — Update `buildDiagramsSection()` in `docBuilder/index.ts`
  - [ ] 2.1 Change function signature to `async function buildDiagramsSection(...): Promise<Paragraph[]>`
  - [ ] 2.2 For UML: wrap `mermaidToImageBuffer(umlCode)` call in try/catch; on success use `new ImageRun({ data: buffer, transformation: { width: 580, height: 380 } })` inside a `new Paragraph({ children: [imageRun] })`; on failure use existing placeholder paragraph
  - [ ] 2.3 Same for ERD
  - [ ] 2.4 Update `buildAndDownloadDocument()` to `await buildDiagramsSection(...)` (it becomes async)

- [ ] Task 3 — Verify imports
  - [ ] 3.1 Add `ImageRun` to the existing `import { ..., ImageRun } from 'docx'` in `docBuilder/index.ts`
  - [ ] 3.2 Add `import { mermaidToImageBuffer } from '../../utils/mermaid'` to `docBuilder/index.ts`

- [ ] Task 4 — Validation
  - [ ] 4.1 `npm run typecheck` — no errors
  - [ ] 4.2 `npm run build` — no errors
  - [ ] 4.3 Manual smoke: run app, generate, export — open `.docx` and confirm diagrams appear as images

---

## Dev Notes

### Why SVG → Canvas → PNG vs direct SVG embed
Word Online / older Word for Windows does not render SVG images embedded in `.docx`. PNG is universally supported. The canvas intermediary also lets us control the output resolution.

### Mermaid Dependency Check
Run: `Get-Content package.json | Select-String 'mermaid'`  
If not present add to `dependencies` in `package.json`: `"mermaid": "^11.0.0"`  
(Mermaid was previously assumed imported in DiagramsPage — verify it's actually installed before Task 1.2)

### ImageRun API (docx v9)
```typescript
new ImageRun({
  type: 'png',
  data: arrayBuffer,          // ArrayBuffer
  transformation: {
    width: 580,               // EMU or points — docx handles conversion
    height: 380,
  },
})
```

### Canvas + DOM in Vitest/jsdom
`mermaidToImageBuffer()` uses DOM canvas APIs that are not available in jsdom — do NOT write unit tests for it; use build-time smoke test only. The function should be excluded from coverage.

### Key Files
- `src/utils/mermaid.ts` — implement here (was a stub)
- `src/services/docBuilder/index.ts` — update `buildDiagramsSection` + `buildAndDownloadDocument`
- `package.json` — add `mermaid` if missing

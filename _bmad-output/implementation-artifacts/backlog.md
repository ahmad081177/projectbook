# AutoProjectBook — Master Backlog

**Updated:** 2026-03-30  
**Project:** AutoProjectBook (Sefer-Proyekt-Wizard)  
**All previously-implemented stories:** 1.1 – 5.x ✅ (see individual story files and smoke-test-report.md)

---

## Priority 1 — Critical Bug Fixes / Quick Wins

| # | Item | File(s) | Status |
|---|------|---------|--------|
| B-01 | ~~Increase `maxOutputTokens: 2048` → `8192` to prevent truncated chapter output~~ | `src/services/gemini.ts` | ✅ Fixed |
| B-02 | ~~CSP plugin fires in dev mode, blanks page~~ | `vite.config.ts` | ✅ Fixed |
| B-03 | Missing `public/favicon.ico` (cosmetic 404) | `public/` | cosmetic — low priority |

---

## Priority 2 — Functional Gaps (New Stories Required)

| Story | Title | Epic | Status | Story File |
|-------|-------|------|--------|------------|
| **4-1** | Screenshot Carousel Editor — large-image lightbox for caption/role fill | E4 Screenshot Gallery | 📋 backlog | `4-1-screenshot-carousel-editor.md` |
| **5-1** | Gemini Context Enrichment — inject project summary into every chapter prompt | E5 AI Generation | 📋 backlog | `5-1-gemini-context-enrichment.md` |
| **6-1** | Render Diagrams as PNG Images in Document (not raw Mermaid code) | E6 Diagram Generation | 📋 backlog | `6-1-render-diagrams-as-images.md` |
| **8-1** | Additional Document Sections — Tech-Stack Overview, Difficulties, What-Next | E8 Document Export | 📋 backlog | `8-1-additional-doc-sections.md` |
| **8-2** | docx RTL Enforcement + Screenshot Images Embedded in User Guide chapter | E8 Document Export | 📋 backlog | `8-2-docx-rtl-and-screenshots.md` |

---

## Priority 3 — BMad Process Items

| # | Item | Skill | Status |
|---|------|-------|--------|
| P-01 | Generate E2E automated tests | `[QA]` bmad-qa-generate-e2e-tests | ⏳ after stories |
| P-02 | Code review: `gemini.ts`, `docBuilder/`, `csharpParser.ts` | `[CR]` bmad-code-review | ⏳ pending |
| P-03 | Recreate `epics.md` (was deleted in earlier incident) | `[CE]` or manual | ⏳ pending |
| P-04 | Backfill formal story files for stories 1.2–5.x | `[CS]` or copy | ⏳ optional |
| P-05 | Epic retrospective when P-01+P-02 done | `[ER]` bmad-retrospective | ⏳ blocked |

---

## Priority 4 — Tech Debt / Polish

| # | Item | Notes |
|---|------|-------|
| T-01 | `/preview` route uses `<Placeholder>` — implement or remove | Low priority for v1.0 |
| T-02 | Bundle size 677KB — add `React.lazy()` + `Suspense` for heavy routes | `GenerationPage`, `docBuilder` |
| T-03 | `src/features/*/index.ts` all `export {}` — should re-export page components | Cosmetic |
| T-04 | `src/services/generators/*.ts` all `export {}` stubs | Generation logic already in `gemini.ts`; clean up or delete |
| T-05 | SQL Server T-SQL parser (`sqlParser.ts`) is `export {}` | Intentional for v1.0 per UX spec |

---

## Party Mode Discussion Outcomes
> Decisions reached in party mode session 2026-03-30 — see conversation context for full transcript

| Topic | Decision | Story |
|-------|----------|-------|
| Screenshots in docx | Embed screenshot `File` objects as `ImageRun` in User Guide chapter | 8-2 |
| UML/ERD as screenshots | Render Mermaid via `mermaid.render()` → SVG → canvas → PNG → `ImageRun` | 6-1 |
| RTL in all sections | Add `bidi: true` to Document settings + fix all non-RTL_PARA paragraphs | 8-2 |
| Truncated output | ~~Increase `maxOutputTokens` `2048`→`8192`~~ ✅ done immediately | B-01 |
| Gemini context | Add shared `projectSummary` block to all chapter prompts | 5-1 |

---

## UX Changes
> Decisions from Sally (UX Designer) session 2026-03-30

| Topic | Decision | Story |
|-------|----------|-------|
| Screenshots page: images too small to annotate | Carousel/lightbox modal — one image at a time, large view, step through all | 4-1 |

# AutoProjectBook (Sefer-Proyekt-Wizard) — Project Context & Constitution

> **Version:** 1.0 | **Date:** 2026-03-29 | **Author:** Agbaria (AI-assisted via BMAD)

---

## 1. Project Vision

AutoProjectBook is a **browser-only** automation tool that removes the single biggest pain point faced by Israeli high school Software Engineering students: writing the mandatory 40-60 page Project Book (Sefer Proyekt) for MoE questionnaire **883589** ("Asynchronous Programming, Web Services, and Databases").

The tool acts as an intelligent assistant: the student uploads their source code and database schema, answers a few onboarding questions, reviews AI-generated content, and clicks **Generate** to receive a fully compliant, editable `.docx` document.

---

## 2. Guiding Principles

| # | Principle | Implication |
|---|-----------|-------------|
| 1 | **Privacy-First / Local Processing** | No student data ever leaves the browser. All file parsing, AI calls, and document assembly happen client-side or through the student's own Gemini API key. |
| 2 | **MoE Compliance by Default** | Every generated document section must map 1:1 to MoE questionnaire 883589 rubric. Compliance is a hard constraint, not a nice-to-have. |
| 3 | **RTL Native** | Hebrew and Arabic are first-class languages. Tailwind CSS logical properties and `dir="rtl"` are applied globally. English is never the default. |
| 4 | **Automation Rate ≥ 80 %** | At least 80% of document text is AI-generated. Students review and refine; they do not write from scratch. |
| 5 | **Minimal Friction Onboarding** | A student with no DevOps knowledge clicks three buttons and has a document. Complexity is hidden behind progressive disclosure. |
| 6 | **Graceful Degradation** | If the Gemini API call fails or times out, the tool inserts a placeholder and continues generating the rest of the document. |

---

## 3. Target Users

### 3.1 Students (Primary)
- Grades 11–12, Software Engineering major (5 units)
- Have **completed** their capstone code project
- Struggle with formal Hebrew/Arabic technical documentation
- Not necessarily fluent in English

### 3.2 Teachers (Secondary)
- Optionally pre-configure the tool with school metadata (name, logo)
- Use it to enforce consistent documentation standards across the class
- May set default Gemini API keys for classroom use

---

## 4. MoE Document Structure — The Non-Negotiable Template

The generated Word document **must** include every chapter below in the prescribed order. All content is written in the **present tense** in the target language.

```
📄 Cover Page (שער)
📋 Table of Contents (תוכן עניינים — auto-generated)
1. Introduction (מבוא)
2. System Analysis (ניתוח המערכת)
3. Database (מסד נתונים)
4. Implementation — Server Side (מימוש — צד שרת)
5. Implementation — Client Side (מימוש — צד לקוח)
6. User Guide (מדריך למשתמש)
7. Reflection & Bibliography (רפלקציה / ביבליוגרפיה)
8. Appendices (נספחים)
```

### 4.1 Cover Page (שער)

Required fields:
1. School logo (uploaded image)
2. School name
3. Document title ("ספר פרויקט")
4. Student full name
5. Student ID number
6. Advisor/teacher name
7. Track name ("שירותי אינטרנט, תכנות אסינכרוני ומסדי נתונים")
8. Submission date

### 4.2 Introduction (מבוא)

Required content:
- Project name and short description
- Target audience
- Background/motivation — What problem does the project solve?
- System goals (primary and secondary)
- System description (general overview)
- Development environment / platforms
- Key challenges and innovations
- Prior solutions examined during research

### 4.3 System Analysis (ניתוח המערכת)

Required diagrams/artifacts:
- UseCase diagram (with at least 2 user types: admin + regular)
- DFD Level-0 (data flow diagram)
- ERD (Entity-Relationship Diagram — system level)
- Process tree (decision tree)

### 4.4 Database (מסד נתונים)

Required content:
- ERD diagram showing all tables with PK/FK relationships
- At least 3–4 main tables + junction/relationship tables
- For each table: field name, type, description, role
- Normalization justification
- Design decisions explained

### 4.5 Implementation — Server Side (צד שרת)

Required content:
- ViewModel/service class descriptions
- UML Class diagram (inheritance, composition, key relationships)
- Code snippets with logic explanations
- Security measures: SQL injection protection, parameterized queries, XML data handling
- Asynchronous code usage (`async/await`) with explanation
- Network services layer description
- Business Logic layer description with data structures used

### 4.6 Implementation — Client Side (צד לקוח)

Required content:
- Supported platforms
- Admin and regular-user UI described separately
- Form/screen listing with descriptions
- Validation logic and user-facing error messages
- Use of built-in components / inheritance
- Asynchronous code used on the client
- Optional: multi-platform support (Web + WinApp / Mobile)

### 4.7 User Guide (מדריך למשתמש)

Required content:
- At least 2 user types defined
- Step-by-step instructions per major workflow
- Screenshot for every screen/window
- Notes on screen size constraints or limitations
- UseCase diagram for multi-step flows

### 4.8 Reflection & Bibliography (רפלקציה / ביבליוגרפיה)

**Reflection** (minimum half a page, usually a full page):
- Project journey and process
- Challenges and solutions
- New skills learned independently
- Knowledge sharing and peer learning
- Retrospective: what would be done differently
- Self-directed research questions

**Bibliography** (mandatory for all research-based projects):
- All information sources used
- APA format

### 4.9 Appendices (נספחים)

- Full class code with documentation comments
- Technical notes on technologies used
- Any supplementary material useful to the reader

---

## 5. Technology Stack (Locked)

| Layer | Technology | Version / Notes |
|-------|-----------|-----------------|
| Frontend framework | **React** | 18+ |
| Build tool | **Vite** | Latest stable |
| Language | **TypeScript** | Strict mode |
| Styling | **Tailwind CSS** | v3+, RTL logical properties |
| Document generation | **docx.js** (`docx`) | Browser-side `.docx` assembly |
| AI provider | **Google Gemini API** | gemini-1.5-pro model |
| Diagram rendering | **Mermaid.js** | UML + ERD preview in UI |
| Database parsing | Native browser **File API** | Access MDB metadata via WASM; T-SQL parse via regex/parser |
| C# parsing | Custom tokenizer | Extract class names, fields, methods, inheritance |
| State management | **Zustand** | Lightweight, TypeScript-friendly |
| Routing | **React Router v6** | SPA, wizard-style flow |

---

## 6. Security & Privacy Constraints

1. **Zero upload to external servers** — No student code, DB files, or screenshots are transmitted to any server except Gemini for text analysis.
2. **Gemini API calls** — Only class-level summaries (not full source files) are sent to the API to minimize data exposure. The student must provide their own API key.
3. **No persistent storage** — Session state is in-memory only. `localStorage` may be used only for UI preferences (language, school name), never for code/documents.
4. **API key storage** — If the user opts to save their Gemini API key in `localStorage`, it must be clearly labeled as a local preference and never sent anywhere other than directly to the Gemini API endpoint.
5. **Input sanitization** — All user-provided text fields (school name, student name, etc.) are sanitized before being inserted into the docx template to prevent any injection in generated output.

---

## 7. RTL & Multilingual Requirements

- `<html dir="rtl" lang="he">` default; switches to `lang="ar"` for Arabic
- All Tailwind utility classes use **logical properties** (`ms-*`, `me-*`, `ps-*`, `pe-*`) — no `left`/`right` physical classes
- Font hierarchy: **David MT** → **Arial** fallback (both support Hebrew/Arabic)
- Word document uses Hebrew paragraph direction (`bidi`) throughout
- Section order in the docx is LTR in structure (chapters 1–8) but text direction is RTL
- Numbers (page numbers, IDs) remain LTR within RTL text using Unicode bidi markers where needed

---

## 8. Coding Conventions

- **TypeScript strict mode** — no `any`, prefer branded types for IDs
- **Component naming** — PascalCase, feature-first folders (`src/features/onboarding/`, `src/features/extraction/`, etc.)
- **API calls** — All Gemini calls isolated in `src/services/gemini.ts`; use `AbortController` for cancellation
- **Document builder** — All docx assembly logic in `src/services/docBuilder/`; one file per chapter
- **Error boundaries** — Every major feature wrapped in a React error boundary
- **No prop drilling** beyond 2 levels — use Zustand slices
- **Test coverage** — Unit tests for all parsers (DB extractor, C# tokenizer, diagram generator)
- **i18n** — All UI strings through `src/i18n/` (Hebrew default + Arabic) — no hardcoded Hebrew strings in components

---

## 9. Definition of Done (DoD) per Story

A story is complete when:
- [ ] Feature works in latest Chrome/Edge (primary browsers)
- [ ] RTL layout is correct in both Hebrew and Arabic modes
- [ ] TypeScript builds with zero errors (`tsc --noEmit`)
- [ ] Unit tests pass for all logic (parsers, builders, services)
- [ ] No `console.error` output during normal operation
- [ ] Generated `.docx` section passes MoE rubric checklist
- [ ] PR reviewed and merged

---

## 10. Out of Scope (v1.0)

- PDF export (docx only)
- Mobile app (browser only)
- Server-side processing / backend API
- Multi-student collaboration
- Cloud document storage
- Projects in languages other than C# (Java, Python — future)
- Automated grade prediction

---

## 11. Key Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Gemini API changes/deprecation | Medium | High | Abstract behind `IGeminiService` interface; easy to swap |
| MS Access parsing in browser (WASM) | High | High | Provide fallback: manual table entry UI |
| Hebrew font rendering in docx | Medium | Medium | Test with David MT + Arial; use `docx` bidi settings |
| Student provides incomplete code | High | Medium | Graceful placeholders; partial generation still useful |
| Gemini hallucination in technical descriptions | Medium | High | Show AI output in editable review step before generation |
| MoE rubric changes | Low | High | Config-driven chapter requirements; update config only |

---

## 12. Glossary

| Term | Definition |
|------|-----------|
| **MoE** | Israeli Ministry of Education (משרד החינוך) |
| **Sefer Proyekt (ספר פרויקט)** | The mandatory project book documenting the student's capstone project |
| **Questionnaire 883589** | The specific MoE exam questionnaire for "Async Programming, Web Services & Databases" |
| **ERD** | Entity-Relationship Diagram — database schema visualization |
| **UML** | Unified Modeling Language — class/architecture diagrams |
| **DFD** | Data Flow Diagram |
| **Mermaid.js** | JavaScript library for rendering diagrams from text definitions |
| **docx.js** | JavaScript library for generating `.docx` (Word) files in the browser |
| **RTL** | Right-to-Left text direction (Hebrew, Arabic) |
| **Gemini** | Google's multimodal AI model used for code and schema analysis |
| **ViewModel** | Pattern used in the MoE rubric to describe server-side business logic classes |

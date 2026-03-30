---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
inputDocuments:
  - _bmad-output/planning-artifacts/requirements.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/project-context.md
project_name: AutoProjectBook (Sefer-Proyekt-Wizard)
user_name: Agbaria
date: 2026-03-29
---

# UX Design Specification — AutoProjectBook (Sefer-Proyekt-Wizard)

**Author:** Agbaria  
**Date:** 2026-03-29

---

## Executive Summary

### Project Vision

AutoProjectBook eliminates the documentation barrier for Israeli high-school Software Engineering students by transforming their finished C# project into a fully MoE-compliant Sefer Proyekt document in under 30 minutes — no writing skills required. The tool is **student-facing only**; teachers are not primary users and require no dedicated configuration screens in v1.0.

### Target Users

**Students (Primary):** Grades 11-12, Software Engineering major. Have completed their C# capstone project but struggle with the 40-60 page formal documentation requirement. Hebrew or Arabic native speakers. Varying technical confidence. Use school lab computers or personal laptops (Windows, Chrome/Edge).

**Teachers (Out of Scope for v1.0 UX):** Not a primary use case. No teacher-specific configuration screens needed.

### Editing Model

The tool targets **~80% document completeness** out of the box. Students download the `.docx` and finish editing in Microsoft Word — which they already know. The in-app review step is therefore **lightweight**: students spot-check and approve sections, not line-edit them. The app is not a writing tool; it's a document launcher.

### Preview Strategy

A **best-effort styled HTML preview** is included before download (nice-to-have, not blocking). If preview adds complexity, a "trust and download" flow is fully acceptable.

### UI Mode

**Single light mode only.** No dark mode required. Standard web appearance compatible with school lab monitors.

### Key Design Challenges

- RTL-native experience across all surfaces: forms, wizard, editor, diagrams, document preview
- Managing student anxiety around AI-generated content — making review feel safe and scannable
- File upload UX for non-technical users (C# folder, `.sql`/`.mdb` files) with clear visual feedback and fallbacks
- Progress clarity during async AI generation steps to prevent "is it broken?" confusion
- Pre-download compliance confidence: students need evidence their document meets MoE requirements

### Design Opportunities

- Guided fallback flows that turn parsing failures into friendly manual-entry experiences
- **Approve / flag** review model instead of raw text editing — one click per section
- Live MoE compliance checklist giving students section-by-section confidence before export

---

## Core User Experience

### Defining Experience

The core interaction is a linear transformation: student uploads their project files → provides their name and Gemini API key → the tool generates professional Hebrew/Arabic documentation → student downloads a ready-to-submit `.docx`. The "magic moment" is seeing AI-generated paragraphs that reference the student's actual class names, table structures, and screenshots. Everything in the UX serves this transformation arc.

The tool targets **~80% document completeness**. The cover page is filled in manually by the student in Word after download — no need to collect all cover page metadata in-app. The student provides only what the tool needs to do its job: name, Gemini key, project files.

### Platform Strategy

Web SPA (Chrome/Edge primary). Mouse + keyboard, desktop-first. No install required — just a URL, important for school computers. Single-tab flow from start to download. No offline mode (Gemini API requires network — this is a hard dependency; if Gemini is unavailable, the tool cannot function and says so clearly upfront).

### Target User Profile

- **Age:** 16–17 years old, Software Engineering major
- **Technical comfort:** Can code C#, but may never have used an API key before
- **Language:** Hebrew or Arabic first language
- **Device:** School lab Windows PC or personal laptop, Chrome/Edge browser
- **Goal:** Get the Sefer Proyekt done with as little writing as possible

### Input Requirements (Simplified)

| Input | Required? | Notes |
|-------|-----------|-------|
| Student name | Yes | Used in document header only |
| Gemini API key | Yes — hard dependency | Tool non-functional without it |
| Gemini model name | Yes | Dropdown of known models; default: gemini-1.5-pro |
| C# project files | Yes | Folder upload via directory picker |
| MS Access DB file (`.mdb`/`.accdb`) | Preferred | If not provided → screenshot fallback |
| Screenshots of tables/relations | Only if no DB file | Manual fallback path |
| Application screenshots | Optional | For User Guide chapter |

> **Cover page:** Filled in manually by the student in Word after download. The tool does NOT collect school name, teacher name, ID number, etc. — keeping onboarding to the bare minimum.

### Fallback Strategy

**DB not provided:**
> "No Access file? No problem. Take screenshots of your tables and relationships and upload them here. Gemini will read them and describe your database."
— Gemini vision capability used to interpret table screenshots.

**Gemini unavailable / invalid key:**
> Show a clear error on the API key screen. Do not let the student proceed. There is no fallback AI — this is a hard gate.

### Effortless Interactions

| Action | UX Goal |
|--------|---------|
| Language selection | One click on first screen — Hebrew or Arabic flag button |
| Name + API key entry | Two fields on one screen; "Test Connection" button gives instant feedback |
| Uploading C# project folder | Directory picker + drag-and-drop; shows file count and class count found |
| Uploading Access DB | Single file picker; instantly shows table names found |
| DB screenshot fallback | Clear prompt: "No DB file? Upload screenshots of your tables instead" |
| Section review | Single **"✓ Looks good"** per section — no required reading to proceed |
| Downloading | Single large CTA — no second-guessing |

### Critical Success Moments

1. **"API key works!"** — Green checkmark after testing the Gemini key. Student is unblocked.
2. **"It found my tables"** — After Access DB upload, table names appear. Trust is established.
3. **"It found my classes"** — After code upload, class names and count shown. Second trust anchor.
4. **"It wrote about my project"** — First AI paragraph appears with the student's actual data in it. This is the magic moment.
5. **"Everything is green"** — MoE compliance checklist fully checked before download. Confidence before submit.
6. **"My Word doc looks real"** — Opening the `.docx` in Word shows a proper RTL Hebrew document. Exit satisfaction.

### Experience Principles

1. **Show progress, not process** — "Writing Introduction… ✓" not "Calling gemini-1.5-pro with 2,400 tokens…"
2. **Minimum viable input** — Ask only what the tool actually needs. Name + API key + files. Nothing else until necessary.
3. **Trust, then verify** — Sections auto-approved by default; student flags problems, not approves everything
4. **Every error has a next step** — "No DB file?" leads directly to the screenshot upload. Dead ends are forbidden.
5. **RTL is invisible** — Correct everywhere, always. Never a setting to toggle.
6. **Help as much as possible** — 80% is a win. Partial output is better than nothing. Never block generation because one piece is missing.

---

## Design System

### Approach: Tailwind CSS Utility-First (Themeable, No External Component Library)

**Decision:** Tailwind CSS v3 with custom component patterns. No external component library (no MUI, Ant Design, etc.).

**Rationale:**
- Architecture is already locked to Tailwind — consistent with tech stack
- RTL logical properties (`ms-*`, `me-*`, `ps-*`, `pe-*`) are first-class in Tailwind v3, making true RTL straightforward
- No component library ships with reliable RTL + Hebrew font support out of the box — custom components give full control
- Solo/small team project — a heavyweight design system adds more overhead than value

### Color Palette

| Role | Token | Value | Notes |
|------|-------|-------|-------|
| Primary | `blue-600` | #2563EB | Action buttons, active step |
| Primary hover | `blue-700` | #1D4ED8 | |
| Success | `green-600` | #16A34A | Approved sections, ✓ checkmarks |
| Warning | `amber-500` | #F59E0B | Sections needing review |
| Error | `red-600` | #DC2626 | Validation errors, failed parsing |
| Background | `gray-50` | #F9FAFB | App background |
| Surface | `white` | #FFFFFF | Cards, panels |
| Border | `gray-200` | #E5E7EB | Card borders, dividers |
| Text primary | `gray-900` | #111827 | Body text |
| Text secondary | `gray-500` | #6B7280 | Labels, captions |

### Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| App headings | System UI → Segoe UI → Arial | 20–24px | 700 |
| Body / labels | System UI → Segoe UI → Arial | 14–16px | 400 |
| Hebrew/Arabic content preview | David MT → Arial | 16px | 400 |
| Code preview | Courier New | 13px | 400 |

> **Note:** David MT is used only in the document preview and the generated `.docx`. App UI uses system fonts for performance and broad compatibility on school computers.

### Spacing & Layout

- Base unit: 4px (Tailwind default)
- Page max-width: 800px centered (wizard doesn't need full-width)
- Card padding: 24px (`p-6`)
- Form field gap: 16px (`gap-4`)
- Step content area: single column, full-width within 800px container

### Component Patterns

| Component | Pattern | RTL Note |
|-----------|---------|----------|
| Step indicator | Horizontal progress bar + numbered circles at top | Reverses order in RTL (step 1 on right) |
| Form fields | Label above → input below, full width | `text-right` for RTL labels |
| File upload zone | Dashed border box, icon + text centered, drag-over highlight | Symmetric — no RTL change needed |
| Section status badge | Pill badge: Idle / Generating / Review / Approved | Color-coded (gray/amber/blue/green) |
| Primary CTA | Full-width blue button at bottom of each step | — |
| Error state | Red border + red text below field | — |
| Toast notifications | Bottom-center slide-up | — |

---

## Screen Flow & Interaction Design

### Wizard Overview

```
[1] Language  →  [2] Setup  →  [3] Code Upload  →  [4] Database  →  [5] Screenshots
                                                                              ↓
                              [8] Download  ←  [7] Review  ←  [6] Generating
```

Linear flow. Back navigation allowed between steps 1–5. Steps 6–8 are forward-only.

---

### Screen 1 — Language Selection

**Purpose:** First thing the student sees. Sets UI + document output language.

- Two large equal-sized buttons: `עברית 🇮🇱` and `عربية 🇵🇸`
- One click → language locked → auto-advance to Screen 2
- No logo, no explanation, no other content — purely the choice
- After selection, entire UI switches direction (`dir="rtl"` toggled)

---

### Screen 2 — Setup (Name + API Key)

**Purpose:** Minimum viable identity + Gemini connection. Hard gate.

**Fields:**
| Field | Type | Validation |
|-------|------|-----------|
| Student name | Text input | Required, shown in document header only |
| Gemini API key | Password input (show/hide toggle) | Required |
| Gemini model | Dropdown | `gemini-1.5-pro` (default), `gemini-1.5-flash`, `gemini-2.0-flash` |

**Behaviour:**
- "Test Connection" button → calls Gemini with a minimal ping prompt
  - ✅ Green: "Connection successful — ready to generate!"
  - ❌ Red: "Cannot connect. Check your API key and try again." — Next button stays disabled
- **"Next" is disabled until the connection test passes** — no progression without working AI
- No other metadata collected at this stage; cover page is the student's job in Word

---

### Screen 3 — Upload C# Project

**Purpose:** Ingest source code for AI analysis and UML generation.

**Interactions:**
- Large drag-and-drop zone + "Browse folder" button (directory picker)
- After selection: instant feedback
  - "Found **X** `.cs` files in **Y** folders"
  - Expandable list of detected class/interface names (collapsed by default)
- **Project Type Detection:**
  - Gemini auto-detects from class names and namespaces (Blazor/WPF/Android/Other)
  - Presents detection result as an editable dropdown: *"We detected: **Blazor Web App** — correct?"*
  - Student can change if wrong — this informs the AI's writing style
- Advanced panel (collapsed): checkboxes to exclude specific files/folders from analysis
- Auto-excluded: `Migrations/`, `*.Designer.cs`, `*.g.cs`, test folders
- Cannot be skipped

---

### Screen 4 — Upload Database

**Purpose:** Extract schema for ERD generation and Database chapter.

**DB Extraction Strategy (important):**
> MS Access `.mdb`/`.accdb` files contain full schema metadata internally — table names, column names, data types, primary keys, and relationship definitions (via `MSysRelationships`). This is extracted programmatically via a browser WASM parser. **No screenshots needed when the file is provided.**

**Three paths on the same screen:**

**Path A — Upload Access DB file (preferred):**
- Single file upload zone (`.mdb` / `.accdb`)
- After upload: shows extracted table names, column count, and relationship count
  - e.g., "Found **5 tables**, **3 relationships** ✓"
- Optional: student can add a short description per table (helps AI write better)
- Covers ERD generation + Database chapter fully automatically

**Path B — SQL Server script (future-ready, grayed out in v1.0):**
- Disabled upload zone with label: "SQL Server (.sql) — coming soon"
- Makes the extension point visible without building it yet

**Path C — No DB file (screenshot fallback):**
- Revealed by link: *"Don't have an Access file? Upload a screenshot of your tables and relationships instead."*
- Screenshot upload zone — accepts PNG/JPG
- Instruction: *"Take a screenshot of each table design view and the Relationships window in Access. Upload them all here."*
- Gemini vision interprets the screenshots to reconstruct the schema

**Path D — Skip:**
- "Skip database section" checkbox at bottom
- Warning: *"The database chapter will be left incomplete. You can fill it in manually in Word."*
- Does not block generation of other chapters

---

### Screen 5 — Application Screenshots *(Optional)*

**Purpose:** Provide screenshots for the User Guide chapter.

- Clearly labeled **OPTIONAL** — prominent "Skip this step" button
- Drag-and-drop multi-image zone (PNG, JPG, WEBP; max 5MB each)
- After upload: thumbnail grid
  - Caption field per image (in target language)
  - Screen name / title field
  - User type tag: Admin / Regular User / Both
- Drag to reorder
- If skipped: User Guide chapter contains placeholder text noting screenshots are needed
- Max 30 screenshots (practical limit for reasonable docx size)

---

### Screen 6 — Generating

**Purpose:** AI generates all document chapters. Student waits.

**Layout:**
- Full-screen progress view — no navigation, no other actions
- Animated progress bar at top
- Section-by-section status list (human-readable, not technical):

```
✓  Reading your code...
✓  Detecting project type: Blazor Web App
✓  Reading your database...
⟳  Writing Introduction...          ← animated spinner
○  Writing System Analysis
○  Writing Database chapter
○  Writing Server-side Implementation
○  Writing Client-side Implementation
○  Writing User Guide
○  Generating UML diagram
○  Generating ERD diagram
○  Wrapping up...
```

- Section failure: amber ⚠️ — *"This section had an issue — continuing with the rest"*
- All failures: red banner — *"Generation encountered problems. You can still download what was created."*
- On completion: auto-advance to Screen 7
- **Cannot be cancelled** (keep it simple; Gemini calls are short anyway)

---

### Screen 7 — Review

**Purpose:** Student sees what was generated before downloading. View-only — no editing in app.

**Layout:**
- Left sidebar: chapter list with status badges
  - ✅ Green = Generated successfully
  - ⚠️ Amber = Generated with issues / incomplete
  - ❌ Red = Failed
- Main content area: selected chapter text (read-only, RTL, Hebrew/Arabic font)
- Diagrams shown inline as rendered images (UML, ERD)
  - Below each diagram: Gemini-generated description paragraph
- Bottom: **"Download Document"** button (always active — even if some sections failed)
- No text editing, no regeneration in this version
- Small note: *"You can edit the content in Microsoft Word after downloading"*

---

### Screen 8 — Download

**Purpose:** Confirmation screen + file download trigger.

**Layout:**
- MoE compliance checklist (which required chapters are present):
  - ✅ Cover Page scaffold
  - ✅ Introduction
  - ✅ System Analysis
  - ✅ Database chapter
  - etc.
  - ⚠️ Any skipped/failed sections flagged
- Large primary button: **"Download .docx"** — triggers browser download
- Filename: `[StudentName]-ספר-פרויקט-[YYYY-MM-DD].docx`
- Helper note (in target language): *"Open in Microsoft Word to complete the cover page and make any final edits before submitting."*
- "Start Over" link (resets all state)

---

### Navigation Rules

| From | To | Allowed? | Condition |
|------|----|----------|-----------|
| Any step 1–5 | Previous step | ✅ Yes | Always |
| Screen 2 | Screen 3 | ✅ Only if | Connection test passed |
| Screen 5 | Screen 6 | ✅ Yes | Generate button click |
| Screen 6 | Screen 7 | ✅ Auto | When generation completes |
| Screen 7 | Screen 6 | ❌ No | Cannot re-generate |
| Screen 8 | Screen 7 | ✅ Yes | "Back to review" link |

---

## User Journey Flows

### Primary Happy Path — Student with Access DB

```
Opens app
    │
    ▼
[Screen 1] Clicks "עברית" → UI flips RTL
    │
    ▼
[Screen 2] Enters name + API key → clicks "Test Connection" → ✅ green → Next
    │
    ▼
[Screen 3] Drags C# project folder → sees "Found 12 .cs files, 8 classes"
           Gemini detects: "Blazor Web App — correct?" → student confirms → Next
    │
    ▼
[Screen 4] Drops .mdb file → sees "Found 5 tables, 3 relationships ✅" → Next
    │
    ▼
[Screen 5] Uploads 6 screenshots, adds captions → Next (or Skip)
    │
    ▼
[Screen 6] Watches generation progress — all 11 items turn ✓ (~60 seconds) → auto-advance
    │
    ▼
[Screen 7] Reads through each chapter heading, scans content, sees UML + ERD images
           satisfied → clicks "Download Document"
    │
    ▼
[Screen 8] Sees all 8 MoE sections ✅ → clicks big blue button → .docx downloads
           Opens in Word → edits cover page → submits
```

---

### Fallback Path — No DB File

```
[Screen 4] Student has no .mdb file
    │
    ▼
Clicks "Don't have an Access file? →"
    │
    ▼
Screenshot upload zone appears
Student uploads 3 screenshots: Students table, Grades table, Relationships view
    │
    ▼
[Screen 6] Gemini vision reads screenshots, reconstructs schema, generates DB chapter
```

---

### Error Path — API Key Fails

```
[Screen 2] Student enters wrong API key → clicks "Test Connection"
    │
    ▼
Red ✗ banner: "Cannot connect to Gemini. Please check your API key and try again."
    │
    ▼ (Next button remains disabled)
Student corrects key → tests again → ✅ → proceeds
```

---

## Component Strategy

### Custom Components Required

Since the design system is Tailwind CSS (no external component library), the following purpose-built components are needed:

| Component | Location | Key Behaviour |
|-----------|----------|--------------|
| `<WizardLayout>` | App shell | Renders step indicator + content area; manages RTL direction |
| `<StepIndicator>` | Top of all screens | Numbered circles 1–8; RTL-mirrored in Hebrew/Arabic |
| `<LanguageButton>` | Screen 1 | Large flag + lang name; toggles `dir` + `lang` on `<html>` |
| `<ApiKeyInput>` | Screen 2 | Password field with show/hide + "Test Connection" button |
| `<ModelPicker>` | Screen 2 | Dropdown of known Gemini models |
| `<DirectoryUploader>` | Screen 3 | Drag-drop zone + directory picker; shows file count after selection |
| `<ClassList>` | Screen 3 | Collapsible list of detected class names with exclude checkboxes |
| `<ProjectTypeDetector>` | Screen 3 | Editable dropdown showing Gemini-detected project type |
| `<AccessDBUploader>` | Screen 4 | File upload + parsed table list display |
| `<TableDescEditor>` | Screen 4 | Optional per-table description fields |
| `<DBScreenshotFallback>` | Screen 4 | Hidden panel revealed when student lacks .mdb file |
| `<ScreenshotGallery>` | Screen 5 | Drag-reorderable thumbnail grid with caption inputs |
| `<GenerationProgress>` | Screen 6 | Full-screen animated status list |
| `<ChapterViewer>` | Screen 7 | RTL-rendered read-only chapter content + inline diagram images |
| `<ComplianceChecklist>` | Screen 8 | MoE section checklist with pass/warn/fail indicators |
| `<DownloadButton>` | Screen 8 | Primary CTA that triggers browser file download |

### Shared UI Primitives

All built with Tailwind, RTL-aware via logical properties:

| Primitive | Notes |
|-----------|-------|
| `<Button variant="primary|secondary|ghost">` | `blue-600` primary; `gray-200` secondary |
| `<Input>` | Full-width, `text-right` in RTL, red border on error |
| `<Select>` | Native `<select>` styled with Tailwind |
| `<FileDropZone>` | Dashed border, drag-over highlight (`blue-100` bg) |
| `<Badge status="success|warning|error|idle">` | Pill badge, color-coded |
| `<Toast>` | Bottom-center, slide-up, auto-dismiss after 4s |
| `<Spinner>` | Animated ring for loading states |
| `<RTLText>` | `<p>` wrapper forcing `dir="rtl"` for Hebrew/Arabic content preview |

---

## UX Consistency Patterns

### Button Hierarchy

| Level | Appearance | Use |
|-------|-----------|-----|
| Primary | `bg-blue-600 text-white` full-width | One per screen max; the main forward action |
| Secondary | `border border-gray-300 text-gray-700` | Optional actions (Skip, Back) |
| Ghost | `text-blue-600 underline` | Inline links (fallback paths, "learn more") |
| Destructive | `bg-red-600 text-white` | Not used in v1.0 |

### Feedback Patterns

| Situation | Pattern |
|-----------|---------|
| API key test success | Green inline banner below input, persists |
| API key test failure | Red inline banner, descriptive message, retry hint |
| File upload success | Green badge with file count; no modal |
| File parse error | Amber inline alert with clear next-step instruction |
| Gemini section failure | Amber ⚠️ row in generation list; does not block other sections |
| Fatal error (all failed) | Red banner + "Download partial result anyway" option |

### Progress Communication

| Context | Pattern |
|---------|---------|
| API test in progress | Spinner inside "Test Connection" button, button disabled |
| File parsing | Brief inline spinner + "Parsing…" text below drop zone |
| AI generation | Full-screen progress list with animated spinners per item |
| docx assembly | Progress bar + "Assembling document…" message |
| Download ready | Immediate browser download trigger — no loading state needed |

### Empty / Skipped States

| Chapter | Placeholder in docx |
|---------|-------------------|
| Database (skipped) | *"[Section not generated — add your database description here]"* |
| User Guide (no screenshots) | *"[Section not generated — add your application screenshots and descriptions here]"* |
| Any failed section | *"[Section could not be generated — write this section manually]"* |

### Form Validation

- Validate on blur (not on keystroke) — reduces anxiety for non-technical users
- Error messages below the field, in target language (Hebrew/Arabic)
- No modal dialogs for validation errors — always inline

---

## Responsive Design & Accessibility

### Responsive Strategy

**Desktop-first** (primary context: 1280px+ school lab monitors or personal laptops).

| Breakpoint | Layout |
|------------|--------|
| 1280px+ | Two-column: step indicator sidebar (240px) + content (flexible) |
| 1024px | Same layout, slightly tighter padding |
| 768px | Single column — sidebar becomes horizontal step bar at top |
| < 768px | Not a supported use case for v1.0; show a "please use a desktop browser" banner |

### RTL Layout Rules

| Rule | Implementation |
|------|---------------|
| All spacing uses logical properties | `ms-*`, `me-*`, `ps-*`, `pe-*` — never `ml`, `mr`, `pl`, `pr` |
| Step indicator reverses order in RTL | Step 1 on the right, Step 8 on the left |
| Form labels align to reading edge | `text-start` (right in RTL, left in LTR) |
| Icons that imply direction flip | Back arrow ← becomes → in RTL |
| Drag-and-drop zones | Symmetric; no RTL change needed |
| Toast position | Bottom-center regardless of direction |

### Accessibility Baseline

| Requirement | Approach |
|-------------|---------|
| Keyboard navigation | All interactive elements focusable in logical tab order; wizard step advances with Enter |
| Screen reader support | `aria-label` on icon-only buttons; `aria-live` on generation progress list |
| Color contrast | All text on backgrounds meets WCAG AA (4.5:1 minimum) |
| Focus indicators | Tailwind `focus:ring-2 focus:ring-blue-500` on all interactive elements |
| Error association | Error messages linked to fields via `aria-describedby` |
| Loading states | `aria-busy="true"` on generation progress screen |
| Language attribute | `lang="he"` or `lang="ar"` on `<html>`; updates when student selects language |

---

## Implementation Notes for Developers

1. **Access DB parsing:** Use `mdb-reader` (pure JS, no WASM) to read `.mdb`/`.accdb` in browser. Extracts table schemas and `MSysRelationships` for FK detection. Fall back to Gemini vision if library fails on edge-case formats.

2. **Gemini vision for DB screenshots:** Send uploaded screenshots as base64 image parts to Gemini with prompt: *"Extract all database table names, their columns, data types, and relationships visible in these screenshots. Return as structured JSON."*

3. **Project type detection:** After C# parsing, send class names and namespaces list to Gemini with prompt: *"Based on these C# class names and namespaces, what type of .NET application is this? Answer with one of: Blazor, WPF, WinForms, Android, Console, Other."*

4. **Diagram generation → docx embedding:** Render Mermaid diagrams to SVG in-browser using `mermaid.render()`. Convert SVG to PNG via Canvas API (`drawImage` + `toDataURL`). Embed PNG into docx via `docx` `ImageRun`. Add Gemini-generated description paragraph immediately after each diagram.

5. **RTL docx:** All paragraphs use `bidirectional: true` and `alignment: AlignmentType.RIGHT`. Code blocks are explicitly `rtl: false` (LTR). Use `David MT` font as primary; Arial as fallback.

6. **Session persistence:** Store wizard state in `sessionStorage` (not `localStorage`). Exclude `geminiApiKey` and `File` objects from serialized state. On page refresh, restore state to current step with note that files need re-uploading.

---

## UX Design Specification Complete

**Output file:** `_bmad-output/planning-artifacts/ux-design-specification.md`  
**Status:** ✅ Complete — ready for story creation

**What this spec covers:**
- 8-screen wizard flow with all interaction details
- Complete fallback paths (no DB file, API failure)
- Design system tokens (colors, typography, spacing)
- 17 custom component definitions
- UX consistency patterns (buttons, feedback, progress, validation)
- RTL implementation rules
- Accessibility baseline
- Developer implementation notes

**Recommended next step:** `[CE]` **Create Epics and Stories** — `bmad-create-epics-and-stories`

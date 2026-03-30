# Story 8.5: C# Classes Documentation in Generated Word Document

**Epic:** 8 — Document Export
**Story ID:** 8-5
**Status:** review
**Date:** 2026-03-30
**Project:** AutoProjectBook (Sefer-Proyekt-Wizard)

---

## Story

As a student generating my project book,
I want my uploaded C# class files to appear inside the Server Implementation chapter of the Word document — formatted as readable code with a class explanation and description of each main method —
so that the assessor can review my actual code structure and understand what each class and method does, without needing to open the source files separately.

---

## Acceptance Criteria

1. **Classes section appended to Server Implementation chapter:**
   After the AI-generated text in `serverImplementation`, a new sub-section "מבנה המחלקות (C#)" (Classes Structure) is appended containing one block per parsed C# class.

2. **Per-class block structure:**
   Each class block contains:
   - **H2 heading:** `ClassName` (with inline metadata: `[namespace]`, `abstract` / `interface` badge if applicable)
   - **Class description paragraph:** use `xmlDocComment` if present; otherwise a placeholder: `"מחלקה זו מהווה חלק ממערכת [שם הפרויקט]"`
   - **Base class / interfaces line:** e.g. `"יורשת מ: BaseClass, IInterface1"` (omitted if none)
   - **Properties & fields section (H3):** formatted as a code-style list — each on its own line using monospace font (`Courier New` 9pt), one line per property: `accessModifier type Name`
   - **Methods section (H3):** for each method: method signature in monospace (`accessModifier returnType Name(params)`) followed by an explanation paragraph — use `xmlDocComment` if present, otherwise the placeholder: `"פעולה זו מבצעת [methodName]"`
   - **Key methods** (`isKeySnippet: true`) are rendered first and marked with a `★` prefix in their heading.
   - **Appendix methods** (`isExplainInAppendix: true`) include a note: `"(מוסבר בנספח)"`.

3. **When no classes are parsed** (`classes` array is empty or not passed), the section is silently omitted — no placeholder, no error.

4. **Code formatting standard:**
   - All code lines use `Courier New` 9pt, left-to-right (`rightToLeft: false`), black, no bold.
   - No wrapping issues — code lines are treated as individual `Paragraph`s (one per line) not a single block, so Word wraps naturally.
   - Class section paragraphs use LEFT alignment (code is LTR, even in Hebrew document).

5. **ExportPage wires up classes from store:**
   `ExportPage.tsx` currently hardcodes `classes: []` in `handleStartOver` but **does not pass** `classes` to `buildAndDownloadDocument()`. Fix this: read `state.classes` from the store and pass `classes: state.classes` to `buildAndDownloadDocument()`.

6. **`BuildDocumentInput` extended:**
   Add `classes?: CSharpClass[]` to the `BuildDocumentInput` interface in `src/services/docBuilder/index.ts`.

7. **Regression guard:**
   - `npm run typecheck` passes clean.
   - `npm test -- --run` stays at 68/68 (no tests broken, no new required).
   - `npm run build` succeeds.
   - If `classes` is absent or empty, the document is identical to before this story.

---

## Tasks / Subtasks

- [x] Task 1 — Extend `BuildDocumentInput` (AC: 6)
  - [x] 1.1: Import `CSharpClass` type at top of `src/services/docBuilder/index.ts`
  - [x] 1.2: Add `classes?: CSharpClass[]` field to `BuildDocumentInput` interface

- [x] Task 2 — Wire classes from store in ExportPage (AC: 5)
  - [x] 2.1: In `src/features/export/ExportPage.tsx`, add `const classes = useAppStore((s) => s.classes);`
  - [x] 2.2: Pass `classes` into the `buildAndDownloadDocument()` call (alongside existing `tables`, `screenshotFiles`, etc.)

- [x] Task 3 — Implement `buildCSharpSection()` in docBuilder (AC: 1, 2, 3, 4)
  - [x] 3.1: Create helper `codeLineParagraph(text: string): Paragraph` — `Courier New` 9pt, LTR, LEFT alignment
  - [x] 3.2: Create `classBlock(cls: CSharpClass): Paragraph[]` that produces the full per-class block (H2, description, base, properties, methods)
  - [x] 3.3: Create `buildCSharpSection(classes: CSharpClass[]): Paragraph[]` — guard empty, then `chapterHeading('מבנה המחלקות (C#)')` + flatMap `classBlock` per class
  - [x] 3.4: In the `serverImplementation` branch of the `for (const key of CHAPTER_ORDER)` loop, call `buildChapterSection()` as normal, then append `buildCSharpSection(input.classes ?? [])` if non-empty

- [x] Task 4 — Verify no regressions (AC: 7)
  - [x] 4.1: `npm run typecheck`
  - [x] 4.2: `npm test -- --run` → 68/68

---

## Dev Notes

### Key Files to Touch

| File | Change |
|------|--------|
| `src/services/docBuilder/index.ts` | Add `CSharpClass` import, extend `BuildDocumentInput`, add `buildCSharpSection()`, wire into `serverImplementation` branch |
| `src/features/export/ExportPage.tsx` | Read `state.classes` from store, pass to `buildAndDownloadDocument()` |

**DO NOT touch:**
- `src/services/parsers/csharpParser.ts` — parsing is already complete and correct
- `src/store/slices/extraction.ts` — `classes` field already exists
- Any test files (no new tests needed for this story)

---

### Code Patterns — docBuilder/index.ts

The `serverImplementation` branch currently falls into the generic `else` case:
```typescript
} else {
  allBodySections.push(...buildChapterSection(key, content, status));
}
```

Replace with:
```typescript
} else if (key === 'serverImplementation') {
  allBodySections.push(...buildChapterSection(key, content, status));
  allBodySections.push(...buildCSharpSection(input.classes ?? []));
} else {
  allBodySections.push(...buildChapterSection(key, content, status));
}
```

---

### Code Formatting Helper Pattern

Use this exact pattern for code lines (follows existing `rtlParagraph` helper style but LTR):

```typescript
function codeLineParagraph(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    children: [
      new TextRun({
        text,
        font: 'Courier New',
        size: 18,           // 9pt (half-points)
        rightToLeft: false,
      }),
    ],
  });
}
```

**Important:** Do NOT spread `RTL_PARA` or `HEBREW_RUN` into code line paragraphs — code is LTR.

---

### Per-Class Block Construction

```typescript
function classBlock(cls: CSharpClass): Paragraph[] {
  const paras: Paragraph[] = [];

  // H2 heading: ClassName + badges
  const badges = [
    cls.isAbstract ? 'abstract' : '',
    cls.isInterface ? 'interface' : '',
  ].filter(Boolean).join(', ');
  const headingText = badges ? `${cls.name} (${badges})` : cls.name;
  paras.push(chapterHeading(headingText, 2));

  // Namespace line
  if (cls.namespace) {
    paras.push(rtlParagraph(`מרחב שמות: ${cls.namespace}`));
  }

  // Base class / interfaces
  const bases = [
    cls.baseClass ?? '',
    ...cls.interfaces,
  ].filter(Boolean);
  if (bases.length > 0) {
    paras.push(rtlParagraph(`יורשת מ: ${bases.join(', ')}`));
  }

  // Class description
  const classDesc = cls.xmlDocComment?.trim() || `מחלקה זו מהווה חלק ממערכת הפרויקט`;
  paras.push(rtlParagraph(classDesc));

  // Properties & fields
  const members = [
    ...cls.fields.map((f) => `${f.accessModifier} ${f.type} ${f.name}`),
    ...cls.properties.map((p) => `${p.accessModifier} ${p.type} ${p.name} { get; set; }`),
  ];
  if (members.length > 0) {
    paras.push(chapterHeading('שדות ומאפיינים', 2));
    members.forEach((line) => paras.push(codeLineParagraph(line)));
  }

  // Methods
  if (cls.methods.length > 0) {
    paras.push(chapterHeading('פעולות', 2));
    // Key methods first
    const sorted = [
      ...cls.methods.filter((m) => m.isKeySnippet),
      ...cls.methods.filter((m) => !m.isKeySnippet),
    ];
    for (const method of sorted) {
      const prefix = method.isKeySnippet ? '★ ' : '';
      const sig = `${prefix}${method.accessModifier} ${method.returnType} ${method.name}(${method.parameters.join(', ')})`;
      paras.push(codeLineParagraph(sig));
      const explanation = method.xmlDocComment?.trim() || `פעולה זו מבצעת ${method.name}`;
      paras.push(rtlParagraph(explanation));
      if (method.isExplainInAppendix) {
        paras.push(rtlParagraph('(מוסבר בנספח)'));
      }
    }
  }

  return paras;
}
```

---

### ExportPage.tsx — Current `buildAndDownloadDocument` Call

Current call (around line 70–80 in file):
```typescript
await buildAndDownloadDocument({
  studentName,
  language,
  generatedContent,
  diagrams,
  screenshotFiles,
  tables: dbSchema?.tables ?? [],
});
```

Add `classes: classes` (after reading `const classes = useAppStore((s) => s.classes);`):
```typescript
await buildAndDownloadDocument({
  studentName,
  language,
  generatedContent,
  diagrams,
  screenshotFiles,
  tables: dbSchema?.tables ?? [],
  classes,
});
```

---

### CSharpClass Type Reference

From `src/store/types.ts` (do not modify):
```typescript
export interface CSharpClass {
  filePath: string;
  namespace: string;
  name: string;
  accessModifier: string;
  isAbstract: boolean;
  isInterface: boolean;
  baseClass?: string;
  interfaces: string[];
  properties: ClassProperty[];   // { name, type, accessModifier }
  methods: ClassMethod[];        // { name, returnType, parameters[], isKeySnippet, isExplainInAppendix, xmlDocComment? }
  fields: ClassField[];          // { name, type, accessModifier }
  xmlDocComment?: string;
  isExcluded: boolean;
}
```

**Filter out excluded classes:** `input.classes?.filter((c) => !c.isExcluded) ?? []`

---

### Project Structure Notes

- `src/services/docBuilder/index.ts` — all doc generation lives here; add new helpers near other builder functions (after `buildDatabaseSection`, before `buildAndDownloadDocument`)
- `src/services/docBuilder/styles.ts` — do NOT modify; use existing `RTL_PARA`, `HEBREW_RUN`, `HEADING1_RUN`, `HEADING2_RUN`, `chapterHeading()` helpers
- The `AlignmentType.LEFT` import is already available from `docx` at the top of `index.ts`
- `ImageRun`, `PageBreak` are already imported — no new imports needed except `CSharpClass` type

### References

- [Source: src/services/docBuilder/index.ts] — `BuildDocumentInput`, `buildChapterSection()`, `CHAPTER_ORDER`, `chapterHeading()`, `rtlParagraph()`, `buildAndDownloadDocument()` main loop
- [Source: src/store/types.ts#L58-L95] — `CSharpClass`, `ClassMethod`, `ClassProperty`, `ClassField`
- [Source: src/features/export/ExportPage.tsx] — `buildAndDownloadDocument` call site
- [Source: src/store/slices/extraction.ts] — `classes: []` initial state
- [Source: src/services/docBuilder/styles.ts] — `RTL_PARA`, `HEBREW_RUN`, `HEADING1_RUN`, `HEADING2_RUN`

---

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

### Completion Notes List

- Added `CSharpClass` import and `classes?: CSharpClass[]` field to `BuildDocumentInput`
- Implemented `codeLineParagraph()` helper (Courier New 9pt, LTR, LEFT aligned — no RTL_PARA spread)
- Implemented `classBlock()` — renders H2 heading, namespace, inheritance, description, properties/fields as code lines, methods with xmlDocComment or placeholder; key methods (`isKeySnippet`) first with ★ prefix; appendix methods get `(מוסבר בנספח)` note
- Implemented `buildCSharpSection()` — filters excluded classes, starts on new page with H1 heading, flatMaps classBlock per visible class; silently returns [] when no visible classes
- Wired `serverImplementation` branch in `buildAndDownloadDocument()` loop to call `buildCSharpSection(input.classes ?? [])` after the AI chapter text
- Updated `ExportPage.tsx` to read `classes` from store and pass to `buildAndDownloadDocument()`
- `npm run typecheck` clean; `npm test -- --run` 68/68; no regressions

### File List

- `src/services/docBuilder/index.ts`
- `src/features/export/ExportPage.tsx`
- `_bmad-output/implementation-artifacts/8-5-csharp-classes-in-document.md`

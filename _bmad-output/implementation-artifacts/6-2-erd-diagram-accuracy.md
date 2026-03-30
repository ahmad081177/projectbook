# Story 6-2: ERD Diagram Accuracy — Real Schema, No Hallucination, Column Extraction

**Epic:** 6 — Diagram Generation
**Story ID:** 6-2
**Status:** ready-for-dev
**Date:** 2026-03-30
**Project:** AutoProjectBook (Sefer-Proyekt-Wizard)

---

## Story

As a student generating my project book,
I want the ERD diagram and the Database chapter to accurately reflect my actual database tables and columns,
so that the diagrams are correct and do not contain hallucinated field names or invented relationships that don't exist in my project.

---

## Problem Being Solved

### Root Cause

`src/services/parsers/accessParser.ts` — `parseAccessFile()` extracts only **table names** from the Access binary. Columns are always set to `columns: []`:

```typescript
const tables: DatabaseTable[] = tableNames.map((name) => ({
  name,
  columns: [],   // ← ALWAYS EMPTY
  description: '',
}));
```

`src/services/gemini.ts` — `tablesToContext()` renders tables as:

```
TABLE Users:
TABLE Orders:
TABLE Products:
```

(No column information at all — just names.)

When the ERD prompt sends this to the AI:
> "צור קוד Mermaid תקני ל-ERD (erDiagram)"

The AI **invents** plausible-looking column names (`userId`, `email`, `password`, `createdAt`, etc.) and relationships based on its training data. These are not the student's actual columns.

### Architect Notes

The JET/ACE (Access) binary format stores a catalog of table definitions in the header pages. Column names for each table are stored in a sub-page structure. Binary scanning for column names is feasible using the same UTF-16LE scanning technique used for table names, with the additional constraint that column names must immediately follow their parent table's page anchor.

A simpler but more reliable approach: scan for all UTF-16LE strings that are valid identifier-like tokens (2–32 chars, alphanumeric+underscore, no spaces), deduplicate against table names, and score them by proximity to the detected table name occurrences. Strings that appear close to a known table name are likely its columns.

---

## Acceptance Criteria

### Part A — Column Name Extraction from Access Binary

1. A new function `extractColumnNames(buffer: ArrayBuffer, tableName: string): string[]` is added to `src/services/parsers/accessParser.ts`.

2. The function scans the binary for UTF-16LE encoded strings that appear within a configurable byte window (±2048 bytes) of any occurrence of the `tableName` UTF-16LE string.

3. Candidate strings pass these filters:
   - Length 2–32 characters
   - Match `/^[A-Za-z][A-Za-z0-9_]*$/` (valid identifier, no spaces)
   - Not in `SYSTEM_STRINGS` set
   - Not a duplicate of found column names for this table
   - Not equal to the table name itself
   - Appear at least **2 times** near the table name occurrences (to filter noise)

4. `parseAccessFile()` is updated to call `extractColumnNames()` for each detected table and populate `columns` with discovered names (type inferred as `'TEXT'`, `nullable: true`, all FK/PK flags `false` — we can't reliably detect these from binary).

5. When column extraction yields 0 results for a table, `columns` remains `[]` — graceful degradation.

### Part B — ERD Prompt — Strict No-Hallucination Mode

6. `tablesToContext()` in `src/services/gemini.ts` is updated to emit a clear signal when columns are unknown:

```typescript
function tablesToContext(tables: DatabaseTable[]): string {
  return tables
    .map((t) => {
      if (t.columns.length === 0) {
        return `TABLE ${t.name}: [no column info available — show table box only]`;
      }
      const cols = t.columns.map((c) =>
        `  ${c.name}: ${c.type}${c.isPrimaryKey ? ' PK' : ''}${c.isForeignKey ? ` FK→${c.referencesTable ?? '?'}` : ''}`
      ).join('\n');
      return `TABLE ${t.name}${t.description ? ` -- ${t.description}` : ''}:\n${cols}`;
    })
    .join('\n\n');
}
```

7. The `generateErdDiagram()` prompt in `src/services/gemini.ts` is updated to include explicit no-hallucination instruction:

```typescript
export async function generateErdDiagram(ctx: GenerationContext): Promise<string> {
  const systemPrompt = buildSystemPrompt(ctx.language);
  const userPrompt = `טבלאות:
${tablesToContext(ctx.tables)}

STRICT RULES:
- Use ONLY the table names and column names listed above.
- If a table shows "[no column info available]", draw that table as an entity with NO attributes.
- Do NOT invent, guess, or add any column names or relationships that are not explicitly listed above.
- Do NOT add Id, CreatedAt, UpdatedAt or any other column unless it appears in the list above.
- Only draw relationships (||--||, ||--|{) if a FK column is explicitly shown above.

צור קוד Mermaid תקני ל-ERD (erDiagram). הכנס רק את קוד Mermaid, ללא הסברים.`;
  return callAI(ctx.provider, ctx.apiKey, ctx.model, ctx.azureCfg, systemPrompt, userPrompt);
}
```

8. The `database` chapter prompt is also updated to add the same constraint at the bottom of the user prompt:

```typescript
database: (ctx) =>
  `${buildProjectSummary(ctx)}
טבלאות מסד הנתונים:
${tablesToContext(ctx.tables)}

IMPORTANT: Base your chapter ONLY on the column names listed above.
If column info is unavailable for a table (marked "[no column info available]"), describe only that the table exists and its name — do NOT invent column names.
כתוב פרק מסד נתונים הכולל תיאור כל טבלה, עמודותיה, והקשרים ביניהן. אורך: כ-${CHAPTER_WORD_COUNTS.database} מילים.`,
```

### Part C — Database Structure Table in the DOCX

9. `buildAndDownloadDocument()` in `src/services/docBuilder/index.ts` receives existing `input` — no new fields required.

10. The **Database chapter** builder (`buildChapterSection('database', ...)`) is overridden with a new `buildDatabaseChapterSection()` variant that appends a **"Database Structure Summary"** subsection **before** the ERD diagrams page:

```
## מבנה מסד הנתונים — טבלאות מזוהות
[For each table: HEADING_3 with table name, then bullet list of column names or "(עמודות לא זוהו)" if none]
```

11. The Database Structure Summary is rendered using the **same Column heading H2, bullet-list paragraph** pattern — it is placed AFTER the chapter text content and BEFORE the diagrams section.

12. `BuildDocumentInput` is extended with `tables: DatabaseTable[]` to pass the actual schema to the docBuilder:

```typescript
export interface BuildDocumentInput {
  // ... existing fields
  tables?: DatabaseTable[];  // passed in from ExportPage
}
```

13. `ExportPage.tsx` is updated to read `tables` from the store and pass them into `buildAndDownloadDocument()`.

14. `npm run typecheck` passes clean. `npm run build` succeeds. `npm test -- --run` stays 68/68.

---

## Key Files

| File | Change |
|------|--------|
| `src/services/parsers/accessParser.ts` | Add `extractColumnNames()`, update `parseAccessFile()` |
| `src/services/gemini.ts` | Update `tablesToContext()`, `generateErdDiagram()`, `database` chapter prompt |
| `src/services/docBuilder/index.ts` | Add `buildDatabaseChapterSection()`, extend `BuildDocumentInput` |
| `src/features/export/ExportPage.tsx` | Pass `tables` into `buildAndDownloadDocument()` |

---

## Technical Context

### Access Binary Column Name Scan

Column names in Access binaries:
- Stored as UTF-16LE sequences (same encoding as table names)
- Located in pages that also contain the table catalog entries
- Typical pattern: table name appears → within next 2KB, column names appear as UTF-16LE strings

The scan algorithm for `extractColumnNames(buffer, tableName)`:

```typescript
export function extractColumnNames(buffer: ArrayBuffer, tableName: string): string[] {
  const bytes = new Uint8Array(buffer);
  const WINDOW = 2048; // bytes to scan around each table name occurrence

  // Find all byte positions where tableName appears as UTF-16LE
  const tableUtf16 = Array.from(tableName).flatMap(ch => [ch.charCodeAt(0), 0]);
  const offsets: number[] = [];
  for (let i = 0; i < bytes.length - tableUtf16.length; i++) {
    if (tableUtf16.every((b, j) => bytes[i + j] === b)) offsets.push(i);
  }
  if (offsets.length === 0) return [];

  // Scan within WINDOW bytes of each table name occurrence
  const freq = new Map<string, number>();
  for (const offset of offsets) {
    const start = Math.max(0, offset - WINDOW);
    const end = Math.min(bytes.length, offset + WINDOW);
    let i = start;
    while (i < end - 1) {
      if (bytes[i + 1] === 0x00 && isPrintableAscii(bytes[i])) {
        let j = i;
        let name = '';
        while (j < end - 1 && bytes[j + 1] === 0x00 && isPrintableAscii(bytes[j])) {
          name += String.fromCharCode(bytes[j]);
          j += 2;
        }
        const trimmed = name.trim();
        if (
          trimmed.length >= 2 &&
          trimmed.length <= 32 &&
          /^[A-Za-z][A-Za-z0-9_]*$/.test(trimmed) &&
          !SYSTEM_STRINGS.has(trimmed) &&
          trimmed !== tableName
        ) {
          freq.set(trimmed, (freq.get(trimmed) ?? 0) + 1);
        }
        i = j;
      } else {
        i++;
      }
    }
  }

  return [...freq.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20) // cap at 20 columns per table
    .map(([name]) => name);
}
```

Note: `isPrintableAscii` is already defined in `accessParser.ts` — do NOT redefine it.

### DatabaseTable type (already in `src/store/types.ts`)

```typescript
export interface DatabaseTable {
  name: string;
  description?: string;
  columns: DatabaseColumn[];
}

export interface DatabaseColumn {
  name: string;
  type: string;         // use 'TEXT' when type is unknown
  nullable: boolean;    // use true when unknown
  isPrimaryKey: boolean; // use false when unknown
  isForeignKey: boolean; // use false when unknown
  referencesTable?: string;
  referencesColumn?: string;
  description?: string;
}
```

### Current `buildAndDownloadDocument` call in `ExportPage.tsx`

```typescript
await buildAndDownloadDocument({
  studentName,
  language,
  generatedContent,
  diagrams,
  screenshotFiles,
});
```

Add `tables: store.dbSchema?.tables ?? []` to this call after reading `dbSchema` from the store.

---

## Out of Scope for This Story

- Inferring PK/FK from column names (e.g. treating `UserId` as FK) — too error-prone
- Reading actual data row values — requires full JET page parser, not feasible in browser
- SQL Server / manual schema sources — SQL schema already has full column info from `sqlParser.ts`; no changes needed for that path
- Editing columns in UI — separate future story

---

## Testing

- Unit test `extractColumnNames()` with a real small Access binary (use a fixture file in `src/services/parsers/__fixtures__/`) — if no fixture available, test the edge cases: empty table → returns `[]`, valid mock bytes → returns expected names.
- Unit test the updated `tablesToContext()`: table with no columns → emits `[no column info available]` string; table with columns → emits column list.
- Existing 68 tests must stay green.

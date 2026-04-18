# Story 8-6: Database Sample Row Previews in Generated Word Document

**Epic:** 8 — Document Export  
**Story ID:** 8-6  
**Status:** done  
**Date:** 2026-04-02  
**Project:** AutoProjectBook (Sefer-Proyekt-Wizard)

---

## Story

As a student generating my project book,
I want each database table section to show a preview of the first 5 rows with all column headers,
so that the assessor can see real table content in addition to the schema structure.

---

## Placement Decision

The preview tables belong inside the **Database** chapter, within each existing per-table block:

1. Table title
2. Table description
3. Column list
4. Table structure image
5. Sample content preview (first 5 rows)

This keeps schema and live content together for the same table, and still leaves relations and full ERD at the end of the chapter.

---

## Acceptance Criteria

1. `DatabaseTable` supports serializable sample row data.
2. Access parsing extracts up to the first 5 rows per table and normalizes cell values to strings.
3. SQL schema parsing remains supported and emits empty sample-row arrays when row data is unavailable.
4. The generated `.docx` adds a sample-content preview image beneath each database table that has sample rows.
5. Each preview contains:
   - a title bar with the DB table name
   - a header row with property names
   - up to 5 data rows
6. The preview remains inside the Database chapter and appears before the chapter's relations subsection.
7. If a table has no sample rows, export continues without error and simply omits that preview.
8. `npm run typecheck` and `npm run test` remain green.

---

## Implementation Notes

- Reuse the existing browser-canvas image rendering approach used elsewhere in document export.
- Keep row previews serializable so they survive session persistence.
- Normalize `Date`, booleans, numbers, binary values, and objects into safe display strings before persisting/exporting.
- Do not move this content to appendices; appendices are currently omitted from export.

---

## Key Files

- `src/store/types.ts`
- `src/services/parsers/accessParser.ts`
- `src/services/parsers/sqlParser.ts`
- `src/utils/mermaid.ts`
- `src/services/docBuilder/index.ts`
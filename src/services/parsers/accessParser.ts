import type { DatabaseSchema, DatabaseTable } from '../../store/types';
import MDBReader from 'mdb-reader';

// Jet database magic bytes (Access 97–2019 all share this signature)
const JET_MAGIC = [0x00, 0x01, 0x00, 0x00];

export function isAccessFile(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 4) return false;
  const view = new Uint8Array(buffer, 0, 4);
  return JET_MAGIC.every((b, i) => view[i] === b);
}

// Well-known MSysObjects column names and other system strings that appear
// as UTF-16LE sequences in the binary but are NOT user table names.
const SYSTEM_STRINGS = new Set([
  'Connect','Database','DateCreate','DateUpdate','Flags','ForeignName',
  'Id','Lv','LvExtra','LvModule','LvProp','Name','Owner','ParentId',
  'RmtInfoLong','RmtInfoShort','Type','ParentIdName',
  'ACM','FInheritable','ObjectId','SID',
  'Attribute','Expression','Flag','Name1','Name2','Order',
  'ccolumn','grbit','icolumn','szColumn','szRelationship',
  'DataAccessPages','SysRel','Scripts','Workspaces',
  'Tables','Queries','Forms','Reports','Pages','Macros','Modules',
  'AppUserVolunteerProject',       // repeated values, not user tables
  'szObject','szReferencedObject', // relationship system fields
  // Common column names that appear frequently in Access binaries
  'Value','Description','Title','Label','Caption','Text','Notes',
  'Status','Category','Priority','Sequence','Position',
]);

/**
 * Heuristically scans an Access MDB/ACCDB binary for user table names.
 *
 * Strategy: table names appear many times throughout the file (referenced
 * in data pages, indexes, catalog entries). Pure field names and value
 * strings appear far fewer times. We count occurrences of each candidate
 * string and require a minimum frequency to accept it as a table name.
 *
 * Additional filters:
 * - Must start with a letter (not a digit, not an underscore)
 * - Must be alphanumeric/underscore/space only, 3–64 chars
 * - Not an MSys* / ~* system name
 * - Not in the hard-coded denylist of known MSysObjects column names
 * - Must appear at least MIN_FREQ times in the binary
 */
export function extractTableNames(buffer: ArrayBuffer): string[] {
  const bytes = new Uint8Array(buffer);
  const freq = new Map<string, number>();

  let i = 0;
  while (i < bytes.length - 2) {
    if (bytes[i + 1] === 0x00 && isPrintableAscii(bytes[i])) {
      let j = i;
      let name = '';
      while (
        j < bytes.length - 1 &&
        bytes[j + 1] === 0x00 &&
        (isPrintableAscii(bytes[j]) || bytes[j] === 0x20)
      ) {
        name += String.fromCharCode(bytes[j]);
        j += 2;
      }
      const trimmed = name.trim();
      if (
        trimmed.length >= 3 &&
        trimmed.length <= 64 &&
        /^[A-Za-z][A-Za-z0-9_ ]*$/.test(trimmed) &&
        !trimmed.startsWith('MSys') &&
        !trimmed.startsWith('~') &&
        !/^(Form_|Report_|Macro_|Module_|Switchboard|AutoExec)/i.test(trimmed) &&
        !SYSTEM_STRINGS.has(trimmed) &&
        // Reject likely column/field names:
        !/[Ii]d$/.test(trimmed) &&            // UserId, ProjectId, WorkspaceId
        !/At$/.test(trimmed) &&               // CreatedAt, UpdatedAt
        !/On$/.test(trimmed) &&               // LoggedOn, CreatedOn
        !/^Is[A-Z]/.test(trimmed) &&          // IsActive, IsDeleted
        !/^Has[A-Z]/.test(trimmed) &&         // HasPassword
        // Reject strings where one char dominates (artifacts like DDDDDDDDDDB)
        !(() => {
          const counts: Record<string, number> = {};
          for (const ch of trimmed) counts[ch] = (counts[ch] ?? 0) + 1;
          return Math.max(...Object.values(counts)) / trimmed.length >= 0.5;
        })()
      ) {
        freq.set(trimmed, (freq.get(trimmed) ?? 0) + 1);
      }
      i = j;
    } else {
      i++;
    }
  }

  // Table names repeat throughout the file; single-occurrence strings are
  // almost always field names, enum values, or query fragments.
  // NOTE: MIN_FREQ kept at 3 — the regex guards above already reject the
  // common false positives (column names ending in Id/At/On, IsXxx, HasXxx,
  // repeated-char artifacts). Raising this higher silences real tables in
  // small ACCDB files where names only appear 3–4 times.
  const MIN_FREQ = 3;
  return [...freq.entries()]
    .filter(([, count]) => count >= MIN_FREQ)
    .sort((a, b) => b[1] - a[1])      // most-frequent first (likely real tables)
    .map(([name]) => name);
}

function isPrintableAscii(byte: number): boolean {
  return byte >= 0x21 && byte <= 0x7e;
}

/**
 * Parses an Access DB file buffer into a DatabaseSchema using mdb-reader.
 * Falls back to heuristic table-name extraction if mdb-reader cannot parse the file.
 * Returns null if the buffer does not appear to be a valid Jet database.
 */
export function parseAccessFile(
  _filename: string,
  buffer: ArrayBuffer,
): DatabaseSchema | null {
  if (!isAccessFile(buffer)) return null;

  // --- Primary path: use mdb-reader for accurate column metadata ---
  try {
    const reader = new MDBReader(Buffer.from(buffer));
    const tableNames = reader.getTableNames({ normalTables: true, systemTables: false, linkedTables: false });

    const tables: DatabaseTable[] = tableNames.map((name) => {
      const table = reader.getTable(name);
      const columns = table.getColumns().map((col) => ({
        name: col.name,
        type: col.type as string,
        nullable: col.nullable,
        // AutoNumber / AutoUUID columns are almost always the PK in Access databases
        isPrimaryKey: col.autoLong || col.autoUUID,
        isForeignKey: false,   // resolved below from MSysRelationships
        description: '',
      }));
      return { name, columns, description: '' };
    });

    // Populate FK metadata from MSysRelationships system table
    applyRelationships(reader, tables);

    return { source: 'access', tables };
  } catch {
    // --- Fallback: heuristic scan (covers edge cases mdb-reader can't parse) ---
    const tableNames = extractTableNames(buffer);
    const tables: DatabaseTable[] = tableNames.map((name) => ({
      name,
      columns: [],
      description: '',
    }));
    return { source: 'access', tables: tables.length > 0 ? tables : [] };
  }
}

/**
 * Reads MSysRelationships system table via mdb-reader and marks FK columns
 * on the already-built table list. Silently skips if the table is unavailable
 * (encrypted databases, older Jet 3 formats, etc.).
 *
 * Each row in MSysRelationships represents one column of a (potentially
 * multi-column) FK relationship:
 *   szObject           — child table  (the table holding the FK column)
 *   szReferencedObject — parent table (the table being referenced)
 *   szColumn           — FK column name in the child table
 *   szReferencedColumn — corresponding PK column name in the parent table
 */
function applyRelationships(reader: MDBReader, tables: DatabaseTable[]): void {
  try {
    const rows = reader.getTable('MSysRelationships').getData();
    for (const row of rows) {
      const childTableName = row['szObject'] as string | null | undefined;
      const parentTableName = row['szReferencedObject'] as string | null | undefined;
      const fkColName = row['szColumn'] as string | null | undefined;
      const pkColName = row['szReferencedColumn'] as string | null | undefined;

      if (!childTableName || !fkColName || !parentTableName) continue;

      const childTable = tables.find((t) => t.name === childTableName);
      if (!childTable) continue;

      const fkCol = childTable.columns.find((c) => c.name === fkColName);
      if (!fkCol) continue;

      fkCol.isForeignKey = true;
      fkCol.referencesTable = parentTableName;
      if (pkColName) fkCol.referencesColumn = pkColName;
    }
  } catch {
    // MSysRelationships not accessible — FK metadata stays false
  }
}

/**
 * Returns a human-readable relationship count placeholder.
 * (Full relationship parsing requires MSysRelationships page decoding)
 */
export function getRelationshipCount(buffer: ArrayBuffer): number {
  if (!isAccessFile(buffer)) return 0;
  try {
    const reader = new MDBReader(Buffer.from(buffer));
    const rows = reader.getTable('MSysRelationships').getData<{ szRelationship: string | null }>({
      columns: ['szRelationship'],
    });
    // Each FK relationship spans one *or more* rows (multi-column FKs have one row
    // per column). Count unique relationship names for the true relationship count.
    const unique = new Set(rows.map((r) => r.szRelationship).filter(Boolean));
    return unique.size;
  } catch {
    return 0;
  }
}

export type { DatabaseSchema };


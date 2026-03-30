import type { DatabaseSchema, DatabaseTable, DatabaseColumn } from '../../store/types';

/** Strip surrounding brackets: [dbo].[Users] → Users */
function stripBrackets(s: string): string {
  return s.replace(/\[([^\]]+)\]/g, '$1').replace(/^[a-z_]+\./i, '').trim();
}

/** Parse a single column-definition line (inside CREATE TABLE body) */
function parseColumnLine(line: string): DatabaseColumn | null {
  const trimmed = line.trim().replace(/,$/, '');
  if (!trimmed) return null;

  // Skip table-level constraints — handled separately
  if (/^CONSTRAINT\b/i.test(trimmed)) return null;
  if (/^PRIMARY\s+KEY\b/i.test(trimmed)) return null;
  if (/^FOREIGN\s+KEY\b/i.test(trimmed)) return null;
  if (/^UNIQUE\b/i.test(trimmed)) return null;
  if (/^INDEX\b/i.test(trimmed)) return null;
  if (/^CHECK\b/i.test(trimmed)) return null;

  // Column name (possibly bracketed)
  const nameMatch = /^\[?([A-Za-z_][A-Za-z0-9_ ]*)\]?/.exec(trimmed);
  if (!nameMatch) return null;
  const name = nameMatch[1].trim();

  // Rest after column name
  const rest = trimmed.slice(nameMatch[0].length).trim();

  // Type: everything up to the first keyword or constraint clause
  const typeMatch = /^([A-Za-z_][A-Za-z0-9_]*(?:\s*\([^)]*\))?)/.exec(rest);
  const type = typeMatch ? typeMatch[1].trim() : 'UNKNOWN';

  const upper = rest.toUpperCase();
  const nullable = !(/NOT\s+NULL\b/i.test(upper));
  const isPrimaryKey = /\bPRIMARY\s+KEY\b/i.test(upper);

  // Inline FK: REFERENCES [table]([col]) or REFERENCES table(col)
  let isForeignKey = false;
  let referencesTable: string | undefined;
  let referencesColumn: string | undefined;
  const refMatch = /\bREFERENCES\s+\[?([A-Za-z0-9_. \[\]]+?)\]?\s*\(\s*\[?([A-Za-z0-9_]+)\]?\s*\)/i.exec(rest);
  if (refMatch) {
    isForeignKey = true;
    referencesTable = stripBrackets(refMatch[1]);
    referencesColumn = stripBrackets(refMatch[2]);
  }

  return { name, type, nullable, isPrimaryKey, isForeignKey, referencesTable, referencesColumn };
}

/**
 * Parse a SQL script containing CREATE TABLE statements into a DatabaseSchema.
 * Handles SQL Server [bracket] notation and plain ANSI SQL.
 * Returns null if no tables are found.
 */
export function parseSqlFile(sql: string): DatabaseSchema | null {
  // Normalize line endings
  const text = sql.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Remove single-line comments
  const noComments = text.replace(/--[^\n]*/g, '');

  const tables: DatabaseTable[] = [];

  // Find each CREATE TABLE block
  // Matches: CREATE TABLE [optional_schema].[TableName] (  ...body...  )
  const createTableRe =
    /CREATE\s+TABLE\s+(?:\[?[A-Za-z0-9_]+\]?\.)?\[?([A-Za-z0-9_ ]+)\]?\s*\(([^;]*?)\)\s*(?:;|$)/gis;

  let match: RegExpExecArray | null;
  while ((match = createTableRe.exec(noComments)) !== null) {
    const rawName = match[1].trim();
    const tableName = stripBrackets(rawName);
    if (!tableName) continue;

    const body = match[2];
    const lines = body.split('\n');

    const columns: DatabaseColumn[] = [];

    // Track PK/FK columns declared at table level (CONSTRAINT ... PRIMARY KEY (col1, col2))
    const pkCols = new Set<string>();
    const fkMap = new Map<string, { table: string; col: string }>();

    // Two-pass approach: collect constraints first, then build columns
    const constraintPkRe =
      /CONSTRAINT\s+\[?[A-Za-z0-9_]+\]?\s+PRIMARY\s+KEY\s+\w*\s*\(([^)]+)\)/gi;
    const constraintFkRe =
      /CONSTRAINT\s+\[?[A-Za-z0-9_]+\]?\s+FOREIGN\s+KEY\s*\(([^)]+)\)\s+REFERENCES\s+\[?([A-Za-z0-9_.]+)\]?\s*\(\s*\[?([A-Za-z0-9_]+)\]?\s*\)/gi;

    let m: RegExpExecArray | null;
    while ((m = constraintPkRe.exec(body)) !== null) {
      for (const col of m[1].split(',')) pkCols.add(stripBrackets(col.trim()));
    }
    while ((m = constraintFkRe.exec(body)) !== null) {
      const fkColName = stripBrackets(m[1].replace(/[\[\]]/g, '').trim());
      fkMap.set(fkColName, {
        table: stripBrackets(m[2]),
        col: stripBrackets(m[3]),
      });
    }

    // Parse column lines
    for (const line of lines) {
      const col = parseColumnLine(line);
      if (!col) continue;
      if (pkCols.has(col.name)) col.isPrimaryKey = true;
      const fkInfo = fkMap.get(col.name);
      if (fkInfo) {
        col.isForeignKey = true;
        col.referencesTable = fkInfo.table;
        col.referencesColumn = fkInfo.col;
      }
      columns.push(col);
    }

    tables.push({ name: tableName, columns, description: '' });
  }

  if (tables.length === 0) return null;
  return { source: 'sql', tables };
}

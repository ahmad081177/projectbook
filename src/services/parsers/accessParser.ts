import type { DatabaseSchema, DatabaseTable } from '../../store/types';

// Jet database magic bytes (Access 97–2019 all share this signature)
const JET_MAGIC = [0x00, 0x01, 0x00, 0x00];

export function isAccessFile(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 4) return false;
  const view = new Uint8Array(buffer, 0, 4);
  return JET_MAGIC.every((b, i) => view[i] === b);
}

/**
 * Heuristically scans an Access MDB/ACCDB binary for user table names.
 *
 * Strategy: table names are stored as UTF-16LE strings in the internal
 * catalog pages. We find them by scanning for 2-byte-aligned ASCII
 * sequences of length ≥ 2, filtering out Jet system tables (MSys*).
 *
 * This is a best-effort scanner and may miss tables in heavily encrypted
 * or non-standard databases. The screenshot fallback handles those cases.
 */
export function extractTableNames(buffer: ArrayBuffer): string[] {
  const bytes = new Uint8Array(buffer);
  const names = new Set<string>();

  // Scan for UTF-16LE encoded strings that look like table names
  let i = 0;
  while (i < bytes.length - 2) {
    // Look for a sequence of printable ASCII chars encoded as UTF-16LE
    // (each char = 2 bytes; high byte = 0x00, low byte = printable ASCII)
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

      if (
        name.length >= 2 &&
        name.length <= 64 &&
        /^[A-Za-z_][A-Za-z0-9_ ]*$/.test(name) &&
        !name.startsWith('MSys') &&
        !name.startsWith('~') &&
        !name.startsWith('_') &&
        !/^(Form|Report|Macro|Module|Relationships|Switchboard|AutoExec)/i.test(name)
      ) {
        names.add(name.trim());
      }
      i = j;
    } else {
      i++;
    }
  }

  // Deduplicate and filter implausible entries
  return [...names].filter((n) => n.length >= 2);
}

function isPrintableAscii(byte: number): boolean {
  return byte >= 0x21 && byte <= 0x7e;
}

/**
 * Parses an Access DB file buffer into a DatabaseSchema.
 * Returns null if the file does not appear to be a valid Jet database.
 */
export function parseAccessFile(
  _filename: string,
  buffer: ArrayBuffer,
): DatabaseSchema | null {
  if (!isAccessFile(buffer)) return null;

  const tableNames = extractTableNames(buffer);

  // Build schema with table names only (column info requires full page parsing)
  const tables: DatabaseTable[] = tableNames.map((name) => ({
    name,
    columns: [], // populated by user or by Gemini vision on screenshots
    description: '',
  }));

  return {
    source: 'access',
    tables: tables.length > 0 ? tables : [],
  };
}

/**
 * Returns a human-readable relationship count placeholder.
 * (Full relationship parsing requires MSysRelationships page decoding)
 */
export function getRelationshipCount(_buffer: ArrayBuffer): number {
  // TODO: implement full MSysRelationships page parsing for v2
  return 0;
}

export type { DatabaseSchema };


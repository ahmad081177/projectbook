/**
 * Unit tests for extractColumnNames — Story 6-2
 */
import { describe, it, expect } from 'vitest';
import { extractColumnNames } from './accessParser';

/**
 * Build a minimal ArrayBuffer that contains UTF-16LE encoded strings.
 * Encodes each string as UTF-16LE and concatenates with a 0x01 separator byte
 * between groups.
 */
function encodeUtf16LE(strings: string[]): ArrayBuffer {
  const arrays = strings.map((s) => {
    const arr = new Uint8Array(s.length * 2);
    for (let i = 0; i < s.length; i++) {
      arr[i * 2] = s.charCodeAt(i);
      arr[i * 2 + 1] = 0x00;
    }
    return arr;
  });
  const total = arrays.reduce((n, a) => n + a.length + 2, 0); // +2 for separator bytes
  const buf = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) {
    buf.set(a, offset);
    offset += a.length;
    buf[offset] = 0x01; // non-ASCII separator
    buf[offset + 1] = 0x01;
    offset += 2;
  }
  return buf.buffer;
}

describe('extractColumnNames', () => {
  it('returns empty array for an empty buffer', () => {
    const result = extractColumnNames(new ArrayBuffer(0), 'Users');
    expect(result).toEqual([]);
  });

  it('returns empty array when tableName does not appear in buffer', () => {
    const buf = encodeUtf16LE(['Unrelated', 'SomeOtherText']);
    const result = extractColumnNames(buf, 'NonExistentTable');
    expect(result).toEqual([]);
  });

  it('finds column names that appear near the table name', () => {
    // Build a buffer that repeats [TableName, ColA, ColB] twice to hit freq >= 2
    const colA = 'UserId';
    const colB = 'UserName';
    const tableName = 'Users';

    // Repeat the sequence twice so ColA and ColB appear >= 2 times near tableName
    const buf = encodeUtf16LE([tableName, colA, colB, tableName, colA, colB]);
    const result = extractColumnNames(buf, tableName);

    // Both columns should be detected
    expect(result).toContain(colA);
    expect(result).toContain(colB);
  });

  it('excludes strings that appear only once per table occurrence (noise filter)', () => {
    // Build a buffer where:
    // - tableName appears ONCE, with TWO repeated strings nearby
    // - "OnceCandidate" appears only ONCE in the buffer at a position FAR away from tableName
    // Since tableName appears once, freq of nearby strings maxes at 1... wait
    // Actually in our encoding all strings are close together.
    // Better test: when tableName appears only once, ALL strings can only score freq=1.
    // So nothing should be returned (all freq < 2).
    const buf = encodeUtf16LE(['Users', 'MaybeCol', 'AnotherCol']);
    const result = extractColumnNames(buf, 'Users');
    // tableName appears only once, so no candidate can reach freq >= 2
    // (each candidate is seen at most once, within the single Users window)
    expect(result).toEqual([]);
  });

  it('caps results at 20 columns', () => {
    // Generate 25 distinct column names each appearing twice near the table name
    const tableName = 'BigTable';
    const cols: string[] = [];
    for (let i = 0; i < 25; i++) cols.push(`ColNum${i}`);
    const round1 = [tableName, ...cols];
    const round2 = [tableName, ...cols];
    const buf = encodeUtf16LE([...round1, ...round2]);
    const result = extractColumnNames(buf, tableName);
    expect(result.length).toBeLessThanOrEqual(20);
  });
});

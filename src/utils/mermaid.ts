import mermaid from 'mermaid';
import type { DatabaseTable } from '../store/types';

let initialized = false;

function ensureInit() {
  if (!initialized) {
    mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose' });
    initialized = true;
  }
}

/**
 * Renders a Mermaid diagram string to a PNG ArrayBuffer.
 * Uses an off-screen div + canvas; browser-only (do not call in tests/SSR).
 */
export async function mermaidToImageBuffer(code: string, options?: { width?: number; height?: number }): Promise<ArrayBuffer> {
  ensureInit();

  const id = `mermaid-render-${Date.now()}`;

  // Render SVG
  const { svg } = await mermaid.render(id, code);

  // Convert SVG string to data URL
  const svgBase64 = btoa(unescape(encodeURIComponent(svg)));
  const svgDataUrl = `data:image/svg+xml;base64,${svgBase64}`;

  // Draw SVG onto canvas
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = svgDataUrl;
  });

  const WIDTH = options?.width ?? 2400;
  const HEIGHT = options?.height ?? 1600;
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Preserve aspect ratio — scale to fit, center on white canvas
  const scale = Math.min(WIDTH / (img.naturalWidth || WIDTH), HEIGHT / (img.naturalHeight || HEIGHT));
  const scaledW = (img.naturalWidth || WIDTH) * scale;
  const scaledH = (img.naturalHeight || HEIGHT) * scale;
  const offsetX = (WIDTH - scaledW) / 2;
  const offsetY = (HEIGHT - scaledH) / 2;
  ctx.drawImage(img, offsetX, offsetY, scaledW, scaledH);

  // Convert to PNG ArrayBuffer
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob returned null'))), 'image/png');
  });

  return blob.arrayBuffer();
}

/**
 * Renders a DatabaseTable as a styled PNG table image directly on canvas.
 * Column order: FieldName | Type | PK/FK flags
 * (Mermaid erDiagram always puts type first, so we bypass it here.)
 */
export async function tableToImageBuffer(table: DatabaseTable): Promise<ArrayBuffer> {
  const SCALE = 2; // retina-quality
  const PADDING = 20 * SCALE;
  const HEADER_H = 44 * SCALE;
  const COL_HEADER_H = 32 * SCALE;
  const ROW_H = 30 * SCALE;
  const NAME_W = 180 * SCALE;
  const TYPE_W = 120 * SCALE;
  const FLAG_W = 80 * SCALE;
  const INNER_W = NAME_W + TYPE_W + FLAG_W;
  const WIDTH = INNER_W + PADDING * 2;
  const rows = table.columns;
  const HEIGHT = HEADER_H + COL_HEADER_H + rows.length * ROW_H + PADDING * 2;

  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // ── Entity name header ──────────────────────────────────────────────────
  ctx.fillStyle = '#1d4ed8';
  ctx.beginPath();
  ctx.roundRect(PADDING, PADDING, INNER_W, HEADER_H, [6 * SCALE, 6 * SCALE, 0, 0]);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${14 * SCALE}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(table.name, PADDING + INNER_W / 2, PADDING + HEADER_H / 2);

  // ── Column header row ───────────────────────────────────────────────────
  const colHdrY = PADDING + HEADER_H;
  ctx.fillStyle = '#dbeafe';
  ctx.fillRect(PADDING, colHdrY, INNER_W, COL_HEADER_H);

  ctx.fillStyle = '#1e3a8a';
  ctx.font = `bold ${11 * SCALE}px sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const midY = colHdrY + COL_HEADER_H / 2;
  ctx.fillText('Field Name', PADDING + 8 * SCALE, midY);
  ctx.fillText('Type', PADDING + NAME_W + 6 * SCALE, midY);
  ctx.fillText('Key', PADDING + NAME_W + TYPE_W + 6 * SCALE, midY);

  // ── Data rows ───────────────────────────────────────────────────────────
  for (let i = 0; i < rows.length; i++) {
    const col = rows[i];
    const rowY = colHdrY + COL_HEADER_H + i * ROW_H;

    ctx.fillStyle = i % 2 === 0 ? '#f8fafc' : '#ffffff';
    ctx.fillRect(PADDING, rowY, INNER_W, ROW_H);

    const cellMid = rowY + ROW_H / 2;
    ctx.font = `${11 * SCALE}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    // Field name — bold if PK
    ctx.fillStyle = col.isPrimaryKey ? '#92400e' : '#111827';
    if (col.isPrimaryKey) ctx.font = `bold ${11 * SCALE}px sans-serif`;
    ctx.fillText(col.name, PADDING + 8 * SCALE, cellMid);

    // Type
    ctx.fillStyle = '#6b7280';
    ctx.font = `${10 * SCALE}px monospace`;
    ctx.fillText(col.type || 'string', PADDING + NAME_W + 6 * SCALE, cellMid);

    // Key badge
    const flags: string[] = [];
    if (col.isPrimaryKey) flags.push('PK');
    if (col.isForeignKey) flags.push('FK');
    if (flags.length > 0) {
      const flagText = flags.join(' ');
      ctx.fillStyle = col.isPrimaryKey ? '#d97706' : '#059669';
      ctx.font = `bold ${10 * SCALE}px sans-serif`;
      ctx.fillText(flagText, PADDING + NAME_W + TYPE_W + 6 * SCALE, cellMid);
    }
  }

  // ── Table border ────────────────────────────────────────────────────────
  ctx.strokeStyle = '#93c5fd';
  ctx.lineWidth = 1.5 * SCALE;
  ctx.beginPath();
  ctx.roundRect(PADDING, PADDING, INNER_W, HEIGHT - PADDING * 2, 6 * SCALE);
  ctx.stroke();

  // ── Row separator lines ─────────────────────────────────────────────────
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 0.5 * SCALE;
  const tableBottom = PADDING + HEADER_H + COL_HEADER_H + rows.length * ROW_H;
  for (let i = 1; i < rows.length; i++) {
    const lineY = colHdrY + COL_HEADER_H + i * ROW_H;
    ctx.beginPath();
    ctx.moveTo(PADDING, lineY);
    ctx.lineTo(PADDING + INNER_W, lineY);
    ctx.stroke();
  }

  // ── Column separator lines ──────────────────────────────────────────────
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 0.5 * SCALE;
  const sepTop = colHdrY;
  [NAME_W, NAME_W + TYPE_W].forEach((offset) => {
    ctx.beginPath();
    ctx.moveTo(PADDING + offset, sepTop);
    ctx.lineTo(PADDING + offset, tableBottom);
    ctx.stroke();
  });

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob returned null'))), 'image/png');
  });
  return blob.arrayBuffer();
}

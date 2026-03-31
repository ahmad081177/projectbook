import mermaid from 'mermaid';
import type { CSharpClass, ProjectFile } from '../store/types';
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

// ─── C# class code image (VS Code Dark+ theme) ────────────────────────────

const C_BG       = '#1e1e1e';
const C_HEADER   = '#264f78';
const C_KEYWORD  = '#569cd6';   // public, class, void …
const C_TYPE     = '#4ec9b0';   // PascalCase types, built-ins
const C_PUNCT    = '#d4d4d4';   // operators, punctuation
const C_LINENUM  = '#858585';   // line-number gutter
const C_STAR     = '#d7ba7d';   // ★ key-method marker
const C_COMMENT  = '#6a9955';   // // comments

const CS_KEYWORDS = new Set([
  'namespace', 'class', 'interface', 'struct', 'enum',
  'public', 'private', 'protected', 'internal', 'static',
  'abstract', 'virtual', 'override', 'sealed', 'readonly', 'const',
  'async', 'await', 'void', 'get', 'set', 'return', 'new', 'partial',
  'using', 'base', 'this', 'null', 'true', 'false',
]);

const CS_BUILTIN = new Set([
  'string', 'int', 'bool', 'double', 'float', 'long', 'decimal',
  'byte', 'char', 'object', 'short', 'uint', 'ulong',
]);

type Token = { text: string; color: string };

function tokenizeCodeLine(line: string): Token[] {
  const trimmed = line.trimStart();
  if (trimmed.startsWith('//')) {
    return [{ text: line, color: C_COMMENT }];
  }

  const tokens: Token[] = [];
  let remaining = line;

  // ★ key-snippet marker
  const starIdx = line.indexOf('★');
  if (starIdx !== -1) {
    if (starIdx > 0) tokens.push({ text: line.slice(0, starIdx), color: C_PUNCT });
    tokens.push({ text: '★ ', color: C_STAR });
    remaining = line.slice(starIdx + 2); // skip "★ "
  }

  const re = /([A-Za-z_][A-Za-z0-9_]*)|([^A-Za-z_]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(remaining)) !== null) {
    const word = m[1];
    const other = m[2];
    if (word) {
      if (CS_KEYWORDS.has(word))       tokens.push({ text: word, color: C_KEYWORD });
      else if (CS_BUILTIN.has(word))   tokens.push({ text: word, color: C_TYPE });
      else if (/^[A-Z]/.test(word))    tokens.push({ text: word, color: C_TYPE });
      else                             tokens.push({ text: word, color: C_PUNCT });
    } else {
      tokens.push({ text: other, color: C_PUNCT });
    }
  }
  return tokens;
}

function buildClassCodeLines(cls: CSharpClass): string[] {
  const lines: string[] = [];
  const i1 = '    ';   // namespace-level indent
  const i2 = '        '; // member indent
  const ns = !!cls.namespace;

  if (ns) {
    lines.push(`namespace ${cls.namespace}`);
    lines.push('{');
  }

  const typeKwd = cls.isInterface ? 'interface' : 'class';
  const modParts = [cls.accessModifier, cls.isAbstract ? 'abstract' : '', typeKwd].filter(Boolean);
  const bases = [cls.baseClass ?? '', ...cls.interfaces].filter(Boolean);
  const ext = bases.length > 0 ? ` : ${bases.join(', ')}` : '';
  lines.push(`${ns ? i1 : ''}${modParts.join(' ')} ${cls.name}${ext}`);
  lines.push(`${ns ? i1 : ''}{`);

  if (cls.fields.length > 0) {
    lines.push(`${i2}// Fields`);
    for (const f of cls.fields) {
      lines.push(`${i2}${f.accessModifier} ${f.type} ${f.name};`);
    }
  }

  if (cls.properties.length > 0) {
    if (cls.fields.length > 0) lines.push('');
    lines.push(`${i2}// Properties`);
    for (const p of cls.properties) {
      lines.push(`${i2}${p.accessModifier} ${p.type} ${p.name} { get; set; }`);
    }
  }

  if (cls.methods.length > 0) {
    if (cls.fields.length > 0 || cls.properties.length > 0) lines.push('');
    lines.push(`${i2}// Methods`);
    const sorted = [
      ...cls.methods.filter((m) => m.isKeySnippet),
      ...cls.methods.filter((m) => !m.isKeySnippet),
    ];
    for (const method of sorted) {
      const star = method.isKeySnippet ? '★ ' : '';
      lines.push(
        `${i2}${star}${method.accessModifier} ${method.returnType} ${method.name}(${method.parameters.join(', ')})`,
      );
    }
  }

  lines.push(`${ns ? i1 : ''}}`);;
  if (ns) lines.push('}');
  return lines;
}

/**
 * Renders a CSharpClass as a VS Code Dark+-themed PNG code image.
 * Returns { data, docxWidth, docxHeight } so the caller can embed it at
 * exactly the right size in the Word document.
 * Browser-only — do not call in tests/SSR.
 */
export async function classToImageBuffer(
  cls: CSharpClass,
): Promise<{ data: ArrayBuffer; docxWidth: number; docxHeight: number }> {
  const SCALE    = 2;
  const FONT_PX  = 13 * SCALE;
  const LINE_H   = 22 * SCALE;
  const PAD_X    = 14 * SCALE;
  const PAD_Y    = 14 * SCALE;
  const LNUM_W   = 38 * SCALE;  // line-number gutter
  const MAX_LINES = 150;

  const allLines  = buildClassCodeLines(cls);
  const truncated = allLines.length > MAX_LINES;
  const lines     = truncated
    ? [...allLines.slice(0, MAX_LINES), `        // … ${allLines.length - MAX_LINES} more lines`]
    : allLines;

  const HEADER_H = 44 * SCALE;
  const WIDTH    = 680 * SCALE;
  const HEIGHT   = HEADER_H + PAD_Y + lines.length * LINE_H + PAD_Y;

  const canvas = document.createElement('canvas');
  canvas.width  = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D unavailable');

  const monoFont = `${FONT_PX}px Consolas, "Courier New", monospace`;

  // Background
  ctx.fillStyle = C_BG;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Header bar (class name)
  ctx.fillStyle = C_HEADER;
  ctx.fillRect(0, 0, WIDTH, HEADER_H);
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${15 * SCALE}px Consolas, "Courier New", monospace`;
  ctx.textAlign  = 'left';
  ctx.textBaseline = 'middle';
  const badges = [
    cls.isAbstract  ? 'abstract'  : '',
    cls.isInterface ? 'interface' : '',
  ]
    .filter(Boolean)
    .join(', ');
  ctx.fillText(
    badges ? `${cls.name}  (${badges})` : cls.name,
    PAD_X + LNUM_W + 8 * SCALE,
    HEADER_H / 2,
  );

  // Vertical gutter separator (drawn once)
  ctx.strokeStyle = '#3a3a3a';
  ctx.lineWidth   = 1 * SCALE;
  ctx.beginPath();
  ctx.moveTo(PAD_X + LNUM_W, HEADER_H);
  ctx.lineTo(PAD_X + LNUM_W, HEIGHT - PAD_Y);
  ctx.stroke();

  // Code lines
  ctx.font = monoFont;
  for (let i = 0; i < lines.length; i++) {
    const rowY = HEADER_H + PAD_Y + i * LINE_H;
    const midY = rowY + LINE_H / 2;

    // Subtle alternating row
    if (i % 2 === 0) {
      ctx.fillStyle = '#1f2226';
      ctx.fillRect(0, rowY, WIDTH, LINE_H);
    }

    // Line number
    ctx.fillStyle  = C_LINENUM;
    ctx.textAlign  = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${i + 1}`, PAD_X + LNUM_W - 8 * SCALE, midY);

    // Tokenised code content
    const tokens = tokenizeCodeLine(lines[i]);
    let x = PAD_X + LNUM_W + 8 * SCALE;
    ctx.textAlign = 'left';
    for (const tok of tokens) {
      ctx.fillStyle = tok.color;
      ctx.font = monoFont;
      ctx.fillText(tok.text, x, midY);
      x += ctx.measureText(tok.text).width;
    }
  }

  // Outer border
  ctx.strokeStyle = '#3c3c3c';
  ctx.lineWidth   = 1 * SCALE;
  ctx.strokeRect(0, 0, WIDTH, HEIGHT);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('classToImageBuffer: toBlob returned null'))),
      'image/png',
    );
  });

  return {
    data:       await blob.arrayBuffer(),
    docxWidth:  Math.round(WIDTH  / SCALE),
    docxHeight: Math.round(HEIGHT / SCALE),
  };
}

// ─── Non-C# project file code image (VS Code Dark+ theme) ─────────────

const HTML_KEYWORDS = new Set([
  'html', 'head', 'body', 'div', 'span', 'form', 'input', 'button', 'table',
  'tr', 'td', 'th', 'thead', 'tbody', 'a', 'img', 'p', 'h1', 'h2', 'h3',
  'label', 'select', 'option', 'textarea', 'script', 'style', 'link', 'meta',
  'asp:textbox', 'asp:button', 'asp:label', 'asp:gridview', 'asp:dropdownlist',
  'asp:repeater', 'asp:datalist', 'asp:panel', 'asp:placeholder',
  'asp:content', 'asp:contentplaceholder', 'asp:mastertype',
]);

const JS_KEYWORDS = new Set([
  'function', 'var', 'let', 'const', 'if', 'else', 'for', 'while', 'return',
  'new', 'this', 'class', 'extends', 'import', 'export', 'default', 'from',
  'async', 'await', 'try', 'catch', 'throw', 'true', 'false', 'null', 'undefined',
  'typeof', 'instanceof', 'switch', 'case', 'break', 'continue',
]);

const XML_KEYWORDS = new Set([
  'configuration', 'appsettings', 'connectionstrings', 'add', 'remove', 'clear',
  'system', 'compilation', 'httpruntime', 'authentication', 'authorization',
  'customErrors', 'globalization', 'pages', 'controls', 'httphandlers',
]);

type FileTokenColor = { text: string; color: string };

function tokenizeFileLine(line: string, ext: string): FileTokenColor[] {
  const trimmed = line.trimStart();

  // Comments
  if (trimmed.startsWith('//') || trimmed.startsWith('<!--') || trimmed.startsWith('/*')) {
    return [{ text: line, color: C_COMMENT }];
  }

  const tokens: FileTokenColor[] = [];
  const isMarkup = ['.aspx', '.master', '.cshtml', '.config'].includes(ext);
  const isJs = ext === '.js';
  const isCss = ext === '.css';

  if (isMarkup) {
    // Simple XML/HTML tokenizer
    const re = /(<\/?[\w:.]+|>|\/>|[\w-]+="[^"]*"|[^<>]+)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(line)) !== null) {
      const part = m[1];
      if (part.startsWith('<')) {
        const tagName = part.replace(/^<\/?/, '').toLowerCase();
        tokens.push({ text: part, color: HTML_KEYWORDS.has(tagName) || XML_KEYWORDS.has(tagName) ? C_KEYWORD : C_TYPE });
      } else if (part === '>' || part === '/>') {
        tokens.push({ text: part, color: C_KEYWORD });
      } else if (part.includes('=')) {
        const eq = part.indexOf('=');
        tokens.push({ text: part.slice(0, eq), color: C_TYPE });
        tokens.push({ text: part.slice(eq), color: '#ce9178' }); // string color
      } else {
        tokens.push({ text: part, color: C_PUNCT });
      }
    }
  } else if (isJs) {
    const re = /([A-Za-z_$][A-Za-z0-9_$]*)|('[^']*'|"[^"]*"|`[^`]*`)|([^A-Za-z_$'"`]+)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(line)) !== null) {
      const word = m[1];
      const str = m[2];
      const other = m[3];
      if (word) {
        tokens.push({ text: word, color: JS_KEYWORDS.has(word) ? C_KEYWORD : /^[A-Z]/.test(word) ? C_TYPE : C_PUNCT });
      } else if (str) {
        tokens.push({ text: str, color: '#ce9178' });
      } else if (other) {
        tokens.push({ text: other, color: C_PUNCT });
      }
    }
  } else if (isCss) {
    // Simple CSS tokenizer
    if (trimmed.match(/^[.#@:[\w-]/)) {
      tokens.push({ text: line, color: C_TYPE }); // selectors
    } else if (trimmed.includes(':')) {
      const colon = line.indexOf(':');
      tokens.push({ text: line.slice(0, colon), color: C_KEYWORD });
      tokens.push({ text: line.slice(colon), color: '#ce9178' });
    } else {
      tokens.push({ text: line, color: C_PUNCT });
    }
  } else {
    tokens.push({ text: line, color: C_PUNCT });
  }

  return tokens.length > 0 ? tokens : [{ text: line, color: C_PUNCT }];
}

/**
 * Renders a ProjectFile as a VS Code Dark+-themed PNG code image.
 * Browser-only — do not call in tests/SSR.
 */
export async function fileToImageBuffer(
  file: ProjectFile,
): Promise<{ data: ArrayBuffer; docxWidth: number; docxHeight: number }> {
  const SCALE    = 2;
  const FONT_PX  = 13 * SCALE;
  const LINE_H   = 22 * SCALE;
  const PAD_X    = 14 * SCALE;
  const PAD_Y    = 14 * SCALE;
  const LNUM_W   = 38 * SCALE;
  const MAX_LINES = 120;

  const allLines = file.content.split('\n');
  const truncated = allLines.length > MAX_LINES;
  const lines = truncated
    ? [...allLines.slice(0, MAX_LINES), `  // … ${allLines.length - MAX_LINES} more lines`]
    : allLines;

  const HEADER_H = 44 * SCALE;
  const WIDTH    = 680 * SCALE;
  const HEIGHT   = HEADER_H + PAD_Y + lines.length * LINE_H + PAD_Y;

  const canvas = document.createElement('canvas');
  canvas.width  = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D unavailable');

  const monoFont = `${FONT_PX}px Consolas, "Courier New", monospace`;

  // Background
  ctx.fillStyle = C_BG;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Header bar (file name)
  ctx.fillStyle = C_HEADER;
  ctx.fillRect(0, 0, WIDTH, HEADER_H);
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${15 * SCALE}px Consolas, "Courier New", monospace`;
  ctx.textAlign  = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(file.fileName, PAD_X + LNUM_W + 8 * SCALE, HEADER_H / 2);

  // Vertical gutter separator
  ctx.strokeStyle = '#3a3a3a';
  ctx.lineWidth   = 1 * SCALE;
  ctx.beginPath();
  ctx.moveTo(PAD_X + LNUM_W, HEADER_H);
  ctx.lineTo(PAD_X + LNUM_W, HEIGHT - PAD_Y);
  ctx.stroke();

  // Code lines
  ctx.font = monoFont;
  for (let i = 0; i < lines.length; i++) {
    const rowY = HEADER_H + PAD_Y + i * LINE_H;
    const midY = rowY + LINE_H / 2;

    if (i % 2 === 0) {
      ctx.fillStyle = '#1f2226';
      ctx.fillRect(0, rowY, WIDTH, LINE_H);
    }

    // Line number
    ctx.fillStyle  = C_LINENUM;
    ctx.textAlign  = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${i + 1}`, PAD_X + LNUM_W - 8 * SCALE, midY);

    // Tokenised code content
    const tokens = tokenizeFileLine(lines[i], file.extension);
    let x = PAD_X + LNUM_W + 8 * SCALE;
    ctx.textAlign = 'left';
    for (const tok of tokens) {
      ctx.fillStyle = tok.color;
      ctx.font = monoFont;
      ctx.fillText(tok.text, x, midY);
      x += ctx.measureText(tok.text).width;
    }
  }

  // Outer border
  ctx.strokeStyle = '#3c3c3c';
  ctx.lineWidth   = 1 * SCALE;
  ctx.strokeRect(0, 0, WIDTH, HEIGHT);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('fileToImageBuffer: toBlob returned null'))),
      'image/png',
    );
  });

  return {
    data:       await blob.arrayBuffer(),
    docxWidth:  Math.round(WIDTH  / SCALE),
    docxHeight: Math.round(HEIGHT / SCALE),
  };
}

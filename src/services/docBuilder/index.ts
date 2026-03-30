import {
  Document,
  ImageRun,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  PageBreak,
  AlignmentType,
} from 'docx';
import { RTL_PARA, HEBREW_RUN, HEADING1_RUN, HEADING2_RUN, HEADING3_RUN, HEADING4_RUN } from './styles';
import { mermaidToImageBuffer } from '../../utils/mermaid';
import type { ChapterKey, CSharpClass, DatabaseTable } from '../../store/types';

// ─── Types ────────────────────────────────────────────────────────────────

export interface BuildDocumentInput {
  studentName: string;
  language: 'he' | 'ar';
  generatedContent: Record<ChapterKey, { content: string; status: string }>;
  diagrams: {
    uml: { mermaidCode: string; status: string };
    erd: { mermaidCode: string; status: string };
  };
  screenshotFiles?: Array<{
    arrayBuffer: ArrayBuffer;
    screenName: string;
    caption: string;
    userType: 'admin' | 'regular' | 'both';
  }>;
  tables?: DatabaseTable[];
  classes?: CSharpClass[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function rtlParagraph(text: string): Paragraph {
  return new Paragraph({
    ...RTL_PARA,
    children: [new TextRun({ ...HEBREW_RUN, text })],
  });
}

function chapterHeading(text: string, level: 1 | 2 = 1): Paragraph {
  const runStyle = level === 1 ? HEADING1_RUN : HEADING2_RUN;
  return new Paragraph({
    ...RTL_PARA,
    heading: level === 1 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ ...runStyle, text })],
  });
}

function splitIntoParagraphs(text: string): Paragraph[] {
  return text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => rtlParagraph(block));
}

// ─── Inline markdown parser (Story 8-3) ──────────────────────────────────

export function parseInlineMarkdown(text: string): TextRun[] {
  const runs: TextRun[] = [];
  // Match bold-italic (**_..._**), bold (**...**), underline (__...__),
  // italic (_..._  or  *...*), and plain text
  const pattern = /(\*\*_[\s\S]+?_\*\*|\*\*[\s\S]+?\*\*|__[^_]+__|_[^_]+_|\*[^*]+\*|[^*_]+)/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    const seg = match[1];
    if (!seg) continue;
    if (/^\*\*_[\s\S]+?_\*\*$/.test(seg)) {
      runs.push(new TextRun({ ...HEBREW_RUN, bold: true, italics: true, text: seg.slice(3, -3) }));
    } else if (/^\*\*[\s\S]+?\*\*$/.test(seg)) {
      runs.push(new TextRun({ ...HEBREW_RUN, bold: true, text: seg.slice(2, -2) }));
    } else if (/^__[^_]+__$/.test(seg)) {
      runs.push(new TextRun({ ...HEBREW_RUN, underline: {}, text: seg.slice(2, -2) }));
    } else if (/^_[^_]+_$/.test(seg) || /^\*[^*]+\*$/.test(seg)) {
      runs.push(new TextRun({ ...HEBREW_RUN, italics: true, text: seg.slice(1, -1) }));
    } else {
      runs.push(new TextRun({ ...HEBREW_RUN, text: seg }));
    }
  }
  return runs.length > 0 ? runs : [new TextRun({ ...HEBREW_RUN, text })];
}

export function markdownToDocxParagraphs(text: string): Paragraph[] {
  const lines = text.split('\n');
  const paragraphs: Paragraph[] = [];
  let block: string[] = [];

  const flushBlock = () => {
    if (!block.length) return;
    const joined = block.join('\n').trim();
    block = [];
    if (!joined) return;
    paragraphs.push(new Paragraph({ ...RTL_PARA, children: parseInlineMarkdown(joined) }));
  };

  for (const raw of lines) {
    const line = raw.trimEnd();

    // Skip horizontal rules
    if (/^---+$/.test(line)) { flushBlock(); continue; }

    // Heading levels
    const h4 = line.match(/^####\s+(.*)/);
    const h3 = line.match(/^###\s+(.*)/);
    const h2 = line.match(/^##\s+(.*)/);
    if (h2 || h3 || h4) {
      flushBlock();
      const matched = (h2 ?? h3 ?? h4)!;
      const level = h4 ? 4 : h3 ? 3 : 2;
      const headingLevel = level === 2 ? HeadingLevel.HEADING_2 : level === 3 ? HeadingLevel.HEADING_3 : HeadingLevel.HEADING_4;
      const runStyle = level === 2 ? HEADING2_RUN : level === 3 ? HEADING3_RUN : HEADING4_RUN;
      paragraphs.push(new Paragraph({
        ...RTL_PARA,
        heading: headingLevel,
        children: [new TextRun({ ...runStyle, text: matched[1] })],
      }));
      continue;
    }

    // Bullet items
    if (/^[-•]\s+/.test(line)) {
      flushBlock();
      paragraphs.push(new Paragraph({
        ...RTL_PARA,
        indent: { right: 720 },
        children: parseInlineMarkdown('• ' + line.replace(/^[-•]\s+/, '')),
      }));
      continue;
    }

    // Blank line = paragraph break
    if (line === '') { flushBlock(); continue; }

    block.push(line);
  }
  flushBlock();
  return paragraphs;
}

function pageBreak(): Paragraph {
  return new Paragraph({ ...RTL_PARA, children: [new PageBreak()] });
}

// ─── User Guide with embedded screenshots ─────────────────────────────────

const USER_TYPE_HE: Record<'admin' | 'regular' | 'both', string> = {
  admin: 'מנהל',
  regular: 'משתמש',
  both: 'מנהל ומשתמש',
};

function buildUserGuideWithScreenshots(
  content: string,
  status: string,
  screenshotFiles: BuildDocumentInput['screenshotFiles'],
): Paragraph[] {
  const base: Paragraph[] = [pageBreak(), chapterHeading(CHAPTER_TITLES.userGuide)];

  if (status === 'failed' || !content.trim()) {
    base.push(rtlParagraph('[פרק זה לא נוצר — השלם ידנית בWord]'));
  } else {
    base.push(...markdownToDocxParagraphs(content));
  }

  if (!screenshotFiles || screenshotFiles.length === 0) return base;

  base.push(chapterHeading('צילומי מסך', 2));
  for (const ss of screenshotFiles) {
    base.push(chapterHeading(ss.screenName, 2));
    try {
      base.push(
        new Paragraph({
          ...RTL_PARA,
          children: [
            new ImageRun({
              type: 'png',
              data: ss.arrayBuffer,
              transformation: { width: 480, height: 320 },
            }),
          ],
        }),
      );
    } catch {
      base.push(rtlParagraph(`[תמונה: ${ss.screenName}]`));
    }
    if (ss.caption) {
      base.push(
        new Paragraph({
          ...RTL_PARA,
          children: [new TextRun({ ...HEBREW_RUN, italics: true, text: ss.caption })],
        }),
      );
    }
    base.push(
      new Paragraph({
        ...RTL_PARA,
        children: [
          new TextRun({ ...HEBREW_RUN, italics: true, size: 20, color: '6B7280',
            text: `(סוג משתמש: ${USER_TYPE_HE[ss.userType]})` }),
        ],
      }),
    );
  }

  return base;
}

// ─── Chapter builders ──────────────────────────────────────────────────────

const CHAPTER_TITLES: Record<ChapterKey, string> = {
  introduction: 'מבוא',
  techStack: 'סקירת טכנולוגיות',
  systemAnalysis: 'ניתוח מערכת',
  database: 'מסד נתונים',
  serverImplementation: 'מימוש צד שרת',
  clientImplementation: 'מימוש צד לקוח',
  userGuide: 'מדריך משתמש',
  reflection: 'רפלקסיה',
  difficulties: 'קשיים ופתרונות',
  whatNext: 'פיתוחים עתידיים',
  appendices: 'נספחים',
};

const CHAPTER_ORDER: ChapterKey[] = [
  'introduction',
  'techStack',
  'systemAnalysis',
  'database',
  'serverImplementation',
  'clientImplementation',
  'userGuide',
  'reflection',
  'difficulties',
  'whatNext',
  'appendices',
];

function buildChapterSection(key: ChapterKey, content: string, status: string): Paragraph[] {
  const paragraphs: Paragraph[] = [
    pageBreak(),
    chapterHeading(CHAPTER_TITLES[key]),
  ];

  if (status === 'failed' || !content.trim()) {
    paragraphs.push(rtlParagraph('[פרק זה לא נוצר — השלם ידנית בWord]'));
  } else {
    paragraphs.push(...markdownToDocxParagraphs(content));
  }

  return paragraphs;
}

// Intro chapter — appends the first screenshot (if available) after the text
function buildIntroWithScreenshot(
  content: string,
  status: string,
  firstScreenshot: { arrayBuffer: ArrayBuffer; screenName: string } | undefined,
): Paragraph[] {
  const paragraphs = buildChapterSection('introduction', content, status);
  if (firstScreenshot) {
    try {
      paragraphs.push(
        new Paragraph({ ...RTL_PARA, spacing: { before: 240 }, children: [] }),
        new Paragraph({
          ...RTL_PARA,
          alignment: AlignmentType.CENTER,
          children: [
            new ImageRun({
              type: 'png',
              data: firstScreenshot.arrayBuffer,
              transformation: { width: 420, height: 280 },
            }),
          ],
        }),
        new Paragraph({
          ...RTL_PARA,
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ ...HEBREW_RUN, italics: true, size: 18, color: '6B7280', text: firstScreenshot.screenName }),
          ],
        }),
      );
    } catch { /* skip image if it fails */ }
  }
  return paragraphs;
}

// ─── Database section with per-table sub-sections + ERD ─────────────────

/**
 * Generates a single-table erDiagram Mermaid code for a given table.
 * Used to produce a per-table screenshot in the database chapter.
 */
function tableToSingleErDiagram(table: DatabaseTable): string {
  if (table.columns.length === 0) {
    return `erDiagram\n  ${table.name} {\n    string id\n  }`;
  }
  const fields = table.columns
    .map((c) => {
      const flags = [
        c.isPrimaryKey ? 'PK' : '',
        c.isForeignKey ? 'FK' : '',
      ]
        .filter(Boolean)
        .join(' ');
      return `    ${c.type || 'string'} ${c.name}${flags ? ' "' + flags + '"' : ''}`;
    })
    .join('\n');
  return `erDiagram\n  ${table.name} {\n${fields}\n  }`;
}

async function buildDatabaseSection(
  content: string,
  status: string,
  tables: DatabaseTable[],
  erdCode: string,
  erdStatus: string,
): Promise<Paragraph[]> {
  const paragraphs: Paragraph[] = [
    pageBreak(),
    chapterHeading(CHAPTER_TITLES.database),
  ];

  if (status === 'failed' || !content.trim()) {
    paragraphs.push(rtlParagraph('[פרק זה לא נוצר — השלם ידנית בWord]'));
  } else {
    paragraphs.push(...splitIntoParagraphs(content));
  }

  // ── Per-table sub-sections ──────────────────────────────────────────────
  if (tables.length > 0) {
    paragraphs.push(chapterHeading('מבנה הטבלאות', 2));

    for (const table of tables) {
      paragraphs.push(chapterHeading(table.name, 2));

      if (table.description) {
        paragraphs.push(rtlParagraph(table.description));
      }

      if (table.columns.length > 0) {
        // Column list
        for (const col of table.columns) {
          const parts: string[] = [`${col.name} (${col.type})` ];
          if (col.isPrimaryKey) parts.push('מפתח ראשי');
          if (col.isForeignKey) parts.push(`מפתח זר ← ${col.referencesTable ?? '?'}`);
          if (!col.nullable) parts.push('חובה');
          if (col.description) parts.push(col.description);
          paragraphs.push(
            new Paragraph({
              ...RTL_PARA,
              indent: { right: 720 },
              children: [new TextRun({ ...HEBREW_RUN, text: `• ${parts.join(' | ')}` })],
            }),
          );
        }

        // Per-table ERD screenshot (high quality, one table only)
        const mermaidCode = tableToSingleErDiagram(table);
        try {
          const buf = await mermaidToImageBuffer(mermaidCode);
          paragraphs.push(
            new Paragraph({
              ...RTL_PARA,
              alignment: AlignmentType.CENTER,
              spacing: { before: 160, after: 160 },
              children: [
                new ImageRun({ type: 'png', data: buf, transformation: { width: 420, height: 280 } }),
              ],
            }),
          );
        } catch { /* skip diagram on render failure */ }
      } else {
        paragraphs.push(rtlParagraph('[עמודות לא זוהו — הוסף תיאור ידנית]'));
      }
    }
  }

  // ── Relations sub-section ───────────────────────────────────────────────
  paragraphs.push(chapterHeading('יחסים בין הטבלאות', 2));

  // List FK relations derived from schema
  const relations = tables.flatMap((t) =>
    t.columns
      .filter((c) => c.isForeignKey && c.referencesTable)
      .map(
        (c) =>
          `${t.name}.${c.name} → ${c.referencesTable}${
            c.referencesColumn ? `.${c.referencesColumn}` : ''
          }`,
      ),
  );
  if (relations.length > 0) {
    for (const rel of relations) {
      paragraphs.push(
        new Paragraph({
          ...RTL_PARA,
          indent: { right: 720 },
          children: [new TextRun({ ...HEBREW_RUN, text: `• ${rel}` })],
        }),
      );
    }
  }

  if (erdStatus === 'complete' && erdCode) {
    paragraphs.push(chapterHeading('דיאגרמת ERD — כל הטבלאות', 2));
    try {
      const buf = await mermaidToImageBuffer(erdCode);
      paragraphs.push(
        new Paragraph({
          ...RTL_PARA,
          alignment: AlignmentType.CENTER,
          spacing: { before: 160 },
          children: [
            new ImageRun({ type: 'png', data: buf, transformation: { width: 580, height: 400 } }),
          ],
        }),
      );
    } catch {
      paragraphs.push(rtlParagraph('[דיאגרמת ERD לא ניתנת לרינדור — הוסף ידנית]'));
    }
  } else {
    paragraphs.push(rtlParagraph('[דיאגרמת ERD לא נוצרה — הוסף ידנית]'));
  }

  return paragraphs;
}

// buildDiagramsSection removed — UML is no longer generated, and the full ERD
// is rendered inside buildDatabaseSection (per-table + full-schema screenshots).

// ─── C# Classes section ─────────────────────────────────────────────────

function codeLineParagraph(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    children: [
      new TextRun({
        text,
        font: 'Courier New',
        size: 18, // 9pt in half-points
        rightToLeft: false,
      }),
    ],
  });
}

function classBlock(cls: CSharpClass): Paragraph[] {
  const paras: Paragraph[] = [];

  // H2 heading: ClassName + abstract/interface badge
  const badges = [cls.isAbstract ? 'abstract' : '', cls.isInterface ? 'interface' : '']
    .filter(Boolean)
    .join(', ');
  const headingText = badges ? `${cls.name} (${badges})` : cls.name;
  paras.push(chapterHeading(headingText, 2));

  // Namespace
  if (cls.namespace) {
    paras.push(rtlParagraph(`מרחב שמות: ${cls.namespace}`));
  }

  // Base class / interfaces
  const bases = [cls.baseClass ?? '', ...cls.interfaces].filter(Boolean);
  if (bases.length > 0) {
    paras.push(rtlParagraph(`יורשת מ: ${bases.join(', ')}`));
  }

  // Class description from xmlDocComment or placeholder
  const classDesc = cls.xmlDocComment?.trim() || 'מחלקה זו מהווה חלק ממערכת הפרויקט';
  paras.push(rtlParagraph(classDesc));

  // Properties & fields as code lines
  const members = [
    ...cls.fields.map((f) => `${f.accessModifier} ${f.type} ${f.name}`),
    ...cls.properties.map((p) => `${p.accessModifier} ${p.type} ${p.name} { get; set; }`),
  ];
  if (members.length > 0) {
    paras.push(chapterHeading('שדות ומאפיינים', 2));
    members.forEach((line) => paras.push(codeLineParagraph(line)));
  }

  // Methods — key methods first, then the rest
  if (cls.methods.length > 0) {
    paras.push(chapterHeading('פעולות', 2));
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

function buildCSharpSection(classes: CSharpClass[]): Paragraph[] {
  const visible = classes.filter((c) => !c.isExcluded);
  if (visible.length === 0) return [];

  return [
    pageBreak(),
    chapterHeading('מבנה המחלקות (C#)'),
    ...visible.flatMap((cls) => classBlock(cls)),
  ];
}

// ─── Public API: build & download ────────────────────────────────────────

/**
 * Appends one optional screenshot (story 8-4) after a chapter's text paragraphs.
 * Used to distribute screenshots across System Analysis, Server, and Client chapters.
 */
function appendOptionalScreenshot(
  paragraphs: Paragraph[],
  screenshot: { arrayBuffer: ArrayBuffer; screenName: string; caption: string; userType: 'admin' | 'regular' | 'both' } | undefined,
): void {
  if (!screenshot) return;
  paragraphs.push(
    new Paragraph({
      ...RTL_PARA,
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun({ ...HEADING2_RUN, text: screenshot.screenName })],
    }),
  );
  try {
    paragraphs.push(
      new Paragraph({
        ...RTL_PARA,
        alignment: AlignmentType.CENTER,
        children: [
          new ImageRun({
            type: 'png',
            data: screenshot.arrayBuffer,
            transformation: { width: 420, height: 280 },
          }),
        ],
      }),
    );
  } catch { /* skip image on failure */ }
  if (screenshot.caption) {
    paragraphs.push(
      new Paragraph({
        ...RTL_PARA,
        children: [new TextRun({ ...HEBREW_RUN, italics: true, text: screenshot.caption })],
      }),
    );
  }
  paragraphs.push(
    new Paragraph({
      ...RTL_PARA,
      children: [new TextRun({
        ...HEBREW_RUN, italics: true, size: 20, color: '6B7280',
        text: `(סוג משתמש: ${USER_TYPE_HE[screenshot.userType]})`,
      })],
    }),
  );
}

export async function buildAndDownloadDocument(input: BuildDocumentInput): Promise<void> {
  const coverParagraphs: Paragraph[] = [
    new Paragraph({
      ...RTL_PARA,
      alignment: AlignmentType.CENTER,
      spacing: { before: 2880 },
      children: [new TextRun({ ...HEBREW_RUN, bold: true, size: 40, text: 'ספר פרויקט' })],
    }),
    new Paragraph({
      ...RTL_PARA,
      alignment: AlignmentType.CENTER,
      spacing: { before: 480 },
      children: [new TextRun({ ...HEBREW_RUN, size: 28, text: `[שם הפרויקט]` })],
    }),
    new Paragraph({
      ...RTL_PARA,
      alignment: AlignmentType.CENTER,
      spacing: { before: 240 },
      children: [new TextRun({ ...HEBREW_RUN, size: 24, text: `${input.studentName}` })],
    }),
    new Paragraph({
      ...RTL_PARA,
      alignment: AlignmentType.CENTER,
      spacing: { before: 240 },
      children: [
        new TextRun({
          ...HEBREW_RUN,
          size: 20,
          color: '6B7280',
          text: `[שנת לימודים] | [בית ספר] | [שם המורה]`,
        }),
      ],
    }),
  ];

  const ss = input.screenshotFiles ?? [];

  const allBodySections: Paragraph[] = [];
  for (const key of CHAPTER_ORDER) {
    const { content, status } = input.generatedContent[key];
    if (key === 'introduction') {
      allBodySections.push(...buildIntroWithScreenshot(content, status, ss[0]));
    } else if (key === 'database') {
      allBodySections.push(
        ...await buildDatabaseSection(
          content,
          status,
          input.tables ?? [],
          input.diagrams.erd.mermaidCode,
          input.diagrams.erd.status,
        ),
      );
    } else if (key === 'systemAnalysis') {
      const paras = buildChapterSection(key, content, status);
      appendOptionalScreenshot(paras, ss[1]);
      allBodySections.push(...paras);
    } else if (key === 'serverImplementation') {
      const paras = buildChapterSection(key, content, status);
      appendOptionalScreenshot(paras, ss[2]);
      allBodySections.push(...paras);
      allBodySections.push(...buildCSharpSection(input.classes ?? []));
    } else if (key === 'clientImplementation') {
      const paras = buildChapterSection(key, content, status);
      appendOptionalScreenshot(paras, ss[3]);
      allBodySections.push(...paras);
    } else if (key === 'userGuide') {
      allBodySections.push(...buildUserGuideWithScreenshots(content, status, ss));
    } else {
      allBodySections.push(...buildChapterSection(key, content, status));
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 }, // A4 in twentieths of a point
            margin: { top: 1440, bottom: 1440, left: 1800, right: 1800 },
          },
        },
        children: [...coverParagraphs, ...allBodySections],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);

  const date = new Date().toISOString().slice(0, 10);
  const safeName = input.studentName.replace(/[^\w\u0590-\u05FF\u0600-\u06FF ]/g, '_');
  const filename = `${safeName}-ספר-פרויקט-${date}.docx`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}


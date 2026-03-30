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
import { RTL_PARA, HEBREW_RUN, HEADING1_RUN, HEADING2_RUN } from './styles';
import { mermaidToImageBuffer } from '../../utils/mermaid';
import type { ChapterKey, DatabaseTable } from '../../store/types';

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
    base.push(...splitIntoParagraphs(content));
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
    paragraphs.push(...splitIntoParagraphs(content));
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

function tableToMermaidClass(table: DatabaseTable): string {
  if (table.columns.length === 0) return '';
  const fields = table.columns
    .map((c) => {
      const flags = [
        c.isPrimaryKey ? 'PK' : '',
        c.isForeignKey ? `FK→${c.referencesTable ?? '?'}` : '',
      ]
        .filter(Boolean)
        .join(' ');
      return `    +${c.type || 'TEXT'} ${c.name}${flags ? ' ' + flags : ''}`;
    })
    .join('\n');
  return `classDiagram\n  class ${table.name} {\n${fields}\n  }`;
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

        // Per-table structure diagram
        const mermaidCode = tableToMermaidClass(table);
        if (mermaidCode) {
          try {
            const buf = await mermaidToImageBuffer(mermaidCode);
            paragraphs.push(
              new Paragraph({
                ...RTL_PARA,
                alignment: AlignmentType.CENTER,
                spacing: { before: 160, after: 160 },
                children: [
                  new ImageRun({ type: 'png', data: buf, transformation: { width: 380, height: 240 } }),
                ],
              }),
            );
          } catch { /* skip diagram on render failure */ }
        }
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
    try {
      const buf = await mermaidToImageBuffer(erdCode);
      paragraphs.push(
        new Paragraph({
          ...RTL_PARA,
          alignment: AlignmentType.CENTER,
          spacing: { before: 160 },
          children: [
            new ImageRun({ type: 'png', data: buf, transformation: { width: 540, height: 360 } }),
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

async function buildDiagramsSection(
  umlCode: string,
  umlStatus: string,
  erdCode: string,
  erdStatus: string,
): Promise<Paragraph[]> {
  const paragraphs: Paragraph[] = [
    pageBreak(),
    chapterHeading('דיאגרמות'),
    chapterHeading('UML — דיאגרמת מחלקות', 2),
  ];

  if (umlStatus === 'complete' && umlCode) {
    try {
      const buf = await mermaidToImageBuffer(umlCode);
      paragraphs.push(
        new Paragraph({
          ...RTL_PARA,
          children: [new ImageRun({ type: 'png', data: buf, transformation: { width: 580, height: 380 } })],
        }),
      );
    } catch {
      paragraphs.push(rtlParagraph('[דיאגרמת UML לא ניתנת לרינדור — הוסף ידנית]'));
    }
  } else {
    paragraphs.push(rtlParagraph('[דיאגרמת UML לא נוצרה — הוסף ידנית]'));
  }

  paragraphs.push(chapterHeading('ERD — מסד נתונים', 2));

  if (erdStatus === 'complete' && erdCode) {
    try {
      const buf = await mermaidToImageBuffer(erdCode);
      paragraphs.push(
        new Paragraph({
          ...RTL_PARA,
          children: [new ImageRun({ type: 'png', data: buf, transformation: { width: 580, height: 380 } })],
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

// ─── Public API: build & download ────────────────────────────────────────

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

  const allBodySections: Paragraph[] = [];
  for (const key of CHAPTER_ORDER) {
    const { content, status } = input.generatedContent[key];
    if (key === 'introduction') {
      allBodySections.push(...buildIntroWithScreenshot(content, status, input.screenshotFiles?.[0]));
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
    } else if (key === 'userGuide') {
      allBodySections.push(...buildUserGuideWithScreenshots(content, status, input.screenshotFiles));
    } else {
      allBodySections.push(...buildChapterSection(key, content, status));
    }
  }

  const diagramSection = await buildDiagramsSection(
    input.diagrams.uml.mermaidCode,
    input.diagrams.uml.status,
    input.diagrams.erd.mermaidCode,
    input.diagrams.erd.status,
  );

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 }, // A4 in twentieths of a point
            margin: { top: 1440, bottom: 1440, left: 1800, right: 1800 },
          },
        },
        children: [...coverParagraphs, ...allBodySections, ...diagramSection],
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


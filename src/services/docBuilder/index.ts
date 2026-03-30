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
import { mermaidToImageBuffer, tableToImageBuffer } from '../../utils/mermaid';
import type { ChapterKey, CSharpClass, DatabaseTable } from '../../store/types';

// ─── Types ────────────────────────────────────────────────────────────────

type Lang = 'he' | 'ar';

interface LangStrings {
  dbTableStructure: string;
  dbRelations: string;
  dbErdFull: string;
  colPK: string;
  colFK: string;
  colRequired: string;
  noColumns: string;
  noChapter: string;
  erdNotRendered: string;
  erdNotGenerated: string;
  screenshotsSection: string;
  userTypeLabel: string;
  userTypes: Record<'admin' | 'regular' | 'both', string>;
  csClasses: string;
  csFields: string;
  csMethods: string;
  csNamespace: string;
  csInheritance: string;
  csAppendix: string;
  coverTitle: string;
  coverProject: string;
  coverMeta: string;
}

const STRINGS: Record<Lang, LangStrings> = {
  he: {
    dbTableStructure: 'מבנה הטבלאות',
    dbRelations: 'יחסים בין הטבלאות',
    dbErdFull: 'דיאגרמת ERD — כל הטבלאות',
    colPK: 'מפתח ראשי',
    colFK: 'מפתח זר',
    colRequired: 'חובה',
    noColumns: '[עמודות לא זוהו — הוסף תיאור ידנית]',
    noChapter: '[פרק זה לא נוצר — השלם ידנית בWord]',
    erdNotRendered: '[דיאגרמת ERD לא ניתנת לרינדור — הוסף ידנית]',
    erdNotGenerated: '[דיאגרמת ERD לא נוצרה — הוסף ידנית]',
    screenshotsSection: 'צילומי מסך',
    userTypeLabel: 'סוג משתמש: ',
    userTypes: { admin: 'מנהל', regular: 'משתמש', both: 'מנהל ומשתמש' },
    csClasses: 'מבנה המחלקות (C#)',
    csFields: 'שדות ומאפיינים',
    csMethods: 'פעולות',
    csNamespace: 'מרחב שמות: ',
    csInheritance: 'יורשת מ: ',
    csAppendix: '(מוסבר בנספח)',
    coverTitle: 'ספר פרויקט',
    coverProject: '[שם הפרויקט]',
    coverMeta: '[שנת לימודים] | [בית ספר] | [שם המורה]',
  },
  ar: {
    dbTableStructure: 'هيكل الجداول',
    dbRelations: 'العلاقات بين الجداول',
    dbErdFull: 'مخطط ERD — جميع الجداول',
    colPK: 'مفتاح أساسي',
    colFK: 'مفتاح خارجي',
    colRequired: 'إلزامي',
    noColumns: '[لم تُحدد الأعمدة — أضف وصفًا يدويًا]',
    noChapter: '[لم يُنشأ هذا الفصل — أكمله يدويًا في Word]',
    erdNotRendered: '[تعذّر عرض مخطط ERD — أضفه يدويًا]',
    erdNotGenerated: '[لم يُنشأ مخطط ERD — أضفه يدويًا]',
    screenshotsSection: 'لقطات الشاشة',
    userTypeLabel: 'نوع المستخدم: ',
    userTypes: { admin: 'مدير', regular: 'مستخدم', both: 'مدير ومستخدم' },
    csClasses: 'هيكل الفصول (C#)',
    csFields: 'الحقول والخصائص',
    csMethods: 'الإجراءات',
    csNamespace: 'مساحة الأسماء: ',
    csInheritance: 'يرث من: ',
    csAppendix: '(موضح في الملحق)',
    coverTitle: 'كتاب المشروع',
    coverProject: '[اسم المشروع]',
    coverMeta: '[السنة الدراسية] | [المدرسة] | [اسم المعلم]',
  },
};

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

// splitIntoParagraphs kept for potential future use

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

function buildUserGuideWithScreenshots(
  content: string,
  status: string,
  screenshotFiles: BuildDocumentInput['screenshotFiles'],
  lang: Lang,
): Paragraph[] {
  const S = STRINGS[lang];
  const base: Paragraph[] = [pageBreak(), chapterHeading(CHAPTER_TITLES.userGuide[lang])];

  if (status === 'failed' || !content.trim()) {
    base.push(rtlParagraph(S.noChapter));
  } else {
    base.push(...markdownToDocxParagraphs(content));
  }

  if (!screenshotFiles || screenshotFiles.length === 0) return base;

  base.push(chapterHeading(S.screenshotsSection, 2));
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
            text: `(${S.userTypeLabel}${S.userTypes[ss.userType]})` }),
        ],
      }),
    );
  }

  return base;
}

// ─── Chapter builders ──────────────────────────────────────────────────────

const CHAPTER_TITLES: Record<ChapterKey, Record<Lang, string>> = {
  introduction:         { he: 'מבוא',               ar: 'مقدمة' },
  techStack:            { he: 'סקירת טכנולוגיות',   ar: 'مراجعة التقنيات' },
  systemAnalysis:       { he: 'ניתוח מערכת',         ar: 'تحليل النظام' },
  database:             { he: 'מסד נתונים',           ar: 'قاعدة البيانات' },
  serverImplementation: { he: 'מימוש צד שרת',        ar: 'تنفيذ الخادم' },
  clientImplementation: { he: 'מימוש צד לקוח',       ar: 'تنفيذ العميل' },
  userGuide:            { he: 'מדריך משתמש',          ar: 'دليل المستخدم' },
  reflection:           { he: 'רפלקסיה',              ar: 'التأمل الذاتي' },
  difficulties:         { he: 'קשיים ופתרונות',       ar: 'الصعوبات والحلول' },
  whatNext:             { he: 'פיתוחים עתידיים',      ar: 'التطورات المستقبلية' },
  appendices:           { he: 'נספחים',               ar: 'الملاحق' },
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

function buildChapterSection(key: ChapterKey, content: string, status: string, lang: Lang): Paragraph[] {
  const paragraphs: Paragraph[] = [
    pageBreak(),
    chapterHeading(CHAPTER_TITLES[key][lang]),
  ];

  if (status === 'failed' || !content.trim()) {
    paragraphs.push(rtlParagraph(STRINGS[lang].noChapter));
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
  lang: Lang,
): Paragraph[] {
  const paragraphs = buildChapterSection('introduction', content, status, lang);
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
async function buildDatabaseSection(
  content: string,
  status: string,
  tables: DatabaseTable[],
  erdCode: string,
  erdStatus: string,
  lang: Lang,
): Promise<Paragraph[]> {
  const S = STRINGS[lang];
  const paragraphs: Paragraph[] = [
    pageBreak(),
    chapterHeading(CHAPTER_TITLES.database[lang]),
  ];

  if (status === 'failed' || !content.trim()) {
    paragraphs.push(rtlParagraph(S.noChapter));
  } else {
    paragraphs.push(...markdownToDocxParagraphs(content));
  }

  // ── Per-table sub-sections ──────────────────────────────────────────────
  if (tables.length > 0) {
    paragraphs.push(chapterHeading(S.dbTableStructure, 2));

    for (const table of tables) {
      paragraphs.push(chapterHeading(table.name, 2));

      if (table.description) {
        paragraphs.push(rtlParagraph(table.description));
      }

      if (table.columns.length > 0) {
        // Each column as its own bullet line: FieldName: TYPE [PK] [FK→Table] [Required]
        for (const col of table.columns) {
          const flags: string[] = [];
          if (col.isPrimaryKey) flags.push(S.colPK);
          if (col.isForeignKey) flags.push(`${S.colFK}→${col.referencesTable ?? '?'}`);
          if (!col.nullable) flags.push(S.colRequired);
          const flagStr = flags.length > 0 ? `  [${flags.join(', ')}]` : '';
          const colDesc = col.description ? `  — ${col.description}` : '';
          paragraphs.push(
            new Paragraph({
              ...RTL_PARA,
              indent: { right: 720 },
              children: [new TextRun({ ...HEBREW_RUN, text: `• ${col.name}: ${col.type || 'string'}${flagStr}${colDesc}` })],
            }),
          );
        }

        // Per-table custom diagram screenshot (FieldName | Type | Key column order)
        try {
          const buf = await tableToImageBuffer(table);
          paragraphs.push(
            new Paragraph({
              ...RTL_PARA,
              alignment: AlignmentType.CENTER,
              spacing: { before: 160, after: 160 },
              children: [
                new ImageRun({ type: 'png', data: buf, transformation: { width: 380, height: 220 } }),
              ],
            }),
          );
        } catch { /* skip diagram on render failure */ }
      } else {
        paragraphs.push(rtlParagraph(S.noColumns));
      }

      // Spacing between tables
      paragraphs.push(new Paragraph({ ...RTL_PARA, spacing: { before: 200, after: 200 }, children: [] }));
    }
  }

  // ── Relations sub-section ───────────────────────────────────────────────
  paragraphs.push(chapterHeading(S.dbRelations, 2));

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
    paragraphs.push(chapterHeading(S.dbErdFull, 2));
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
      paragraphs.push(rtlParagraph(S.erdNotRendered));
    }
  } else {
    paragraphs.push(rtlParagraph(S.erdNotGenerated));
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

function classBlock(cls: CSharpClass, lang: Lang): Paragraph[] {
  const S = STRINGS[lang];
  const paras: Paragraph[] = [];

  // H2 heading: ClassName + abstract/interface badge
  const badges = [cls.isAbstract ? 'abstract' : '', cls.isInterface ? 'interface' : '']
    .filter(Boolean)
    .join(', ');
  const headingText = badges ? `${cls.name} (${badges})` : cls.name;
  paras.push(chapterHeading(headingText, 2));

  // Namespace
  if (cls.namespace) {
    paras.push(rtlParagraph(`${S.csNamespace}${cls.namespace}`));
  }

  // Base class / interfaces
  const bases = [cls.baseClass ?? '', ...cls.interfaces].filter(Boolean);
  if (bases.length > 0) {
    paras.push(rtlParagraph(`${S.csInheritance}${bases.join(', ')}`));
  }

  // Class description from xmlDocComment (AI-generated or from source); skip if empty
  const classDesc = cls.xmlDocComment?.trim();
  if (classDesc) paras.push(rtlParagraph(classDesc));

  // Properties & fields as code lines
  const members = [
    ...cls.fields.map((f) => `${f.accessModifier} ${f.type} ${f.name}`),
    ...cls.properties.map((p) => `${p.accessModifier} ${p.type} ${p.name} { get; set; }`),
  ];
  if (members.length > 0) {
    paras.push(chapterHeading(S.csFields, 2));
    members.forEach((line) => paras.push(codeLineParagraph(line)));
  }

  // Methods — key methods first, then the rest
  if (cls.methods.length > 0) {
    paras.push(chapterHeading(S.csMethods, 2));
    const sorted = [
      ...cls.methods.filter((m) => m.isKeySnippet),
      ...cls.methods.filter((m) => !m.isKeySnippet),
    ];
    for (const method of sorted) {
      const prefix = method.isKeySnippet ? '★ ' : '';
      const sig = `${prefix}${method.accessModifier} ${method.returnType} ${method.name}(${method.parameters.join(', ')})`;
      paras.push(codeLineParagraph(sig));
      // Method description from xmlDocComment (AI-generated or from source); skip if empty
      const explanation = method.xmlDocComment?.trim();
      if (explanation) paras.push(rtlParagraph(explanation));
      if (method.isExplainInAppendix) {
        paras.push(rtlParagraph(S.csAppendix));
      }
    }
  }

  return paras;
}

function buildCSharpSection(classes: CSharpClass[], lang: Lang): Paragraph[] {
  const visible = classes.filter((c) => !c.isExcluded);
  if (visible.length === 0) return [];

  return [
    pageBreak(),
    chapterHeading(STRINGS[lang].csClasses),
    ...visible.flatMap((cls) => classBlock(cls, lang)),
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
  lang: Lang,
): void {
  if (!screenshot) return;
  const S = STRINGS[lang];
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
        text: `(${S.userTypeLabel}${S.userTypes[screenshot.userType]})`,
      })],
    }),
  );
}

export async function buildAndDownloadDocument(input: BuildDocumentInput): Promise<void> {
  const lang: Lang = input.language ?? 'he';
  const S = STRINGS[lang];

  const coverParagraphs: Paragraph[] = [
    new Paragraph({
      ...RTL_PARA,
      alignment: AlignmentType.CENTER,
      spacing: { before: 2880 },
      children: [new TextRun({ ...HEBREW_RUN, bold: true, size: 40, text: S.coverTitle })],
    }),
    new Paragraph({
      ...RTL_PARA,
      alignment: AlignmentType.CENTER,
      spacing: { before: 480 },
      children: [new TextRun({ ...HEBREW_RUN, size: 28, text: S.coverProject })],
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
          text: S.coverMeta,
        }),
      ],
    }),
  ];

  const ss = input.screenshotFiles ?? [];

  const allBodySections: Paragraph[] = [];
  for (const key of CHAPTER_ORDER) {
    const { content, status } = input.generatedContent[key];
    if (key === 'introduction') {
      allBodySections.push(...buildIntroWithScreenshot(content, status, ss[0], lang));
    } else if (key === 'database') {
      allBodySections.push(
        ...await buildDatabaseSection(
          content,
          status,
          input.tables ?? [],
          input.diagrams.erd.mermaidCode,
          input.diagrams.erd.status,
          lang,
        ),
      );
    } else if (key === 'systemAnalysis') {
      const paras = buildChapterSection(key, content, status, lang);
      appendOptionalScreenshot(paras, ss[1], lang);
      allBodySections.push(...paras);
    } else if (key === 'serverImplementation') {
      const paras = buildChapterSection(key, content, status, lang);
      appendOptionalScreenshot(paras, ss[2], lang);
      allBodySections.push(...paras);
      allBodySections.push(...buildCSharpSection(input.classes ?? [], lang));
    } else if (key === 'clientImplementation') {
      const paras = buildChapterSection(key, content, status, lang);
      appendOptionalScreenshot(paras, ss[3], lang);
      allBodySections.push(...paras);
    } else if (key === 'userGuide') {
      allBodySections.push(...buildUserGuideWithScreenshots(content, status, ss, lang));
    } else {
      allBodySections.push(...buildChapterSection(key, content, status, lang));
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


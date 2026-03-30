import type { GeminiModel, Language, CSharpClass, DatabaseTable, ProjectType, ChapterKey } from '../store/types';
import { GEMINI_API_BASE } from '../utils/constants';

// Whitelist of allowed Gemini models — prevents open-ended URL construction
const ALLOWED_MODELS: GeminiModel[] = [
  'gemini-2.5-flash',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
  'gemini-2.0-flash',
];

function assertAllowedModel(model: string): asserts model is GeminiModel {
  if (!(ALLOWED_MODELS as string[]).includes(model)) {
    throw new Error(`Unknown Gemini model: ${model}`);
  }
}

// ─── Core API caller ──────────────────────────────────────────────────────

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
  error?: { message?: string };
}

// Retry with exponential backoff on 429 (rate-limit) responses.
// Free-tier Gemini allows ~15 RPM; 13 chapters + 2 diagrams can hit the limit.
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 15_000; // 15 s — Gemini free-tier resets per minute

async function callGemini(
  apiKey: string,
  model: GeminiModel,
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  assertAllowedModel(model);
  const url = `${GEMINI_API_BASE}/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  let lastError = '';
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: { temperature: 0.4, topP: 0.85, maxOutputTokens: 8192 },
      }),
    });

    if (res.ok) {
      const body = (await res.json()) as GeminiResponse;
      return body.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    }

    let errMsg = `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as GeminiResponse;
      if (body.error?.message) errMsg = body.error.message;
    } catch { /* ignore */ }
    lastError = errMsg;

    // Only retry on rate-limit (429); fail fast on other errors
    if (res.status !== 429 || attempt === MAX_RETRIES) break;

    const delay = RETRY_BASE_DELAY_MS * (attempt + 1);
    await new Promise((r) => setTimeout(r, delay));
  }

  throw new Error(lastError);
}

// ─── System prompt builder ─────────────────────────────────────────────────

function buildSystemPrompt(language: Language): string {
  const langName = language === 'he' ? 'עברית' : 'عربية';
  return `אתה עוזר כתיבה מקצועי המסייע לתלמידי תיכון בישראל לכתוב את ספר הפרויקט שלהם בהנדסת תוכנה בשפה ${langName} פורמלית. כתוב אקדמית בגוף שלישי בזמן הווה. אל תשתמש במילים באנגלית אלא אם כן הן מונחים טכניים. פרמט את הפלט כפסקאות רגילות, ללא markdown.`;
}

// ─── Context builders ──────────────────────────────────────────────────────

function classesToContext(classes: CSharpClass[]): string {
  const active = classes.filter((c) => !c.isExcluded);
  return active
    .map((c) => {
      const props = c.properties.map((p) => `  ${p.accessModifier} ${p.type} ${p.name}`).join('\n');
      const methods = c.methods
        .map((m) => `  ${m.accessModifier} ${m.returnType} ${m.name}(${m.parameters.join(', ')})`)
        .join('\n');
      return `${c.isInterface ? 'interface' : 'class'} ${c.name}${c.baseClass ? ' : ' + c.baseClass : ''}{\n${props}\n${methods}\n}`;
    })
    .join('\n\n');
}

function tablesToContext(tables: DatabaseTable[]): string {
  return tables
    .map((t) => {
      const cols = t.columns.map((c) => `  ${c.name}: ${c.type}${c.isPrimaryKey ? ' PK' : ''}${c.isForeignKey ? ` FK→${c.referencesTable ?? '?'}` : ''}`).join('\n');
      return `TABLE ${t.name}${t.description ? ` -- ${t.description}` : ''}:\n${cols}`;
    })
    .join('\n\n');
}

// ─── Connection test ───────────────────────────────────────────────────────

export async function testGeminiConnection(
  apiKey: string,
  model: GeminiModel,
): Promise<{ ok: boolean; error?: string }> {
  assertAllowedModel(model);
  const url = `${GEMINI_API_BASE}/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: 'Hi' }] }] }),
    });

    if (res.ok) return { ok: true };

    let message = `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as GeminiResponse;
      if (body.error?.message) message = body.error.message;
    } catch { /* ignore */ }
    return { ok: false, error: message };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error';
    return { ok: false, error: message };
  }
}

// ─── Chapter generators ────────────────────────────────────────────────────

export interface GenerationContext {
  apiKey: string;
  model: GeminiModel;
  language: Language;
  studentName: string;
  projectType: ProjectType | null;
  classes: CSharpClass[];
  tables: DatabaseTable[];
  screenshots: Array<{ screenName: string; caption: string; userType: string }>;
}

// ─── Tech-stack detection ──────────────────────────────────────────────────

function detectTechStack(classes: CSharpClass[]): string {
  const names = classes.map((c) => c.name.toLowerCase()).join(' ');
  const files = classes.map((c) => c.filePath.toLowerCase()).join(' ');
  if (names.includes('controller') || names.includes('apicontroller')) return 'ASP.NET Web API';
  if (names.includes('componentbase') || files.includes('.razor')) return 'Blazor';
  if (names.includes('window') || names.includes('viewmodel')) return 'WPF';
  if (names.includes('form')) return 'WinForms';
  if (names.includes('activity') || names.includes('fragment')) return 'Android';
  return 'אחר';
}

// ─── Project summary builder ───────────────────────────────────────────────

export function buildProjectSummary(ctx: GenerationContext): string {
  const top5 = ctx.classes
    .filter((c) => !c.isExcluded)
    .slice(0, 5)
    .map((c) => c.name)
    .join(', ') || 'לא זוהו';

  const techStack = detectTechStack(ctx.classes);

  const ptLabels: Record<string, string> = {
    blazor: 'Blazor', wpf: 'WPF', winforms: 'WinForms', android: 'Android', other: 'אחר',
  };
  const ptLabel = ctx.projectType ? (ptLabels[ctx.projectType] ?? 'אחר') : 'לא ידוע';

  const tableNames = ctx.tables.map((t) => t.name).join(', ') || 'אין';
  const screenshotNames = ctx.screenshots.length > 0
    ? ctx.screenshots.map((s) => s.screenName).join(', ')
    : 'אין';

  return `── פרטי הפרויקט ──
שם הסטודנט: ${ctx.studentName}
סוג פרויקט: ${ptLabel} (${techStack})
מחלקות עיקריות: ${top5}
מסד נתונים: ${ctx.tables.length} טבלאות (${tableNames})
צילומי מסך: ${ctx.screenshots.length} (${screenshotNames})
──────────────────
`;
}

const CHAPTER_WORD_COUNTS: Record<ChapterKey, number> = {
  introduction: 400,
  techStack: 300,
  systemAnalysis: 600,
  database: 500,
  serverImplementation: 700,
  clientImplementation: 600,
  userGuide: 400,
  reflection: 300,
  difficulties: 350,
  whatNext: 300,
  appendices: 200,
};

const CHAPTER_PROMPTS: Record<ChapterKey, (ctx: GenerationContext) => string> = {
  introduction: (ctx) =>
    `${buildProjectSummary(ctx)}
כתוב פרק מבוא לספר הפרויקט. תאר את מטרת הפרויקט, קהל היעד ותרומתו. אורך: כ-${CHAPTER_WORD_COUNTS.introduction} מילים.`,

  techStack: (ctx) =>
    `${buildProjectSummary(ctx)}
תאר את ערימת הטכנולוגיות בפרויקט: שפות תכנות, פריימוורקים, ספריות וכלים בהם נעשה שימוש.
הסבר מדוע נבחרו טכנולוגיות אלו ומהם יתרונותיהן. אורך: כ-${CHAPTER_WORD_COUNTS.techStack} מילים.`,

  systemAnalysis: (ctx) =>
    `${buildProjectSummary(ctx)}
מבנה המערכת:
${classesToContext(ctx.classes)}
כתוב פרק ניתוח מערכת הכולל: מטרות, דרישות פונקציונליות ואי-פונקציונליות, ומבנה כללי. אורך: כ-${CHAPTER_WORD_COUNTS.systemAnalysis} מילים.`,

  database: (ctx) =>
    `${buildProjectSummary(ctx)}
טבלאות מסד הנתונים:
${tablesToContext(ctx.tables)}
כתוב פרק מסד נתונים הכולל תיאור כל טבלה, עמודותיה, והקשרים ביניהן. אורך: כ-${CHAPTER_WORD_COUNTS.database} מילים.`,

  serverImplementation: (ctx) =>
    `${buildProjectSummary(ctx)}
מחלקות צד שרת/לוגיקה עסקית:
${classesToContext(ctx.classes.filter((c) => !c.isInterface))}
כתוב פרק מימוש צד שרת הכולל תיאור היגיון עסקי ומחלקות עיקריות. אורך: כ-${CHAPTER_WORD_COUNTS.serverImplementation} מילים.`,

  clientImplementation: (ctx) =>
    `${buildProjectSummary(ctx)}
מחלקות ממשק משתמש:
${classesToContext(ctx.classes)}
כתוב פרק מימוש צד לקוח הכולל תיאור ממשק המשתמש ורכיביו העיקריים. אורך: כ-${CHAPTER_WORD_COUNTS.clientImplementation} מילים.`,

  userGuide: (ctx) => {
    const ssContext = ctx.screenshots.length > 0
      ? `\nצילומי מסך זמינים:\n${ctx.screenshots.map((s) => `- ${s.screenName}: ${s.caption || 'ללא תיאור'} (${s.userType === 'admin' ? 'מנהל' : s.userType === 'regular' ? 'משתמש' : 'מנהל ומשתמש'})`).join('\n')}`
      : '\nאין צילומי מסך — כתוב מדריך כללי.';
    return `${buildProjectSummary(ctx)}${ssContext}\nכתוב מדריך משתמש הכולל הוראות שימוש מפורטות לכל מסך וכל סוג משתמש. אורך: כ-${CHAPTER_WORD_COUNTS.userGuide} מילים.`;
  },

  reflection: (ctx) =>
    `${buildProjectSummary(ctx)}
כמחבר הפרויקט, כתוב פרק רפלקסיה אישית הכולל: מה למדת, מה היה מאתגר, ומה היית עושה אחרת. אורך: כ-${CHAPTER_WORD_COUNTS.reflection} מילים.`,

  difficulties: (ctx) =>
    `${buildProjectSummary(ctx)}
תאר 3 עד 5 קשיים טכניים שנתקלת בהם בפיתוח הפרויקט.
עבור כל קושי: תאר את הבעיה, כיצד נפתרה, ומה נלמד ממנה. אורך: כ-${CHAPTER_WORD_COUNTS.difficulties} מילים.`,

  whatNext: (ctx) =>
    `${buildProjectSummary(ctx)}
הצע 3 עד 5 שיפורים עתידיים ריאליסטיים שניתן לממש בהמשך הפרויקט.
עבור כל שיפור: תאר אותו, מהו ערכו למשתמש, ומה נדרש לממשו. אורך: כ-${CHAPTER_WORD_COUNTS.whatNext} מילים.`,

  appendices: (ctx) =>
    `${buildProjectSummary(ctx)}
מחלקות ל-Appendix (שיטות מורכבות):
${ctx.classes
  .filter((c) => !c.isExcluded)
  .flatMap((c) => c.methods.filter((m) => m.isExplainInAppendix))
  .map((m) => m.name)
  .join(', ') || 'לא סומנו שיטות'}
כתוב נספח קצר עם הסברים על שיטות מורכבות (אם סומנו). אורך: כ-${CHAPTER_WORD_COUNTS.appendices} מילים.`,
};

export async function generateChapter(
  chapterKey: ChapterKey,
  ctx: GenerationContext,
): Promise<string> {
  const systemPrompt = buildSystemPrompt(ctx.language);
  const userPrompt = CHAPTER_PROMPTS[chapterKey](ctx);
  return callGemini(ctx.apiKey, ctx.model, systemPrompt, userPrompt);
}

// ─── Diagram generators (Mermaid) ─────────────────────────────────────────

export async function generateUmlDiagram(ctx: GenerationContext): Promise<string> {
  const systemPrompt = buildSystemPrompt(ctx.language);
  const userPrompt = `מחלקות:
${classesToContext(ctx.classes)}
צור קוד Mermaid תקני לדיאגרמת מחלקות (classDiagram). הכנס רק את קוד Mermaid, ללא הסברים.`;
  return callGemini(ctx.apiKey, ctx.model, systemPrompt, userPrompt);
}

export async function generateErdDiagram(ctx: GenerationContext): Promise<string> {
  const systemPrompt = buildSystemPrompt(ctx.language);
  const userPrompt = `טבלאות:
${tablesToContext(ctx.tables)}
צור קוד Mermaid תקני ל-ERD (erDiagram). הכנס רק את קוד Mermaid, ללא הסברים.`;
  return callGemini(ctx.apiKey, ctx.model, systemPrompt, userPrompt);
}



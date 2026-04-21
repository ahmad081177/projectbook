import type { AiProvider, GeminiModel, Language, CSharpClass, DatabaseTable, ProjectType, ChapterKey, OpenAIModel, ClaudeModel, OllamaModel, AiUsageStats } from '../store/types';
import { GEMINI_API_BASE, OPENAI_API_BASE, CLAUDE_API_BASE } from '../utils/constants';

// ─── Provider config ──────────────────────────────────────────────────────

export interface AzureConfig {
  endpoint: string;        // https://<resource>.openai.azure.com
  apiKey: string;
  deploymentName: string;  // e.g. gpt-4o
  apiVersion: string;      // e.g. 2024-02-01
}

// ─── Response shapes ──────────────────────────────────────────────────────

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
  error?: { message?: string };
}

interface AzureOpenAIResponse {
  choices?: Array<{ message?: { content?: string } }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  error?: { message?: string };
}

interface OpenAIResponse {
  choices?: Array<{ message?: { content?: string } }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  error?: { message?: string };
}

interface ClaudeResponse {
  content?: Array<{ type?: string; text?: string }>;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
  error?: { type?: string; message?: string };
}

interface OllamaResponse {
  response?: string;
  prompt_eval_count?: number;
  eval_count?: number;
  error?: string;
}

export interface AiTextResult {
  text: string;
  usage: AiUsageStats;
}

// ─── Retry constants ──────────────────────────────────────────────────────

// Retry with exponential backoff on 429 (rate-limit) responses.
// Free-tier Gemini allows ~15 RPM; 13 chapters + 2 diagrams can hit the limit.
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 15_000; // 15 s — Gemini free-tier resets per minute

function estimateTokens(text: string): number {
  const normalized = text.trim();
  if (!normalized) return 0;
  return Math.max(1, Math.ceil(normalized.length / 4));
}

function buildUsageStats(
  provider: AiProvider,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  outputText: string,
  actual?: Partial<Pick<AiUsageStats, 'inputTokens' | 'outputTokens' | 'totalTokens'>>,
): AiUsageStats {
  const estimatedInputTokens = estimateTokens(`${systemPrompt}\n${userPrompt}`);
  const estimatedOutputTokens = estimateTokens(outputText);
  const inputTokens = actual?.inputTokens ?? estimatedInputTokens;
  const outputTokens = actual?.outputTokens ?? estimatedOutputTokens;
  const totalTokens = actual?.totalTokens ?? inputTokens + outputTokens;

  return {
    inputTokens,
    outputTokens,
    totalTokens,
    estimated: actual?.inputTokens == null || actual?.outputTokens == null || actual?.totalTokens == null,
    provider,
    model,
  };
}

// ─── Gemini caller ────────────────────────────────────────────────────────

async function callGemini(
  apiKey: string,
  model: GeminiModel,
  systemPrompt: string,
  userPrompt: string,
): Promise<AiTextResult> {
  if (!model) throw new Error('Gemini model name is required');
  const url = `${GEMINI_API_BASE}/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

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
      const text = body.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      return {
        text,
        usage: buildUsageStats('gemini', model, systemPrompt, userPrompt, text, {
          inputTokens: body.usageMetadata?.promptTokenCount,
          outputTokens: body.usageMetadata?.candidatesTokenCount,
          totalTokens: body.usageMetadata?.totalTokenCount,
        }),
      };
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

// ─── Azure OpenAI caller ──────────────────────────────────────────────────

async function callAzureOpenAI(
  cfg: AzureConfig,
  systemPrompt: string,
  userPrompt: string,
): Promise<AiTextResult> {
  // Validate endpoint: must be an https URL under openai.azure.com
  const { endpoint, apiKey, deploymentName, apiVersion } = cfg;
  if (!endpoint || !deploymentName || !apiVersion) {
    throw new Error('Azure OpenAI: endpoint, deploymentName, and apiVersion are required');
  }
  // Security: only allow HTTPS and restrict to Azure OpenAI domain
  let endpointUrl: URL;
  try {
    endpointUrl = new URL(endpoint);
  } catch {
    throw new Error('Azure OpenAI: invalid endpoint URL');
  }
  if (endpointUrl.protocol !== 'https:') {
    throw new Error('Azure OpenAI: endpoint must use HTTPS');
  }
  if (!endpointUrl.hostname.endsWith('.openai.azure.com')) {
    throw new Error('Azure OpenAI: endpoint must be under *.openai.azure.com');
  }

  // Deployment name is free-form — only require it to be non-empty (validated above)
  const safeBase = endpointUrl.origin; // strips any path/query from user input
  const url = `${safeBase}/openai/deployments/${encodeURIComponent(deploymentName)}/chat/completions?api-version=${encodeURIComponent(apiVersion)}`;

  let lastError = '';
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_completion_tokens: 8192,
      }),
    });

    if (res.ok) {
      const body = (await res.json()) as AzureOpenAIResponse;
      const text = body.choices?.[0]?.message?.content ?? '';
      return {
        text,
        usage: buildUsageStats('azure-openai', deploymentName, systemPrompt, userPrompt, text, {
          inputTokens: body.usage?.prompt_tokens,
          outputTokens: body.usage?.completion_tokens,
          totalTokens: body.usage?.total_tokens,
        }),
      };
    }

    let errMsg = `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as AzureOpenAIResponse;
      if (body.error?.message) errMsg = body.error.message;
    } catch { /* ignore */ }
    lastError = errMsg;

    if (res.status !== 429 || attempt === MAX_RETRIES) break;
    await new Promise((r) => setTimeout(r, RETRY_BASE_DELAY_MS * (attempt + 1)));
  }

  throw new Error(lastError);
}

// ─── OpenAI caller ───────────────────────────────────────────────────────

async function callOpenAI(
  apiKey: string,
  model: OpenAIModel,
  systemPrompt: string,
  userPrompt: string,
): Promise<AiTextResult> {
  if (!apiKey.trim()) throw new Error('OpenAI API key is required');
  if (!model.trim()) throw new Error('OpenAI model name is required');

  const url = `${OPENAI_API_BASE}/v1/chat/completions`;
  let lastError = '';

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.4,
        top_p: 0.85,
        max_tokens: 8192,
      }),
    });

    if (res.ok) {
      const body = (await res.json()) as OpenAIResponse;
      const text = body.choices?.[0]?.message?.content ?? '';
      return {
        text,
        usage: buildUsageStats('openai', model, systemPrompt, userPrompt, text, {
          inputTokens: body.usage?.prompt_tokens,
          outputTokens: body.usage?.completion_tokens,
          totalTokens: body.usage?.total_tokens,
        }),
      };
    }

    let errMsg = `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as OpenAIResponse;
      if (body.error?.message) errMsg = body.error.message;
    } catch { /* ignore */ }
    lastError = errMsg;

    if (res.status !== 429 || attempt === MAX_RETRIES) break;
    await new Promise((r) => setTimeout(r, RETRY_BASE_DELAY_MS * (attempt + 1)));
  }

  throw new Error(lastError);
}

// ─── Claude (Anthropic) caller ────────────────────────────────────────────

async function callClaude(
  apiKey: string,
  model: ClaudeModel,
  systemPrompt: string,
  userPrompt: string,
): Promise<AiTextResult> {
  if (!apiKey.trim()) throw new Error('Claude API key is required');
  if (!model.trim()) throw new Error('Claude model name is required');

  const url = `${CLAUDE_API_BASE}/v1/messages`;
  let lastError = '';

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model,
        max_tokens: 8192,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (res.ok) {
      const body = (await res.json()) as ClaudeResponse;
      const text = body.content?.find((b) => b.type === 'text')?.text ?? '';
      return {
        text,
        usage: buildUsageStats('claude', model, systemPrompt, userPrompt, text, {
          inputTokens: body.usage?.input_tokens,
          outputTokens: body.usage?.output_tokens,
          totalTokens: body.usage ? (body.usage.input_tokens ?? 0) + (body.usage.output_tokens ?? 0) : undefined,
        }),
      };
    }

    let errMsg = `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as ClaudeResponse;
      if (body.error?.message) errMsg = body.error.message;
    } catch { /* ignore */ }
    lastError = errMsg;

    if (res.status !== 429 || attempt === MAX_RETRIES) break;
    await new Promise((r) => setTimeout(r, RETRY_BASE_DELAY_MS * (attempt + 1)));
  }

  throw new Error(lastError);
}

// ─── Ollama (local) caller ────────────────────────────────────────────────

async function callOllama(
  baseUrl: string,
  model: OllamaModel,
  systemPrompt: string,
  userPrompt: string,
): Promise<AiTextResult> {
  if (!model.trim()) throw new Error('Ollama model name is required');
  const base = baseUrl.replace(/\/+$/, '');
  const url = `${base}/api/generate`;

  let lastError = '';
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        system: systemPrompt,
        prompt: userPrompt,
        stream: false,
        options: { temperature: 0.4, top_p: 0.85 },
      }),
    });

    if (res.ok) {
      const body = (await res.json()) as OllamaResponse;
      const text = body.response ?? '';
      return {
        text,
        usage: buildUsageStats('ollama', model, systemPrompt, userPrompt, text, {
          inputTokens: body.prompt_eval_count,
          outputTokens: body.eval_count,
          totalTokens: body.prompt_eval_count != null && body.eval_count != null
            ? body.prompt_eval_count + body.eval_count
            : undefined,
        }),
      };
    }

    let errMsg = `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as OllamaResponse;
      if (body.error) errMsg = body.error;
    } catch { /* ignore */ }
    lastError = errMsg;

    if (res.status !== 429 || attempt === MAX_RETRIES) break;
    await new Promise((r) => setTimeout(r, RETRY_BASE_DELAY_MS * (attempt + 1)));
  }

  throw new Error(lastError);
}

// ─── Unified AI caller ────────────────────────────────────────────────────

async function callAI(
  provider: AiProvider,
  apiKey: string,
  model: GeminiModel,
  azureCfg: AzureConfig | null,
  systemPrompt: string,
  userPrompt: string,
  ollamaBaseUrl?: string,
): Promise<AiTextResult> {
  if (provider === 'azure-openai') {
    if (!azureCfg) throw new Error('Azure config missing');
    return callAzureOpenAI(azureCfg, systemPrompt, userPrompt);
  }
  if (provider === 'openai') {
    return callOpenAI(apiKey, model, systemPrompt, userPrompt);
  }
  if (provider === 'claude') {
    return callClaude(apiKey, model, systemPrompt, userPrompt);
  }
  if (provider === 'ollama') {
    return callOllama(ollamaBaseUrl || 'http://localhost:11434', model, systemPrompt, userPrompt);
  }
  return callGemini(apiKey, model, systemPrompt, userPrompt);
}

// ─── System prompt builder ─────────────────────────────────────────────────

function buildSystemPrompt(language: Language): string {
  if (language === 'ar') {
    return `أنت مساعد لطلاب المدارس الثانوية في إسرائيل يكتبون كتاب مشروع هندسة البرمجيات. اكتب بلغة عربية بسيطة وواضحة تناسب المراهق — ليس أسلوباً أكاديمياً أو متكلفاً. استخدم جملاً قصيرة وكلمات شائعة. لا تستخدم الكلمات الإنجليزية إلا إذا كانت مصطلحات تقنية. **هيكل كل قسم:** فقرة افتتاحية قصيرة (2-3 جمل) ثم قائمة نقطية بـ - لكل عنصر. استخدم ## للقسم، ### للقسم الفرعي، و**تمييز غامق** للمصطلحات الأساسية.`;
  }
  return `אתה עוזר לתלמידי תיכון בישראל הכותבים ספר פרויקט בהנדסת תוכנה. כתוב בעברית פשוטה, ברורה ומובנת לבני נוער — לא אקדמית ולא מלאכותית. השתמש במשפטים קצרים ובמילים נפוצות. אל תשתמש במילים באנגלית אלא אם הן מונחים טכניים. **מבנה כל קטע:** פסקת פתיחה קצרה (2-3 משפטים) ואחריה רשימת נקודות עם - לכל פריט. השתמש ב-## לסעיף, ### לתת-סעיף, ו-**הדגשה** למונחים מרכזיים.`;
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

export function tablesToContext(tables: DatabaseTable[]): string {
  return tables
    .map((t) => {
      if (t.columns.length === 0) {
        return `TABLE ${t.name}: [no column info available — show table box only]`;
      }
      const cols = t.columns.map((c) =>
        `  ${c.name}: ${c.type}${c.isPrimaryKey ? ' PK' : ''}${c.isForeignKey ? ` FK→${c.referencesTable ?? '?'}` : ''}`
      ).join('\n');
      return `TABLE ${t.name}${t.description ? ` -- ${t.description}` : ''}:\n${cols}`;
    })
    .join('\n\n');
}

// ─── Connection test ───────────────────────────────────────────────────────

export async function testGeminiConnection(
  apiKey: string,
  model: GeminiModel,
): Promise<{ ok: boolean; error?: string }> {
  if (!model) return { ok: false, error: 'Gemini model name is required' };
  const url = `${GEMINI_API_BASE}/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

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

export async function testAzureConnection(
  cfg: AzureConfig,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await callAzureOpenAI(cfg, 'You are a helpful assistant.', 'Hi');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Azure connection failed' };
  }
}

export async function testOpenAIConnection(
  apiKey: string,
  model: OpenAIModel,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await callOpenAI(apiKey, model, 'You are a helpful assistant.', 'Hi');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'OpenAI connection failed' };
  }
}

export async function testClaudeConnection(
  apiKey: string,
  model: ClaudeModel,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await callClaude(apiKey, model, 'You are a helpful assistant.', 'Hi');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Claude connection failed' };
  }
}

export async function testOllamaConnection(
  baseUrl: string,
  model: OllamaModel,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await callOllama(baseUrl, model, 'You are a helpful assistant.', 'Hi');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Ollama connection failed' };
  }
}

// ─── Chapter generators ────────────────────────────────────────────────────

export interface GenerationContext {
  provider: AiProvider;
  apiKey: string;
  model: GeminiModel;
  azureCfg: AzureConfig | null;
  ollamaBaseUrl?: string;
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
  const ar = ctx.language === 'ar';
  const top5 = ctx.classes
    .filter((c) => !c.isExcluded)
    .slice(0, 5)
    .map((c) => c.name)
    .join(', ') || (ar ? 'لم يُحدد' : 'לא זוהו');

  const techStack = detectTechStack(ctx.classes);

  const ptLabels: Record<string, string> = {
    aspnet: 'ASP.NET Web Application', blazor: 'Blazor', wpf: 'WPF', winforms: 'WinForms', android: 'Android',
    other: ar ? 'أخرى' : 'אחר',
  };
  const ptLabel = ctx.projectType
    ? (ptLabels[ctx.projectType] ?? (ar ? 'أخرى' : 'אחר'))
    : (ar ? 'غير معروف' : 'לא ידוע');

  const tableNames = ctx.tables.map((t) => t.name).join(', ') || (ar ? 'لا يوجد' : 'אין');
  const screenshotNames = ctx.screenshots.length > 0
    ? ctx.screenshots.map((s) => s.screenName).join(', ')
    : (ar ? 'لا يوجد' : 'אין');

  if (ar) {
    return `── تفاصيل المشروع ──
اسم الطالب: ${ctx.studentName}
نوع المشروع: ${ptLabel} (${techStack})
الفصول الرئيسية: ${top5}
قاعدة البيانات: ${ctx.tables.length} جداول (${tableNames})
لقطات الشاشة: ${ctx.screenshots.length} (${screenshotNames})
──────────────────
`;
  }
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
  introduction: 250,
  techStack: 180,
  systemAnalysis: 350,
  database: 500,
  serverImplementation: 700,
  clientImplementation: 600,
  userGuide: 400,
  reflection: 200,
  difficulties: 250,
  whatNext: 200,
  appendices: 200,
};

const CHAPTER_PROMPTS: Record<ChapterKey, (ctx: GenerationContext) => string> = {
  introduction: (ctx) => ctx.language === 'ar'
    ? `${buildProjectSummary(ctx)}
اكتب فصل المقدمة لكتاب المشروع. اشرح هدف المشروع، الفئة المستهدفة، وما يقدمه.
الهيكل المطلوب: فقرة افتتاحية قصيرة من 2-3 جمل ثم نقاط رئيسية (- لكل نقطة). الطول الكلي: حوالي ${CHAPTER_WORD_COUNTS.introduction} كلمة.`
    : `${buildProjectSummary(ctx)}
כתוב פרק מבוא לספר הפרויקט. תאר את מטרת הפרויקט, קהל היעד ותרומתו.
מבנה חובה: פסקת פתיחה קצרה של 2-3 משפטים → ואחריה נקודות עיקריות (- לכל נקודה). אורך כולל: כ-${CHAPTER_WORD_COUNTS.introduction} מילים.`,

  techStack: (ctx) => ctx.language === 'ar'
    ? `${buildProjectSummary(ctx)}
اشرح التقنيات المستخدمة في المشروع: اللغات، الأطر، المكتبات والأدوات.
الهيكل المطلوب: فقرة قصيرة من 2-3 جمل كمقدمة ثم نقطة لكل تقنية (ما هي + لماذا اختيرت). الطول الكلي: حوالي ${CHAPTER_WORD_COUNTS.techStack} كلمة.`
    : `${buildProjectSummary(ctx)}
תאר את הטכנולוגיות בפרויקט: שפות, פריימוורקים, ספריות וכלים.
מבנה חובה: פסקה קצרה של 2-3 משפטים כהקדמה → ואחריה נקודה לכל טכנולוגיה (מה זה + למה נבחר). אורך כולל: כ-${CHAPTER_WORD_COUNTS.techStack} מילים.`,

  systemAnalysis: (ctx) => ctx.language === 'ar'
    ? `${buildProjectSummary(ctx)}
هيكل النظام:
${classesToContext(ctx.classes)}
اكتب فصل تحليل النظام يشمل: الأهداف، المتطلبات الوظيفية وغير الوظيفية، والبنية العامة.
الهيكل المطلوب: فقرة قصيرة من 2-3 جمل كمقدمة ثم نقاط للمتطلبات والأهداف (- لكل نقطة). الطول الكلي: حوالي ${CHAPTER_WORD_COUNTS.systemAnalysis} كلمة.`
    : `${buildProjectSummary(ctx)}
מבנה המערכת:
${classesToContext(ctx.classes)}
כתוב פרק ניתוח מערכת הכולל: מטרות, דרישות פונקציונליות ואי-פונקציונליות, ומבנה כללי.
מבנה חובה: פסקה קצרה של 2-3 משפטים כהקדמה → ואחריה נקודות לדרישות ולמטרות (- לכל נקודה). אורך כולל: כ-${CHAPTER_WORD_COUNTS.systemAnalysis} מילים.`,

  database: (ctx) => ctx.language === 'ar'
    ? `${buildProjectSummary(ctx)}
جداول قاعدة البيانات:
${tablesToContext(ctx.tables)}

IMPORTANT: Base your chapter ONLY on the column names listed above.
If column info is unavailable for a table (marked "[no column info available]"), describe only that the table exists and its name — do NOT invent column names.
اكتب فصل قاعدة البيانات يشمل وصف كل جدول، أعمدته، والعلاقات بينها.
الهيكل المطلوب: فقرة افتتاحية قصيرة ثم نقطة لكل جدول/علاقة (- لكل نقطة). الطول الكلي: حوالي ${CHAPTER_WORD_COUNTS.database} كلمة.`
    : `${buildProjectSummary(ctx)}
טבלאות מסד הנתונים:
${tablesToContext(ctx.tables)}

IMPORTANT: Base your chapter ONLY on the column names listed above.
If column info is unavailable for a table (marked "[no column info available]"), describe only that the table exists and its name — do NOT invent column names.
כתוב פרק מסד נתונים הכולל תיאור כל טבלה, עמודותיה, והקשרים ביניהן.
מבנה חובה: פסקת פתיחה קצרה → ואחריה נקודה לכל טבלה/קשר (- לכל נקודה). אורך כולל: כ-${CHAPTER_WORD_COUNTS.database} מילים.`,

  serverImplementation: (ctx) => ctx.language === 'ar'
    ? `${buildProjectSummary(ctx)}
فصول جانب الخادم/المنطق التجاري:
${classesToContext(ctx.classes.filter((c) => !c.isInterface))}
اكتب فصل تنفيذ الخادم يشمل وصف المنطق التجاري والفصول الرئيسية.
الهيكل المطلوب: فقرة افتتاحية قصيرة ثم نقطة لكل فصل/مكون (- لكل نقطة). الطول الكلي: حوالي ${CHAPTER_WORD_COUNTS.serverImplementation} كلمة.`
    : `${buildProjectSummary(ctx)}
מחלקות צד שרת/לוגיקה עסקית:
${classesToContext(ctx.classes.filter((c) => !c.isInterface))}
כתוב פרק מימוש צד שרת הכולל תיאור היגיון עסקי ומחלקות עיקריות.
מבנה חובה: פסקת פתיחה קצרה → ואחריה נקודה לכל מחלקה/רכיב (- לכל נקודה). אורך כולל: כ-${CHAPTER_WORD_COUNTS.serverImplementation} מילים.`,

  clientImplementation: (ctx) => ctx.language === 'ar'
    ? `${buildProjectSummary(ctx)}
فصول واجهة المستخدم:
${classesToContext(ctx.classes)}
اكتب فصل تنفيذ العميل يشمل وصف واجهة المستخدم ومكوناتها الرئيسية.
الهيكل المطلوب: فقرة افتتاحية قصيرة ثم نقطة لكل شاشة/مكون (- لكل نقطة). الطول الكلي: حوالي ${CHAPTER_WORD_COUNTS.clientImplementation} كلمة.`
    : `${buildProjectSummary(ctx)}
מחלקות ממשק משתמש:
${classesToContext(ctx.classes)}
כתוב פרק מימוש צד לקוח הכולל תיאור ממשק המשתמש ורכיביו העיקריים.
מבנה חובה: פסקת פתיחה קצרה → ואחריה נקודה לכל מסך/רכיב (- לכל נקודה). אורך כולל: כ-${CHAPTER_WORD_COUNTS.clientImplementation} מילים.`,

  userGuide: (ctx) => {
    if (ctx.language === 'ar') {
      const ssContext = ctx.screenshots.length > 0
        ? `\nلقطات الشاشة المتاحة:\n${ctx.screenshots.map((s) => `- ${s.screenName}: ${s.caption || 'بدون وصف'} (${s.userType === 'admin' ? 'مدير' : s.userType === 'regular' ? 'مستخدم' : 'مدير ومستخدم'})`).join('\n')}`
        : '\nلا توجد لقطات شاشة — اكتب دليلاً عاماً.';
      return `${buildProjectSummary(ctx)}${ssContext}\nاكتب دليل المستخدم يشمل تعليمات الاستخدام لكل شاشة ولكل نوع مستخدم.\nالهيكل المطلوب: فقرة قصيرة ثم نقطة لكل شاشة/إجراء (- لكل نقطة). الطول الكلي: حوالي ${CHAPTER_WORD_COUNTS.userGuide} كلمة.`;
    }
    const ssContext = ctx.screenshots.length > 0
      ? `\nצילומי מסך זמינים:\n${ctx.screenshots.map((s) => `- ${s.screenName}: ${s.caption || 'ללא תיאור'} (${s.userType === 'admin' ? 'מנהל' : s.userType === 'regular' ? 'משתמש' : 'מנהל ומשתמש'})`).join('\n')}`
      : '\nאין צילומי מסך — כתוב מדריך כללי.';
    return `${buildProjectSummary(ctx)}${ssContext}\nכתוב מדריך משתמש הכולל הוראות שימוש לכל מסך וכל סוג משתמש.\nמבנה חובה: פסקה קצרה → ואחריה נקודה לכל מסך/פעולה (- לכל נקודה). אורך כולל: כ-${CHAPTER_WORD_COUNTS.userGuide} מילים.`;
  },

  reflection: (ctx) => ctx.language === 'ar'
    ? `${buildProjectSummary(ctx)}
بوصفك مؤلف المشروع، اكتب فصل التأمل الذاتي يشمل: ما تعلمته، ما كان صعباً، وما كنت ستفعله بشكل مختلف.
الهيكل المطلوب: فقرة افتتاحية قصيرة ثم نقاط (ما تعلمته / ما كان صعباً / ما كنت سأغيره). الطول الكلي: حوالي ${CHAPTER_WORD_COUNTS.reflection} كلمة.`
    : `${buildProjectSummary(ctx)}
כמחבר הפרויקט, כתוב פרק רפלקסיה אישית הכולל: מה למדת, מה היה מאתגר, ומה היית עושה אחרת.
מבנה חובה: פסקת פתיחה קצרה → ואחריה נקודות (מה למדתי / מה היה קשה / מה הייתי משנה). אורך כולל: כ-${CHAPTER_WORD_COUNTS.reflection} מילים.`,

  difficulties: (ctx) => ctx.language === 'ar'
    ? `${buildProjectSummary(ctx)}
اشرح 3 إلى 5 صعوبات تقنية واجهتها أثناء تطوير المشروع.
الهيكل المطلوب: فقرة افتتاحية قصيرة ثم نقطة لكل صعوبة (المشكلة / الحل / الدرس المستفاد). الطول الكلي: حوالي ${CHAPTER_WORD_COUNTS.difficulties} كلمة.`
    : `${buildProjectSummary(ctx)}
תאר 3 עד 5 קשיים טכניים שנתקלת בהם בפיתוח הפרויקט.
מבנה חובה: פסקת פתיחה קצרה → ואחריה נקודה לכל קושי (הבעיה / הפתרון / המסקנה). אורך כולל: כ-${CHAPTER_WORD_COUNTS.difficulties} מילים.`,

  whatNext: (ctx) => ctx.language === 'ar'
    ? `${buildProjectSummary(ctx)}
اقترح 3 إلى 5 تحسينات مستقبلية واقعية يمكن تنفيذها في المشروع لاحقاً.
الهيكل المطلوب: فقرة افتتاحية قصيرة ثم نقطة لكل تحسين (ما هو / قيمته للمستخدم / ما يحتاجه). الطول الكلي: حوالي ${CHAPTER_WORD_COUNTS.whatNext} كلمة.`
    : `${buildProjectSummary(ctx)}
הצע 3 עד 5 שיפורים עתידיים ריאליסטיים שניתן לממש בהמשך הפרויקט.
מבנה חובה: פסקת פתיחה קצרה → ואחריה נקודה לכל שיפור (מה הוא / ערכו למשתמש / מה נדרש). אורך כולל: כ-${CHAPTER_WORD_COUNTS.whatNext} מילים.`,

  appendices: (ctx) => {
    const methodNames = ctx.classes
      .filter((c) => !c.isExcluded)
      .flatMap((c) => c.methods.filter((m) => m.isExplainInAppendix))
      .map((m) => m.name)
      .join(', ') || (ctx.language === 'ar' ? 'لم تُحدد طرق' : 'לא סומנו שיטות');
    if (ctx.language === 'ar') {
      return `${buildProjectSummary(ctx)}
الفصول للملحق (الطرق المعقدة):
${methodNames}
اكتب ملحقاً قصيراً يشرح الطرق المعقدة (إن وُجدت).
الهيكل المطلوب: فقرة قصيرة ثم نقطة لكل طريقة. الطول الكلي: حوالي ${CHAPTER_WORD_COUNTS.appendices} كلمة.`;
    }
    return `${buildProjectSummary(ctx)}
מחלקות ל-Appendix (שיטות מורכבות):
${methodNames}
כתוב נספח קצר עם הסברים על שיטות מורכבות (אם סומנו).
מבנה חובה: פסקה קצרה → ואחריה נקודה לכל שיטה. אורך כולל: כ-${CHAPTER_WORD_COUNTS.appendices} מילים.`;
  },
};

export async function generateChapter(
  chapterKey: ChapterKey,
  ctx: GenerationContext,
): Promise<AiTextResult> {
  const systemPrompt = buildSystemPrompt(ctx.language);
  const basePrompt = CHAPTER_PROMPTS[chapterKey](ctx);
  // Arabic suffix (placed AFTER the Hebrew context so the model reads it last and obeys it).
  // A prefix alone is not enough — the Hebrew task instructions at the end override it.
  const userPrompt = ctx.language === 'ar'
    ? `${basePrompt}\n\n⚠️ تعليمات اللغة — إلزامية: اكتب كامل إجابتك باللغة العربية الفصحى فقط. جميع العناوين (## و ###) يجب أن تكون بالعربية حصراً. ممنوع تماماً كتابة أي كلمة أو جملة بالعبرية في النص أو العناوين أو أي مكان آخر.`
    : basePrompt;
  return callAI(ctx.provider, ctx.apiKey, ctx.model, ctx.azureCfg, systemPrompt, userPrompt, ctx.ollamaBaseUrl);
}

// ─── Diagram generators (Mermaid) ─────────────────────────────────────────

export async function generateUmlDiagram(ctx: GenerationContext): Promise<AiTextResult> {
  const systemPrompt = buildSystemPrompt(ctx.language);
  const label = ctx.language === 'ar' ? 'الفصول:' : 'מחלקות:';
  const instruction = ctx.language === 'ar'
    ? 'أنشئ كود Mermaid صحيحاً لمخطط الفصول (classDiagram). أدرج فقط كود Mermaid، بدون شرح.'
    : 'צור קוד Mermaid תקני לדיאגרמת מחלקות (classDiagram). הכנס רק את קוד Mermaid, ללא הסברים.';
  const userPrompt = `${label}\n${classesToContext(ctx.classes)}\n${instruction}`;
  return callAI(ctx.provider, ctx.apiKey, ctx.model, ctx.azureCfg, systemPrompt, userPrompt, ctx.ollamaBaseUrl);
}

// ─── Class descriptions (issue: remove hardcoded fallback) ────────────────

/**
 * Parses a structured AI response into a map of class/method descriptions.
 * Format the AI is asked to respond in:
 *   CLASS ClassName: <description>
 *   METHOD ClassName.methodName: <description>
 */
export function parseClassDescriptions(
  response: string,
): Record<string, { classDesc: string; methods: Record<string, string> }> {
  const result: Record<string, { classDesc: string; methods: Record<string, string> }> = {};
  for (const raw of response.split('\n')) {
    const line = raw.trim();
    const classMatch = line.match(/^CLASS\s+(\w+)\s*:\s*(.+)/);
    if (classMatch) {
      const [, name, desc] = classMatch;
      if (!result[name]) result[name] = { classDesc: '', methods: {} };
      result[name].classDesc = desc.trim();
      continue;
    }
    const methodMatch = line.match(/^METHOD\s+(\w+)\.(\w+)\s*:\s*(.+)/);
    if (methodMatch) {
      const [, className, methodName, desc] = methodMatch;
      if (!result[className]) result[className] = { classDesc: '', methods: {} };
      result[className].methods[methodName] = desc.trim();
    }
  }
  return result;
}

/**
 * Calls the AI once to generate brief descriptions for all non-excluded classes
 * and their methods. Returns a map keyed by class name.
 * Silently returns {} on any failure.
 */
export async function generateClassDescriptions(
  ctx: GenerationContext,
): Promise<{ descriptions: Record<string, { classDesc: string; methods: Record<string, string> }>; usage?: AiUsageStats }> {
  const active = ctx.classes.filter((c) => !c.isExcluded);
  if (active.length === 0) return { descriptions: {} };

  const systemPrompt = buildSystemPrompt(ctx.language);

  const classList = active.map((c) => {
    const methods = c.methods.map((m) => m.name).join(', ');
    return `${c.name}${methods ? ': ' + methods : ''}`;
  }).join('\n');

  const userPrompt = ctx.language === 'ar'
    ? `[مهم: اكتب كامل إجابتك باللغة العربية الفصحى فقط.]

اكتب وصفًا موجزًا باللغة العربية لكل فصل وطريقة. جملة واحدة أو جملتان لكل عنصر.

قائمة الفصول والطرق:
${classList}

لكل فصل وطريقة، اكتب وصفًا بالتنسيق التالي (سطر واحد لكل عنصر):
CLASS ClassName: <وصف>
METHOD ClassName.methodName: <وصف>`
    : `כתוב את התיאורים בעברית. משפט אחד עד שניים לכל מחלקה ושיטה.

רשימת מחלקות ושיטות:
${classList}

עבור כל מחלקה ושיטה, כתוב תיאור קצר בפורמט הבא (שורה אחת לכל פריט):
CLASS ClassName: <תיאור>
METHOD ClassName.methodName: <תיאור>`;

  try {
    const result = await callAI(ctx.provider, ctx.apiKey, ctx.model, ctx.azureCfg, systemPrompt, userPrompt, ctx.ollamaBaseUrl);
    return { descriptions: parseClassDescriptions(result.text), usage: result.usage };
  } catch {
    return { descriptions: {} };
  }
}

export async function generateErdDiagram(ctx: GenerationContext): Promise<AiTextResult> {
  const systemPrompt = buildSystemPrompt(ctx.language);
  const label = ctx.language === 'ar' ? 'الجداول:' : 'טבלאות:';
  const instruction = ctx.language === 'ar'
    ? 'أنشئ كود Mermaid صحيحاً لمخطط ERD (erDiagram). أدرج فقط كود Mermaid، بدون شرح.'
    : 'צור קוד Mermaid תקני ל-ERD (erDiagram). הכנס רק את קוד Mermaid, ללא הסברים.';
  const userPrompt = `${label}\n${tablesToContext(ctx.tables)}\n\nSTRICT RULES:\n- Use ONLY the table names and column names listed above.\n- If a table shows "[no column info available]", draw that table as an entity with NO attributes.\n- Do NOT invent, guess, or add any column names or relationships that are not explicitly listed above.\n- Do NOT add Id, CreatedAt, UpdatedAt or any other column unless it appears in the list above.\n- Only draw relationships (||--||, ||--|{) if a FK column is explicitly shown above.\n\n${instruction}`;
  return callAI(ctx.provider, ctx.apiKey, ctx.model, ctx.azureCfg, systemPrompt, userPrompt, ctx.ollamaBaseUrl);
}




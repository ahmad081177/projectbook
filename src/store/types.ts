// All types for the entire application. Other files import from here.

export type Language = 'he' | 'ar';
export type ProjectType = 'blazor' | 'wpf' | 'winforms' | 'android' | 'other';
export type AiProvider = 'gemini' | 'azure-openai';

/** Well-known Gemini model IDs — typed as string to also allow custom names. */
export type GeminiModel = string;

export const KNOWN_GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
] as const;
export type ChapterKey =
  | 'introduction'
  | 'techStack'
  | 'systemAnalysis'
  | 'database'
  | 'serverImplementation'
  | 'clientImplementation'
  | 'userGuide'
  | 'reflection'
  | 'difficulties'
  | 'whatNext'
  | 'appendices';
export type SectionStatus =
  | 'idle'
  | 'generating'
  | 'review-needed'
  | 'complete'
  | 'failed'
  | 'skipped';

export interface DatabaseSchema {
  source: 'access' | 'mssql' | 'sql' | 'manual';
  tables: DatabaseTable[];
}

export interface DatabaseTable {
  name: string;
  description?: string;
  columns: DatabaseColumn[];
}

export interface DatabaseColumn {
  name: string;
  type: string;
  nullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  referencesTable?: string;
  referencesColumn?: string;
  description?: string;
}

export interface CSharpClass {
  filePath: string;
  namespace: string;
  name: string;
  accessModifier: string;
  isAbstract: boolean;
  isInterface: boolean;
  baseClass?: string;
  interfaces: string[];
  properties: ClassProperty[];
  methods: ClassMethod[];
  fields: ClassField[];
  xmlDocComment?: string;
  isExcluded: boolean;
}

export interface ClassProperty {
  name: string;
  type: string;
  accessModifier: string;
}

export interface ClassMethod {
  name: string;
  returnType: string;
  parameters: string[];
  accessModifier: string;
  isKeySnippet: boolean;
  isExplainInAppendix: boolean;
  xmlDocComment?: string;
}

export interface ClassField {
  name: string;
  type: string;
  accessModifier: string;
}

export interface Screenshot {
  id: string;
  caption: string;
  screenName: string;
  userType: 'admin' | 'regular' | 'both';
  thumbnailUrl: string;
  file: File | null; // null after page refresh — File is not serialisable
}

export interface GeneratedChapter {
  content: string;
  status: SectionStatus;
  lastGenerated?: string;
}

export interface DiagramData {
  mermaidCode: string;
  pngDataUrl?: string;
  description?: string;
  status: SectionStatus;
}

// ── Slice state shapes ─────────────────────────────────────────

export interface OnboardingSlice {
  language: Language;
  aiProvider: AiProvider;
  geminiApiKey: string;        // never persisted to storage (NFR6)
  geminiModel: GeminiModel;
  // Azure OpenAI fields
  azureEndpoint: string;       // e.g. https://<resource>.openai.azure.com
  azureApiKey: string;         // never persisted to storage
  azureDeploymentName: string; // e.g. gpt-4o
  azureApiVersion: string;     // e.g. 2024-02-01
  studentName: string;
  projectType: ProjectType | null;
  completedStep: number; // -1 = wizard not started
}

export interface ExtractionSlice {
  dbSchema: DatabaseSchema | null;
  classes: CSharpClass[];
  screenshots: Screenshot[];
  extractionErrors: Record<string, string>;
}

export interface GenerationSlice {
  generatedContent: Record<ChapterKey, GeneratedChapter>;
  diagrams: Record<'uml' | 'erd' | 'dfd' | 'usecase', DiagramData>;
  generationQueue: ChapterKey[];
  isGenerating: boolean;
}

export interface ExportSlice {
  previewHtml: string;
  exportStatus: 'idle' | 'assembling' | 'done' | 'error';
  lastExportDate?: string;
}

export type AppState = OnboardingSlice & ExtractionSlice & GenerationSlice & ExportSlice;

import type { CSharpClass, ClassProperty, ClassMethod, ClassField } from '../../store/types';

// Files to automatically exclude from analysis
const AUTO_EXCLUDE_PATTERNS = [
  /[\\/]Migrations[\\/]/i,
  /\.Designer\.cs$/i,
  /\.g\.cs$/i,
  /\.g\.i\.cs$/i,
  /[\\/](bin|obj|\.vs|node_modules|test|tests|spec|specs)[\\/]/i,
  /AssemblyInfo\.cs$/i,
  /GlobalUsings\.cs$/i,
];

export function shouldAutoExclude(filePath: string): boolean {
  return AUTO_EXCLUDE_PATTERNS.some((pat) => pat.test(filePath));
}

// ─── Regex patterns ────────────────────────────────────────────────────────

const NAMESPACE_RE =
  /^namespace\s+([\w.]+)\s*[;{]/m;

const CLASS_RE =
  /(?:^|\n)\s*((?:\/\/\/.*\n\s*)*)(public|internal|protected|private)?\s*(abstract\s+)?(sealed\s+)?(partial\s+)?(class|interface|record|struct)\s+(\w+)(?:<[^>]+>)?\s*(?::\s*([^{]+?))?\s*\{/g;

const PROPERTY_RE =
  /^\s*(public|protected|internal|private|protected\s+internal|private\s+protected)\s+((?:static|virtual|override|abstract|sealed|new|readonly|required)\s+)*([^\s{;]+(?:<[^>]+>)?(?:\[\])*(?:\?)?)\s+(\w+)\s*\{\s*(?:get|set|init)/gm;

const METHOD_RE =
  /^\s*(public|protected|internal|private|protected\s+internal|private\s+protected)\s+((?:static|virtual|override|abstract|sealed|new|async|partial)\s+)*((?:Task|ValueTask|IEnumerable|IAsyncEnumerable)?(?:<[^>]+>)?[^\s(]+)\s+(\w+)\s*(?:<[^>]+>)?\s*\(([^)]*)\)/gm;

const FIELD_RE =
  /^\s*(public|protected|internal|private|protected\s+internal|private\s+protected)\s+((?:static|readonly|const|volatile|new)\s+)*([^\s=;{]+(?:<[^>]+>)?(?:\[\])*(?:\?)?)\s+(_\w+|\w+)\s*[=;]/gm;

const XML_DOC_RE = /((^\s*\/\/\/[^\n]*\n)+)/gm;

// ─── Parsing helpers ───────────────────────────────────────────────────────

function parseProperties(body: string): ClassProperty[] {
  const props: ClassProperty[] = [];
  let m: RegExpExecArray | null;
  PROPERTY_RE.lastIndex = 0;
  while ((m = PROPERTY_RE.exec(body)) !== null) {
    props.push({
      accessModifier: m[1].trim(),
      type: m[3].trim(),
      name: m[4],
    });
  }
  return props;
}

function parseMethods(body: string): ClassMethod[] {
  const methods: ClassMethod[] = [];
  let m: RegExpExecArray | null;
  METHOD_RE.lastIndex = 0;
  while ((m = METHOD_RE.exec(body)) !== null) {
    const name = m[4];
    // Exclude property-like (get_, set_...) accessors and constructor-like patterns
    if (name === 'get' || name === 'set' || name === 'init') continue;
    const params = m[5]
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    methods.push({
      accessModifier: m[1].trim(),
      returnType: m[3].trim(),
      name,
      parameters: params,
      isKeySnippet: false,
      isExplainInAppendix: false,
    });
  }
  return methods;
}

function parseFields(body: string): ClassField[] {
  const fields: ClassField[] = [];
  let m: RegExpExecArray | null;
  FIELD_RE.lastIndex = 0;
  while ((m = FIELD_RE.exec(body)) !== null) {
    const name = m[4];
    // Skip if name looks like a type (starts with uppercase) — likely a false match
    if (/^[A-Z]/.test(name)) continue;
    fields.push({
      accessModifier: m[1].trim(),
      type: m[3].trim(),
      name,
    });
  }
  return fields;
}

/**
 * Extracts the body of a class/interface from the text starting at openBrace.
 * Returns the substring between the matching braces.
 */
function extractBody(text: string, startIndex: number): string {
  let depth = 0;
  let i = startIndex;
  while (i < text.length) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') {
      depth--;
      if (depth === 0) return text.slice(startIndex, i + 1);
    }
    i++;
  }
  return text.slice(startIndex);
}

/** Strip C-style comments and string literals for safer regex matching */
function stripCommentsAndStrings(code: string): string {
  // Remove multi-line comments
  let result = code.replace(/\/\*[\s\S]*?\*\//g, (m) => ' '.repeat(m.length));
  // Remove single-line comments (but preserve /// doc comments — we need them)
  result = result.replace(/(?<!\/)(\/\/(?!\/)[^\n]*)/g, (m) => ' '.repeat(m.length));
  // Remove string literals
  result = result.replace(/"(?:[^"\\]|\\.)*"/g, '""');
  result = result.replace(/@"[^"]*"/g, '""');
  return result;
}

// ─── Public API ────────────────────────────────────────────────────────────

/** Parse a single .cs file's text and extract all class/interface declarations */
export function parseCSharpFile(filePath: string, content: string): CSharpClass[] {
  const namespaceMatch = NAMESPACE_RE.exec(content);
  const namespace = namespaceMatch ? namespaceMatch[1] : '';

  const stripped = stripCommentsAndStrings(content);

  // Extract XML doc comment blocks from original content
  const docBlocks = new Map<number, string>();
  let dm: RegExpExecArray | null;
  XML_DOC_RE.lastIndex = 0;
  while ((dm = XML_DOC_RE.exec(content)) !== null) {
    docBlocks.set(dm.index + dm[0].length, dm[0].trim());
  }

  const classes: CSharpClass[] = [];
  CLASS_RE.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = CLASS_RE.exec(stripped)) !== null) {
    const accessModifier = match[2] ?? 'internal';
    const isAbstract = !!match[3];
    const kind = match[6]; // 'class' | 'interface' | 'record' | 'struct'
    const name = match[7];
    const inheritance = match[8] ?? '';

    const isInterface = kind === 'interface';

    // Parse base class and interfaces from inheritance clause
    const inheritanceParts = inheritance
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const baseClass = !isInterface && inheritanceParts.length > 0 && !inheritanceParts[0].startsWith('I')
      ? inheritanceParts[0]
      : undefined;
    const interfaces = inheritanceParts.filter(
      (p) => p.startsWith('I') || isInterface || p === baseClass ? false : true,
    );

    // Find brace opening in original (not stripped) for accurate body extraction
    const braceIdx = match.index + match[0].lastIndexOf('{');
    const body = extractBody(content, braceIdx);

    // Find nearest XML doc comment above this position
    let xmlDocComment: string | undefined;
    for (const [endPos, doc] of docBlocks) {
      if (endPos <= match.index && match.index - endPos < 200) {
        xmlDocComment = doc;
      }
    }

    const isExcluded = shouldAutoExclude(filePath);

    classes.push({
      filePath,
      namespace,
      name,
      accessModifier,
      isAbstract,
      isInterface,
      baseClass,
      interfaces,
      properties: parseProperties(body),
      methods: parseMethods(body),
      fields: parseFields(body),
      xmlDocComment,
      isExcluded,
    });
  }

  return classes;
}

/** Parse multiple .cs files and return a flat list of all classes */
export function parseCSharpFiles(
  files: Array<{ path: string; content: string }>,
): CSharpClass[] {
  return files.flatMap(({ path, content }) => parseCSharpFile(path, content));
}


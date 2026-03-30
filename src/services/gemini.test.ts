import { describe, it, expect } from 'vitest';
import { buildProjectSummary, tablesToContext } from './gemini';
import type { GenerationContext } from './gemini';
import type { CSharpClass, DatabaseTable } from '../store/types';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeClass(name: string, filePath = 'src/SomeFile.cs', overrides: Partial<CSharpClass> = {}): CSharpClass {
  return {
    filePath,
    namespace: 'App',
    name,
    accessModifier: 'public',
    isAbstract: false,
    isInterface: false,
    interfaces: [],
    properties: [],
    methods: [],
    fields: [],
    isExcluded: false,
    ...overrides,
  };
}

function makeTable(name: string): DatabaseTable {
  return { name, columns: [] };
}

function makeCtx(classes: CSharpClass[], overrides: Partial<GenerationContext> = {}): GenerationContext {
  return {
    provider: 'gemini',
    apiKey: 'test-key',
    model: 'gemini-2.0-flash',
    azureCfg: null,
    language: 'he',
    studentName: 'ישראל ישראלי',
    projectType: 'other',
    classes,
    tables: [],
    screenshots: [],
    ...overrides,
  };
}

// ── detectTechStack (via buildProjectSummary) ─────────────────────────────────

describe('detectTechStack', () => {
  it('detects ASP.NET Web API from class name containing "Controller"', () => {
    const ctx = makeCtx([makeClass('ProductsController')]);
    expect(buildProjectSummary(ctx)).toContain('ASP.NET Web API');
  });

  it('detects ASP.NET Web API from "ApiController" class name', () => {
    const ctx = makeCtx([makeClass('BaseApiController')]);
    expect(buildProjectSummary(ctx)).toContain('ASP.NET Web API');
  });

  it('detects Blazor from class name containing "ComponentBase"', () => {
    const ctx = makeCtx([makeClass('MyComponentBase')]);
    expect(buildProjectSummary(ctx)).toContain('Blazor');
  });

  it('detects Blazor from .razor file extension in filePath', () => {
    const ctx = makeCtx([makeClass('MyCounter', 'pages/Counter.razor')]);
    expect(buildProjectSummary(ctx)).toContain('Blazor');
  });

  it('detects WPF from class name containing "Window"', () => {
    const ctx = makeCtx([makeClass('MainWindow')]);
    expect(buildProjectSummary(ctx)).toContain('WPF');
  });

  it('detects WPF from class name containing "ViewModel"', () => {
    const ctx = makeCtx([makeClass('UserViewModel')]);
    expect(buildProjectSummary(ctx)).toContain('WPF');
  });

  it('detects WinForms from class name containing "Form"', () => {
    const ctx = makeCtx([makeClass('LoginForm')]);
    expect(buildProjectSummary(ctx)).toContain('WinForms');
  });

  it('detects Android from class name containing "Activity"', () => {
    const ctx = makeCtx([makeClass('MainActivity')]);
    expect(buildProjectSummary(ctx)).toContain('Android');
  });

  it('detects Android from class name containing "Fragment"', () => {
    const ctx = makeCtx([makeClass('HomeFragment')]);
    expect(buildProjectSummary(ctx)).toContain('Android');
  });

  it('falls back to "אחר" when no pattern matches', () => {
    const ctx = makeCtx([makeClass('DataService'), makeClass('UserRepository')]);
    expect(buildProjectSummary(ctx)).toContain('אחר');
  });

  it('returns "אחר" for empty class list', () => {
    const ctx = makeCtx([]);
    expect(buildProjectSummary(ctx)).toContain('אחר');
  });
});

// ── buildProjectSummary ───────────────────────────────────────────────────────

describe('buildProjectSummary', () => {
  it('includes the student name', () => {
    const ctx = makeCtx([], { studentName: 'דנה כהן' });
    expect(buildProjectSummary(ctx)).toContain('דנה כהן');
  });

  it('includes project type label for WPF', () => {
    const ctx = makeCtx([], { projectType: 'wpf' });
    expect(buildProjectSummary(ctx)).toContain('WPF');
  });

  it('includes project type label for WinForms', () => {
    const ctx = makeCtx([], { projectType: 'winforms' });
    expect(buildProjectSummary(ctx)).toContain('WinForms');
  });

  it('includes project type label for Android', () => {
    const ctx = makeCtx([], { projectType: 'android' });
    expect(buildProjectSummary(ctx)).toContain('Android');
  });

  it('includes project type label for Blazor', () => {
    const ctx = makeCtx([], { projectType: 'blazor' });
    expect(buildProjectSummary(ctx)).toContain('Blazor');
  });

  it('shows "לא ידוע" when projectType is null', () => {
    const ctx = makeCtx([], { projectType: null });
    expect(buildProjectSummary(ctx)).toContain('לא ידוע');
  });

  it('includes top 5 non-excluded class names', () => {
    const classes = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta'].map((n) => makeClass(n));
    const ctx = makeCtx(classes);
    const summary = buildProjectSummary(ctx);
    expect(summary).toContain('Alpha');
    expect(summary).toContain('Epsilon');
    expect(summary).not.toContain('Zeta'); // 6th class should be omitted
  });

  it('excludes classes with isExcluded=true from the top-5 list', () => {
    const classes = [
      makeClass('Hidden', 'src/Hidden.cs', { isExcluded: true }),
      makeClass('Visible'),
    ];
    const ctx = makeCtx(classes);
    expect(buildProjectSummary(ctx)).toContain('Visible');
    expect(buildProjectSummary(ctx)).not.toContain('Hidden');
  });

  it('shows "לא זוהו" when all classes are excluded', () => {
    const ctx = makeCtx([makeClass('X', 'X.cs', { isExcluded: true })]);
    expect(buildProjectSummary(ctx)).toContain('לא זוהו');
  });

  it('includes table count and table names', () => {
    const ctx = makeCtx([], {
      tables: [makeTable('Users'), makeTable('Orders'), makeTable('Products')],
    });
    const summary = buildProjectSummary(ctx);
    expect(summary).toContain('3');
    expect(summary).toContain('Users');
    expect(summary).toContain('Orders');
    expect(summary).toContain('Products');
  });

  it('shows "אין" for tables when table list is empty', () => {
    const ctx = makeCtx([], { tables: [] });
    expect(buildProjectSummary(ctx)).toContain('0 טבלאות');
    expect(buildProjectSummary(ctx)).toContain('אין');
  });

  it('includes screenshot count when screenshots are present', () => {
    const ctx = makeCtx([], {
      screenshots: [
        { screenName: 'Login', caption: 'מסך כניסה', userType: 'both' },
        { screenName: 'Dashboard', caption: 'לוח בקרה', userType: 'admin' },
      ],
    });
    const summary = buildProjectSummary(ctx);
    expect(summary).toContain('2');
    expect(summary).toContain('Login');
    expect(summary).toContain('Dashboard');
  });

  it('shows "אין" for screenshot names when screenshots list is empty', () => {
    const ctx = makeCtx([], { screenshots: [] });
    const summary = buildProjectSummary(ctx);
    expect(summary).toContain('0');
    expect(summary).toContain('אין');
  });

  it('output contains Hebrew section delimiters', () => {
    const summary = buildProjectSummary(makeCtx([]));
    expect(summary).toContain('── פרטי הפרויקט ──');
    expect(summary).toContain('──────────────────');
  });
});

// ── tablesToContext (Story 6-2) ───────────────────────────────────────────────

describe('tablesToContext', () => {
  it('emits [no column info available] for a table with no columns', () => {
    const tables: DatabaseTable[] = [{ name: 'Users', columns: [] }];
    const ctx = tablesToContext(tables);
    expect(ctx).toContain('[no column info available');
  });

  it('emits column names and types when columns are present', () => {
    const tables: DatabaseTable[] = [
      {
        name: 'Orders',
        columns: [
          { name: 'OrderId', type: 'INTEGER', nullable: false, isPrimaryKey: true, isForeignKey: false },
          { name: 'UserId', type: 'INTEGER', nullable: false, isPrimaryKey: false, isForeignKey: true, referencesTable: 'Users' },
          { name: 'Amount', type: 'DECIMAL', nullable: true, isPrimaryKey: false, isForeignKey: false },
        ],
      },
    ];
    const ctx = tablesToContext(tables);
    expect(ctx).toContain('TABLE Orders');
    expect(ctx).toContain('OrderId');
    expect(ctx).toContain('PK');
    expect(ctx).toContain('FK→Users');
    expect(ctx).toContain('Amount');
  });

  it('renders multiple tables separated by blank lines', () => {
    const tables: DatabaseTable[] = [
      { name: 'A', columns: [] },
      { name: 'B', columns: [] },
    ];
    const ctx = tablesToContext(tables);
    expect(ctx).toContain('TABLE A');
    expect(ctx).toContain('TABLE B');
  });

  it('returns empty string for empty table list', () => {
    expect(tablesToContext([])).toBe('');
  });
});

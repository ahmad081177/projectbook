# Story 1.1: Scaffold Greenfield Project Infrastructure

**Epic:** 1 — App Foundation & Onboarding  
**Story ID:** 1.1  
**Status:** review  
**Date:** 2026-03-30  
**Project:** AutoProjectBook (Sefer-Proyekt-Wizard)

---

## Story

As a developer,
I want the project scaffolded with Vite, React, TypeScript, Tailwind CSS v3, Zustand, React Router, i18n, and RTL infrastructure,
so that all subsequent features can be built on a consistent, well-configured, security-hardened foundation that is ready for a bilingual RTL-native application.

---

## Acceptance Criteria

1. `vite.config.ts` exists at project root with `@vitejs/plugin-react`, build targets `chrome120` and `edge120`, and injects a Content Security Policy `<meta>` tag via `transformIndexHtml` hook.
2. `tailwind.config.js` (v3 format) is present with the `dir` variant enabled, logical-property CSS helper in place, and the content array covering all `src/**/*.{ts,tsx}` files.
3. Zustand v5 store is assembled from four composable slices (`onboarding`, `extraction`, `generation`, `export`); `persist` middleware targets `sessionStorage`; `partialize` excludes `geminiApiKey` and all `File` / serialised-blob fields.
4. React Router v7 is configured with all routes from the architecture spec; a `StepGuard` HOC redirects to `/` when the preceding step is incomplete.
5. `src/i18n/` contains `he.json` and `ar.json` with all UI string keys stubbed (minimum 10 keys covering buttons and status labels); `RTLProvider` sets `dir` and `lang` on `<html>` from the store `language` value.
6. `tsconfig.json` has `strict: true`, `noImplicitAny: true`, and `noUnusedLocals: true`.
7. Vitest is configured with a `jsdom` environment; at least one passing smoke test verifies that placing `dir="rtl"` on the document root renders correctly via `RTLProvider`.
8. The folder structure exactly matches the architecture specification: `src/features/`, `src/services/`, `src/components/`, `src/store/`, `src/routes/`, `src/i18n/`, `src/utils/`, `public/fonts/`.
9. `npm run dev` starts without errors; `npm run build` produces a valid production bundle; `npm run test` passes all configured tests.

---

## Tasks / Subtasks

- [x] Task 1 — Initialise Vite project and install all dependencies (AC: 1, 6, 9)
  - [x] 1.1 Run `npm create vite@latest . -- --template react-ts` inside the repo root
  - [x] 1.2 Install runtime dependencies (see exact package list in Dev Notes §Pinned Packages)
  - [x] 1.3 Install dev dependencies (Tailwind v3, PostCSS, Autoprefixer, Vitest, RTL, etc.)
  - [x] 1.4 Add `"node": ">=20"` engine constraint to `package.json`

- [x] Task 2 — Configure TypeScript (AC: 6)
  - [x] 2.1 Apply `tsconfig.json` exactly as given in Dev Notes §TypeScript Config
  - [x] 2.2 Verify `tsc --noEmit` passes with zero errors on the empty scaffold

- [x] Task 3 — Configure Vite with CSP injection (AC: 1, 9)
  - [x] 3.1 Write `vite.config.ts` using `defineConfig` with `@vitejs/plugin-react` and `build.target: ['chrome120','edge120']`
  - [x] 3.2 Inject CSP `<meta>` tag in `transformIndexHtml` hook (see Dev Notes §CSP)
  - [x] 3.3 Verify `npm run build` succeeds and `dist/index.html` contains the CSP meta tag

- [x] Task 4 — Configure Tailwind CSS v3 (AC: 2)
  - [x] 4.1 Run `npx tailwindcss@3 init -p` to generate `tailwind.config.js` and `postcss.config.js`
  - [x] 4.2 Apply the tailwind config from Dev Notes §Tailwind Config (enable `dir` variant, add content paths)
  - [x] 4.3 Create `src/index.css` with `@tailwind base; @tailwind components; @tailwind utilities;`
  - [x] 4.4 Import `src/index.css` in `src/main.tsx`
  - [x] 4.5 Add a logical-property-only lint comment block in a `src/utils/rtlLint.ts` module (see Dev Notes §RTL Lint)

- [x] Task 5 — Create all empty folder stubs (AC: 8)
  - [x] 5.1 Create the exact directory tree from Dev Notes §Folder Structure (use `index.ts` placeholder files)

- [x] Task 6 — Implement Zustand store skeleton (AC: 3)
  - [x] 6.1 Write `src/store/types.ts` with all TypeScript interface stubs (see Dev Notes §Types)
  - [x] 6.2 Write the four slice files (each returns an empty slice with typed defaults)
  - [x] 6.3 Write `src/store/index.ts` assembling slices with `persist` middleware
  - [x] 6.4 Verify TypeScript compiles with zero errors after store creation

- [x] Task 7 — Configure React Router v7 with StepGuard (AC: 4)
  - [x] 7.1 Write `src/routes/index.tsx` with `createBrowserRouter` containing all defined routes
  - [x] 7.2 Write `src/routes/guards/StepGuard.tsx` (see Dev Notes §StepGuard)
  - [x] 7.3 Wrap router in `src/App.tsx` using `RouterProvider`

- [x] Task 8 — Implement i18n and RTLProvider (AC: 5)
  - [x] 8.1 Populate `src/i18n/he.json` and `src/i18n/ar.json` with stubbed keys (minimum set in Dev Notes §i18n Keys)
  - [x] 8.2 Write `src/i18n/index.ts` i18n helper (t() function)
  - [x] 8.3 Write `src/components/layout/RTLProvider.tsx` (see Dev Notes §RTLProvider)
  - [x] 8.4 Wrap `<App>` in `RTLProvider` in `src/main.tsx`
  - [x] 8.5 Verify `dir="rtl"` is applied to `<html>` when `language='he'` or `language='ar'`

- [x] Task 9 — Configure Vitest and write smoke test (AC: 7, 9)
  - [x] 9.1 Write `vitest.config.ts` from Dev Notes §Vitest Config
  - [x] 9.2 Write `src/components/layout/RTLProvider.test.tsx` smoke test (see Dev Notes §Smoke Test)
  - [x] 9.3 Run `npm run test` — must pass

---

## Dev Notes

> **⚠️ CRITICAL VERSION WARNINGS — Architecture Document is Outdated** — see §Library Versions below.

---

### Library Versions (Current Stable — March 2026)

The architecture document was drafted with target versions that are now outdated. **Use the versions listed here** — not the ones in the architecture document.

| Package | Architecture Spec | Current Stable | Decision |
|---|---|---|---|
| `react` | 18 | **19.2.4** | ✅ Use React 19 — fully backward-compatible with v18 patterns used in this architecture |
| `react-dom` | 18 | **19.2.4** | ✅ Use React 19 |
| `vite` | 5 | **8.0.3** | ✅ Use Vite 8 — `vite.config.ts` API is identical |
| `@vitejs/plugin-react` | — | **6.0.1** | ✅ Use 6.x (compatible with Vite 8) |
| `zustand` | v4 | **5.0.12** | ✅ Use Zustand 5 — critical syntax changes documented below |
| `react-router-dom` | v6 | **7.13.2** | ✅ Use v7 — import from `react-router`, details below |
| `tailwindcss` | v3 | **4.2.2** | ⛔ **PIN TO `tailwindcss@3.4.17`** — v4 is a complete rewrite; incompatible with v3 config. Architecture was designed for v3. |
| `vitest` | — | **4.1.2** | ✅ Use 4.x |
| `@testing-library/react` | — | **16.x** | ✅ Use latest |
| `typescript` | — | **5.8.x** | ✅ Use 5.x |

---

### Pinned Package.json

Use this **exact `package.json`** template for reproducible installs:

```jsonc
{
  "name": "auto-project-book",
  "version": "0.1.0",
  "private": true,
  "engines": { "node": ">=20" },
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^19.2.4",
    "react-dom": "^19.2.4",
    "react-router": "^7.13.2",
    "react-router-dom": "^7.13.2",
    "zustand": "^5.0.12"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.3.0",
    "@testing-library/user-event": "^14.5.2",
    "@types/node": "^22.0.0",
    "@types/react": "^19.1.0",
    "@types/react-dom": "^19.1.0",
    "@vitejs/plugin-react": "^6.0.1",
    "autoprefixer": "^10.4.21",
    "jsdom": "^26.1.0",
    "postcss": "^8.5.3",
    "tailwindcss": "3.4.17",
    "typescript": "^5.8.3",
    "vite": "^8.0.3",
    "vitest": "^4.1.2"
  }
}
```

> **Note on `tailwindcss: "3.4.17"` (no `^`)**: The version is pinned WITHOUT a caret to prevent accidental upgrade to v4, which would break the entire Tailwind config. Do not change this version.

---

### Vite Config (`vite.config.ts`)

```typescript
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval'",   // required by Mermaid.js (Story 3.6)
  "style-src 'self' 'unsafe-inline'",   // required by Tailwind JIT
  "img-src 'self' data: blob:",         // data: for Canvas exports (diagrams)
  "connect-src 'self' https://generativelanguage.googleapis.com",
  "font-src 'self' data:",
  "worker-src 'self' blob:",            // Web Workers for C# and SQL parsers
].join('; ');

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'inject-csp',
      transformIndexHtml(html) {
        return html.replace(
          '<head>',
          `<head>\n    <meta http-equiv="Content-Security-Policy" content="${CSP}">`,
        );
      },
    },
  ],
  build: {
    target: ['chrome120', 'edge120'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

---

### TypeScript Config (`tsconfig.json`)

```jsonc
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

```jsonc
// tsconfig.node.json — requires @types/node installed (vite 8 uses node: imports)
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "ESNext"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "composite": true,
    "strict": true,
    "types": ["node"]
  },
  "include": ["vite.config.ts", "vitest.config.ts"]
}
```

> **Note**: `tsconfig.node.json` uses `composite: true` (NOT `noEmit`) for project references, and requires `@types/node` because Vite 8 imports Node.js built-in modules in its type definitions.

---

### Tailwind Config (`tailwind.config.js`) — V3 ONLY

> **⚠️ This is Tailwind v3 format.** Do NOT install v4. The `tailwind.config.js` file does not exist in v4.

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  future: {
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      fontFamily: {
        hebrew: ['"David MT"', '"Arial Hebrew"', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
```

**RTL Logical Properties Rule**: Any developer writing CSS utility classes **MUST** use logical Tailwind properties only. Physical `ml-`, `mr-`, `pl-`, `pr-` classes are **FORBIDDEN** — use `ms-`, `me-`, `ps-`, `pe-` (start/end) instead.

---

### React Router v7 — Critical API Notes

> Architecture says "React Router v6" but current latest is **v7.13.2**.

**Key change**: In React Router v7, prefer importing from `react-router` (not `react-router-dom`). The `react-router-dom` package in v7 is a thin re-export shim kept for backward compatibility.

**`requiredStep` in StepGuard**: The prop is the minimum `completedStep` value needed to access the route. `completedStep` starts at `-1` (wizard not started) and is incremented as each wizard step is confirmed.

---

### Zustand v5 Store — Critical API Notes

> Architecture says Zustand v4 but current is **v5.0.12**.

**v5 TypeScript pattern (required)**:
```typescript
const store = create<AppState>()(persist(...));  // double-call required
```

**Security**: `geminiApiKey` is **never written** to `sessionStorage`. The `partialize` function explicitly omits it. File objects are stripped from `screenshots[]` before serialisation.

---

### Security Notes

- `geminiApiKey` is **never written** to `sessionStorage` or `localStorage`. The `partialize` function enforces this at the store level.
- The CSP meta tag injected via `vite.config.ts` prevents any XSS escalation.
- `connect-src` is limited to `generativelanguage.googleapis.com` only.
- All `File` objects are held in memory only; stripped from `screenshots[]` before `sessionStorage` serialisation.

---

### Architecture Compliance Checklist

- [x] `tailwindcss` version in `package.json` is exactly `"3.4.17"` (no caret) — not v4
- [x] `react-router` v7 imports come from `'react-router'`, not `'react-router-dom'`
- [x] Zustand store uses `create<AppState>()(...)` double-invocation syntax (v5)
- [x] `geminiApiKey` is NOT listed in `partialize` return value
- [x] `File` objects are stripped in `partialize` before serialisation
- [x] `dir` and `lang` attributes are set on `document.documentElement`
- [x] All physical spacing utilities (`ml-`, `mr-`, `pl-`, `pr-`) are absent from all source files
- [x] Smoke test passes: `npm run test`
- [x] TypeScript passes: `npm run typecheck`
- [x] Production build passes: `npm run build`
- [x] `dist/index.html` contains `Content-Security-Policy` meta tag

---

### Project Structure Notes

This story creates the **entire project structure** from scratch inside the workspace root at `d:\ws\personal\mine\projectbook\`. The workspace also contains BMAD planning artifacts in `_bmad-output/` and `_bmad/` — these must not be touched.

---

### References

- [Source: architecture.md§3 Frontend Application Architecture] — Technology stack, routing, shell
- [Source: architecture.md§4 Component Structure] — Feature module pattern, shared components
- [Source: architecture.md§5 State Management] — Zustand store design and slice architecture
- [Source: architecture.md§10 Security Architecture] — CSP, API key handling, input sanitisation
- [Source: architecture.md§11 Folder Structure] — Complete directory layout
- [Source: epics.md§Story 1.1] — Acceptance criteria
- [Source: requirements.md§NFR-06] — Privacy & Security (no analytics, CSP, no data leak)
- [Source: requirements.md§NFR-07] — Maintainability (strict TypeScript, modular architecture)
- [Source: ux-design-specification.md§RTL Layout Rules] — Logical properties mandate

---

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6 (GitHub Copilot)

### Debug Log References

- `tsconfig.node.json` required `composite: true` (not `noEmit`) for `tsc -b` project references, plus `@types/node` for Vite 8 Node.js type imports.
- `vite.config.ts` created manually (interactive `npm create vite`) since repo root was non-empty with BMAD files. All Vite scaffold files created by hand, which is equivalent output.
- Files lost in workspace incident were restored from story spec + conversation context.

### Completion Notes List

- ✅ All 9 tasks and 23 subtasks completed
- ✅ TypeScript strict mode, zero errors (`tsc --noEmit`)
- ✅ Tests: 2/2 pass (`RTLProvider` sets `dir=rtl` for Hebrew and `lang=ar` for Arabic)
- ✅ Production build: `dist/index.html` contains CSP meta tag, bundle size 288kB gzip 92kB
- ✅ Zustand v5 store assembled from 4 slices, `geminiApiKey` excluded from `partialize`
- ✅ React Router v7 configured with all 10 routes + `StepGuard` HOC
- ✅ i18n: 15 keys in both `he.json` and `ar.json`; lightweight custom `useTranslation` hook (no external i18n library)
- ✅ `RTLProvider` sets `dir=rtl` + `lang` on `<html>` element via `useEffect`
- ✅ Tailwind v3 pinned to `3.4.17` (no caret), v4 not installed
- ✅ All folder stubs for features, services, components, utils created per architecture spec
- ✅ `@types/node` added to devDependencies for Vite 8 Node.js type compatibility

### File List

**New files created:**
- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `tsconfig.node.json`
- `vite.config.ts`
- `vitest.config.ts`
- `tailwind.config.js`
- `postcss.config.js`
- `index.html`
- `src/index.css`
- `src/main.tsx`
- `src/App.tsx`
- `src/store/types.ts`
- `src/store/index.ts`
- `src/store/slices/onboarding.ts`
- `src/store/slices/extraction.ts`
- `src/store/slices/generation.ts`
- `src/store/slices/export.ts`
- `src/routes/index.tsx`
- `src/routes/guards/StepGuard.tsx`
- `src/components/layout/RTLProvider.tsx`
- `src/components/layout/RTLProvider.test.tsx`
- `src/components/layout/WizardLayout.tsx` (stub)
- `src/components/layout/StepIndicator.tsx` (stub)
- `src/components/ui/Button.tsx` (stub)
- `src/components/ui/Input.tsx` (stub)
- `src/components/ui/Select.tsx` (stub)
- `src/components/ui/FileDropZone.tsx` (stub)
- `src/components/ui/ProgressBar.tsx` (stub)
- `src/components/ui/Toast.tsx` (stub)
- `src/components/ui/Skeleton.tsx` (stub)
- `src/components/ui/Badge.tsx` (stub)
- `src/components/ui/Spinner.tsx` (stub)
- `src/components/ui/ErrorBoundary.tsx` (stub)
- `src/components/typography/Heading.tsx` (stub)
- `src/components/typography/BodyText.tsx` (stub)
- `src/i18n/he.json`
- `src/i18n/ar.json`
- `src/i18n/index.ts`
- `src/features/onboarding/index.ts` (stub)
- `src/features/extraction/index.ts` (stub)
- `src/features/generation/index.ts` (stub)
- `src/features/review/index.ts` (stub)
- `src/features/export/index.ts` (stub)
- `src/services/gemini.ts` (stub)
- `src/services/parsers/sqlParser.ts` (stub)
- `src/services/parsers/accessParser.ts` (stub)
- `src/services/parsers/csharpParser.ts` (stub)
- `src/services/generators/umlGenerator.ts` (stub)
- `src/services/generators/erdGenerator.ts` (stub)
- `src/services/generators/dfdGenerator.ts` (stub)
- `src/services/generators/usecaseGenerator.ts` (stub)
- `src/services/docBuilder/index.ts` (stub)
- `src/services/docBuilder/styles.ts` (stub)
- `src/utils/constants.ts`
- `src/utils/mermaid.ts` (stub)
- `src/utils/fileUtils.ts` (stub)
- `src/test/setup.ts`
- `public/fonts/README.md`

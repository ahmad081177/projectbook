# Smoke Test Report — AutoProjectBook SPA

**Date:** 2026-03-30  
**Tool:** Playwright MCP (`mcp_microsoft_pla_browser_*`)  
**Server:** `npm run dev` → http://localhost:5173  
**Note:** Screenshots disabled (GHCP env limitation) — snapshot text assertions used instead.

---

## Tests Run

### ST-01 — Language Selection Page Renders
- **Navigate to:** `http://localhost:5173/`
- **Expected:** Two flag buttons: עברית (🇮🇱) and عربية (🇵🇸)
- **Result:** ✅ PASS — both buttons present in DOM snapshot

### ST-02 — Hebrew Language Selection → Setup Page
- **Action:** Click "עברית" button
- **Expected:** Navigates to `/onboarding/api-key`; StepIndicator shows step 1 (שפה) checked, all 8 Hebrew step labels visible
- **Result:** ✅ PASS  
  - URL changed to `/onboarding/api-key`
  - StepIndicator rendered with steps: שפה ✓, הגדרות, קוד, מסד נתונים, צילומי מסך, יצירה, סקירה, ייצוא
  - Setup form rendered: student name field, API key field (password, with show/hide toggle), model dropdown (4 Gemini options), "בדוק חיבור" button, "הבא" button (disabled until valid)

### ST-03 — StepGuard Redirect
- **Navigate to:** `http://localhost:5173/extract/code` (requires step 2 completion)
- **Expected:** Redirected back to `/` because no steps completed
- **Result:** ✅ PASS — redirected to language selection page

---

## Issues Found & Fixed During Smoke Test

### BUG-01 — CSP Blocking Vite HMR in Dev Mode
- **Symptom:** Console errors: *"Executing inline script violates the Content-Security-Policy"* + *"@vitejs/plugin-react can't detect preamble"* → blank page in dev
- **Root cause:** `vite.config.ts` `inject-csp` plugin had no `apply` guard, so the `Content-Security-Policy` meta tag (which disallows `'unsafe-inline'` for scripts) was injected in dev mode, blocking Vite's HMR inline scripts and React Fast Refresh preamble
- **Fix:** Added `apply: 'build'` to the `inject-csp` plugin — CSP is now production-only (see `vite.config.ts`)
- **Status:** ✅ Fixed

### MINOR-01 — Missing favicon.ico
- **Symptom:** Console error: `Failed to load resource: 404 (Not Found) @ /favicon.ico`
- **Impact:** Cosmetic only — browser always requests favicon
- **Status:** ⚠️ Not blocking; no favicon file in `public/` — can add later

---

## Not Tested (Out of Scope for Smoke Test)
- Gemini API integration (requires live API key)
- File upload flows (C#, Access DB, screenshots)
- Document generation and download
- Arabic language path
- Export/download docx

---

## How to Re-Run

1. `npm run dev` — starts Vite at http://localhost:5173
2. Use Playwright MCP tools or run `npx playwright test` (once E2E tests are written via `[QA]` skill)

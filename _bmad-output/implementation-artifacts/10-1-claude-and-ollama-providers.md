# Story 10.1 — Add Claude API and Ollama Local Provider Support

> **Epic:** E10 — Multi-Provider AI Support  
> **Status:** Ready for Dev  
> **Created:** 2026-04-21  
> **Priority:** Must Have

---

## User Story

**As a** student using AutoProjectBook,  
**I want** to choose between Gemini, OpenAI, Azure OpenAI, Claude (Anthropic), or Ollama (local) as my AI provider,  
**So that** I can use whichever AI service I have access to or prefer.

---

## Background / Context

The app currently supports 3 providers: Gemini, OpenAI, and Azure OpenAI. This story adds:
1. **Claude** (Anthropic Messages API) — cloud-based, requires API key
2. **Ollama** (local LLM) — runs on student's machine, no API key needed

### Architecture Pattern

All providers follow the same pattern established in `src/services/gemini.ts`:
- A typed caller function (`callClaude`, `callOllama`) 
- A connection test function (`testClaudeConnection`, `testOllamaConnection`)
- Routing via the unified `callAI()` dispatcher
- Response mapped to the common `AiTextResult` shape

### Key Files

| File | What to change |
|------|----------------|
| `src/store/types.ts` | Extend `AiProvider` union, add `KNOWN_CLAUDE_MODELS`, add `ClaudeModel`/`OllamaModel` types, extend `OnboardingSlice` |
| `src/store/slices/onboarding.ts` | Add default values for new provider fields |
| `src/utils/constants.ts` | Add `CLAUDE_API_BASE`, `OLLAMA_API_BASE` |
| `src/services/gemini.ts` | Add `callClaude()`, `callOllama()`, test functions, update `callAI()` |
| `src/features/onboarding/SetupPage.tsx` | Add Claude/Ollama panels to provider toggle and form |
| `src/i18n/he.json` | Add Hebrew translations for new provider labels |
| `src/i18n/ar.json` | Add Arabic translations for new provider labels |

---

## Acceptance Criteria (BDD)

### AC-1: Claude provider selection and connection test
```gherkin
Given the student is on the Setup screen (Screen 2)
When they select "Claude" from the provider toggle
Then they see an API key field and a model dropdown
And the model dropdown defaults to "claude-sonnet-4-20250514"
And known models include: claude-sonnet-4-20250514, claude-3.5-sonnet, claude-3-haiku
And a "Custom model..." option is available
When they enter a valid API key and click "Test Connection"
Then the connection test calls the Anthropic Messages API
And shows green success or red error feedback
```

### AC-2: Ollama provider selection and connection test
```gherkin
Given the student is on the Setup screen (Screen 2)
When they select "Ollama" from the provider toggle
Then they see a Base URL field (default: http://localhost:11434) and a Model name text input
And a helper note explains Ollama must be running locally
And no API key field is shown
When they click "Test Connection"
Then the connection test calls the Ollama /api/generate endpoint
And shows green success or red error feedback
```

### AC-3: Claude chapter generation works end-to-end
```gherkin
Given the student has successfully connected with Claude provider
When they reach the generation step
Then all chapters are generated using the Anthropic Messages API
And the generated text appears in the review screen
And usage stats are recorded (input/output tokens)
```

### AC-4: Ollama chapter generation works end-to-end
```gherkin
Given the student has successfully connected with Ollama provider
When they reach the generation step
Then all chapters are generated using the Ollama API
And the generated text appears in the review screen
And usage stats are estimated (Ollama may not return token counts)
```

### AC-5: Provider state persists across wizard steps
```gherkin
Given the student selects Claude or Ollama and passes connection test
When they navigate forward through the wizard and then back to Setup
Then their provider selection and credentials are preserved
```

---

## Technical Design

### Claude API Integration
- **Endpoint:** `https://api.anthropic.com/v1/messages`
- **Auth:** `x-api-key` header + `anthropic-version: 2023-06-01` header
- **Request shape:** `{ model, max_tokens, system, messages: [{ role: "user", content }] }`
- **Response shape:** `{ content: [{ text }], usage: { input_tokens, output_tokens } }`
- **Security:** HTTPS only, key passed in header (not URL)

### Ollama API Integration
- **Endpoint:** `{baseUrl}/api/generate` (or `/api/chat` for chat format)
- **Auth:** None (local service)
- **Request shape:** `{ model, system, prompt, stream: false, options: { temperature: 0.4, top_p: 0.85 } }`
- **Response shape:** `{ response, eval_count, prompt_eval_count }`
- **CORS note:** Ollama serves on localhost and includes CORS headers by default. If student has a non-default setup, the base URL field handles it.
- **Security:** Allow any hostname for Ollama (it's local). Do NOT restrict to a specific domain like we do for Azure.

### Type Changes
```typescript
export type AiProvider = 'gemini' | 'openai' | 'azure-openai' | 'claude' | 'ollama';
export type ClaudeModel = string;
export type OllamaModel = string;

export const KNOWN_CLAUDE_MODELS = [
  'claude-sonnet-4-20250514',
  'claude-3.5-sonnet',
  'claude-3-haiku',
] as const;
```

### Store additions to OnboardingSlice
```typescript
// Claude
claudeApiKey: string;     // never persisted
claudeModel: ClaudeModel;
// Ollama
ollamaBaseUrl: string;    // default: http://localhost:11434
ollamaModel: OllamaModel;
```

---

## Out of Scope

- Streaming responses (all providers use non-streaming mode)
- Ollama model auto-discovery (listing available models from /api/tags)
- Claude vision / image capabilities
- Changing the existing Gemini/OpenAI/Azure provider code

---

## Dev Notes

- The `callAI()` function already dispatches by provider — just add two new cases
- For Ollama, the `/api/generate` endpoint is simpler than `/api/chat` — use generate
- Claude requires `anthropic-version` header — this is mandatory
- Ollama may not return token counts — use estimation fallback (already exists in `buildUsageStats`)
- The provider toggle button group may get crowded with 5 items — use smaller text or wrap to 2 rows if needed

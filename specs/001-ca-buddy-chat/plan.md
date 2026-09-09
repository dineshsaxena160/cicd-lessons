# Implementation Plan: CA Buddy Chat

**Branch**: `001-ca-buddy-chat` | **Date**: 2026-09-09 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-ca-buddy-chat/spec.md`

## Summary

Deliver a one-screen CA Buddy chat for Indian small-business owners. The frontend
will keep one active conversation in memory, send the current message history to a
browser-side Gemini service through a `ChatService` boundary, and render clear
responses, safety limits, loading, error, and reset states. Unit tests will use a
fake service, end-to-end tests will intercept model requests, and GitHub Pages
deployment will run only after the required checks pass.

## Technical Context

**Language/Version**: TypeScript 5.x with Node.js 22.12+ for development and CI

**Primary Dependencies**: React, Vite, `@langchain/google-genai`,
`@langchain/core`, Vitest, Testing Library, and Playwright

**Storage**: N/A. Conversation state is held in memory for the active page only;
no browser storage, database, or server persistence is allowed.

**Testing**: Vitest and Testing Library for unit/component behavior; Playwright for
browser end-to-end behavior; production build validation in CI

**Target Platform**: Modern desktop and mobile browsers served as a static site on
GitHub Pages; Node.js 22.12+ in local and CI tooling

**Project Type**: Frontend single-page web application

**Performance Goals**: Render the initial interactive shell within 2 seconds on a
typical broadband connection, show the loading state immediately after submission,
and avoid imposing a client-side response deadline on the external model request.

**Constraints**: Browser calls use `VITE_GOOGLE_API_KEY` and therefore must not
pretend the key is secret; deployment configuration must restrict the key where
possible. Use `gemini-2.5-flash` with a maximum of 1024 output tokens. Keep the
system prompt in a dedicated frontend file, use one-shot responses rather than
streaming for the first release, retain only current-chat context, and keep the
interface accessible and usable on desktop and mobile.

**Scale/Scope**: One route and one chat surface, one active chat per browser tab,
four supported topic categories, no accounts, no backend, no saved history, and no
tax filing workflow.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Clear, Practical Guidance**: PASS. The dedicated system prompt, response
  handling, and acceptance scenarios require concise plain-language guidance,
  relevant context questions, and explicit uncertainty.
- **II. Professional Boundaries and User Safety**: PASS. The prompt and visible
  disclaimer will separate general information from professional advice and require
  CA escalation for individualized, high-stakes, uncertain, or current judgment.
- **III. Test-Backed Behavior**: PASS. Unit tests use a fake service, Playwright
  intercepts model traffic, and the deployment workflow depends on required checks.
- **IV. Explicit State and Conversation Continuity**: PASS. The plan defines an
  in-memory ordered message state, current-chat context forwarding, New chat reset,
  loading state, and visible configuration/request errors.
- **V. Minimal, Accessible Frontend**: PASS. The plan keeps a static React,
  TypeScript, and Vite frontend with no persistence, backend, or out-of-scope
  workflows and includes responsive accessible controls.
- **Product Boundaries**: PASS. The browser reads `VITE_GOOGLE_API_KEY`, the
  system prompt is a dedicated file, the model and 1024-token limit are fixed, and
  no user data is persisted.
- **Quality and Delivery Workflow**: PASS. The five ordered PRD tasks remain the
  delivery sequence; CI runs on pushes and pull requests, and deployment follows
  successful checks.
- **Governance**: PASS. This plan introduces no constitution violation or scope
  expansion requiring an amendment.

### Post-Design Review

PASS. Phase 1 keeps the service provider behind an injectable boundary, stores only
the active ordered chat in memory, preserves the dedicated safety prompt and visible
disclaimer, and specifies deterministic unit/E2E test seams. The single CI workflow
keeps Pages deployment dependent on the test job. No backend, persistence, account,
filing, or personalized-advice scope has been introduced, so no constitution
amendment or complexity exception is required.

## Project Structure

```text
.
├── .env.example
├── .github/
│   └── workflows/
│       └── ci.yml
├── index.html
├── package.json
├── package-lock.json
├── playwright.config.ts
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── public/
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   ├── components/
│   │   ├── ChatShell.tsx
│   │   ├── Disclaimer.tsx
│   │   ├── MessageComposer.tsx
│   │   ├── MessageList.tsx
│   │   └── StatusMessage.tsx
│   ├── hooks/
│   │   └── useChatSession.ts
│   ├── models/
│   │   └── chat.ts
│   ├── prompts/
│   │   └── system-prompt.ts
│   └── services/
│       ├── chat-service.ts
│       ├── fake-chat-service.ts
│       └── gemini-chat-service.ts
└── tests/
  ├── e2e/
  │   └── chat.spec.ts
  └── unit/
    ├── chat-service.test.ts
    ├── chat-session.test.tsx
    └── chat-shell.test.tsx
```

**Structure Decision**: Use a single frontend project at the repository root. UI
components render the one-screen experience, `useChatSession` owns ordered
current-chat state and request lifecycle, services isolate model access and fakes,
and the prompt is versioned separately from service code. Unit tests live under
`tests/unit`; browser tests live under `tests/e2e`. A single CI workflow runs
required checks on pushes and pull requests and contains a main-branch Pages
deployment job that depends on the test job completing successfully.

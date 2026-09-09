---

description: "Executable task list for CA Buddy Chat"
---

# Tasks: CA Buddy Chat

**Input**: Design documents from `/specs/001-ca-buddy-chat/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), and [contracts/](contracts/)

**Tests**: Test tasks are included because the specification and constitution require unit, component, and end-to-end coverage with the model faked or intercepted.

**Organization**: Tasks are grouped by user story. The five PRD delivery tasks are preserved as issue/PR boundaries in the delivery mapping below; checklist items are the smaller executable steps within those boundaries.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel after the stated phase dependencies are complete.
- **[Story]**: Maps a task to the corresponding user story from [spec.md](spec.md).
- Every task names the exact file or directory it creates or changes.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize the root-level React, TypeScript, and Vite project and the
local tooling required by the planned single-page frontend.

- [ ] T001 Initialize the root npm project and scripts in `package.json` and create the lockfile at `package-lock.json` with React, TypeScript, Vite, LangChain, Vitest, Testing Library, and Playwright dependencies.
- [ ] T002 [P] Configure strict TypeScript and Vite application settings in `tsconfig.json` and `vite.config.ts`, including the `VITE_BASE_PATH` build input used by GitHub Pages.
- [ ] T003 [P] Add browser-safe environment and generated-file rules in `.env.example` and `.gitignore`, including `VITE_GOOGLE_API_KEY`, `.env.local`, `node_modules/`, `dist/`, and test artifacts.
- [ ] T004 Create the application entry points and document shell in `index.html`, `src/main.tsx`, and `src/App.tsx` so the app mounts as one browser page.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish shared data types, deterministic unit-test execution, and the
first CI check before story work begins.

**CRITICAL**: No user story implementation is complete until this phase is finished.

- [ ] T005 Define `ChatMessage`, `ChatRequest`, `ChatSessionState`, `ChatPhase`, and safe `ChatError` types in `src/models/chat.ts` from [data-model.md](data-model.md).
- [ ] T006 [P] Configure Testing Library cleanup and DOM test setup in `tests/unit/setup.ts` and connect it to `vitest.config.ts` without adding provider network calls.
- [ ] T007 [P] Add the unit-test job for push and pull-request validation in `.github/workflows/ci.yml`, using the `npm run test:unit` script from `package.json` and Node.js 22.12+.

**Checkpoint**: The root project installs, the shared model compiles, unit tests can run in a browser-like environment, and CI can execute the unit suite.

---

## Phase 3: User Story 1 - Ask Everyday Tax Questions (Priority: P1) - MVP UI Slice

**Goal**: Deliver the independently testable one-screen chat shell that accepts a
non-empty question, shows loading, and renders a deterministic assistant response
for supported everyday tax topics.

**Independent Test**: Run `tests/unit/chat-shell.test.tsx` and
`tests/unit/chat-session.test.tsx` with an injected deterministic responder; verify
the empty page exposes all required controls, a GST/TDS/ITR/audit question appears
immediately, loading is visible, and a non-empty response is rendered without a
second request for duplicate submission.

### Tests for User Story 1

- [ ] T008 [P] [US1] Write failing component tests for the empty shell, accessible controls, non-empty submission, loading status, user message, and assistant response in `tests/unit/chat-shell.test.tsx`.
- [ ] T009 [P] [US1] Write failing session tests for trimmed input, empty-input rejection, one in-flight request, loading-to-ready transition, and deterministic responder output in `tests/unit/chat-session.test.tsx`.

### Implementation for User Story 1

- [ ] T010 [US1] Implement the in-memory request lifecycle and injected message-sender dependency in `src/hooks/useChatSession.ts` using the types from `src/models/chat.ts`.
- [ ] T011 [US1] Implement semantic chat rendering and controls in `src/components/ChatShell.tsx`, `src/components/MessageList.tsx`, `src/components/MessageComposer.tsx`, and `src/components/StatusMessage.tsx`.
- [ ] T012 [US1] Wire the initial shell through `src/App.tsx` and add the baseline one-screen layout, readable message styles, and visible focus states in `src/index.css`.
- [ ] T013 [US1] Run and stabilize the User Story 1 unit slice in `tests/unit/chat-shell.test.tsx` and `tests/unit/chat-session.test.tsx`, confirming the UI remains independently testable with an injected responder before provider integration.

**Checkpoint**: The shell can be demonstrated with a deterministic responder and the
unit CI job covers the first user-visible interaction.

---

## Phase 4: User Story 2 - Understand Advice Boundaries (Priority: P1)

**Goal**: Add the provider boundary, real browser-side Gemini service, CA persona,
scope rules, safe fallback behavior, and persistent disclaimer without exposing raw
configuration or provider errors.

**Independent Test**: Run `tests/unit/chat-service.test.ts` and
`tests/unit/prompt.test.ts` with the provider mocked; verify the service rejects
missing configuration, maps ordered messages, enforces `gemini-2.5-flash` and the
1024-token limit, returns deterministic fake responses, and the prompt/disclaimer
requires general information, uncertainty, and consulting a CA for individualized
judgment.

### Tests for User Story 2

- [ ] T014 [P] [US2] Write failing ChatService contract tests for configuration checks, ordered request mapping, successful text, provider failure, and empty-response errors in `tests/unit/chat-service.test.ts`.

### Implementation for User Story 2

- [ ] T015 [US2] Define the provider-neutral `ChatService` interface and stable `missing-configuration`, `request-failed`, and `empty-response` errors in `src/services/chat-service.ts` according to `contracts/chat-service.md`.
- [ ] T016 [US2] Implement the deterministic fake service with recorded requests and configurable success, failure, and empty-response behavior in `src/services/fake-chat-service.ts`.
- [ ] T017 [US2] Implement the browser-side LangChain Gemini service in `src/services/gemini-chat-service.ts` using `@langchain/google-genai`, `gemini-2.5-flash`, `VITE_GOOGLE_API_KEY`, one-shot invocation, and a 1024-token output limit.
- [ ] T018 [P] [US2] Author the dedicated CA persona, supported topic scope, uncertainty rules, consult-a-CA fallback, and no-guarantee language in `src/prompts/system-prompt.ts`.
- [ ] T019 [P] [US2] Add the always-visible general-information disclaimer in `src/components/Disclaimer.tsx` and safe loading/error presentation in `src/components/StatusMessage.tsx`.
- [ ] T020 [US2] Replace the injected demo responder with configured production/fake service selection in `src/App.tsx` and map service failures to safe user-facing states in `src/hooks/useChatSession.ts` and `src/components/StatusMessage.tsx`.
- [ ] T021 [US2] Write and pass prompt-boundary assertions for GST, TDS, ITR deadlines, audit basics, out-of-scope questions, current-rule uncertainty, and CA escalation in `tests/unit/prompt.test.ts` and `tests/unit/chat-service.test.ts`.

**Checkpoint**: The app can answer through the required service boundary, the fake
service keeps unit tests deterministic, missing configuration is visible, and the
CA persona and disclaimer prevent the UI from presenting personalized guarantees.

---

## Phase 5: User Story 3 - Continue or Reset a Conversation (Priority: P2)

**Goal**: Preserve ordered current-chat context for follow-ups, clear it on New chat,
and ignore late responses from a previous generation without persisting history.

**Independent Test**: Run the session and shell tests with a deferred fake response;
submit a first question and a context-dependent follow-up, inspect the recorded
request order, select New chat while a request is pending, and verify the old response
never appears in the empty new session.

### Tests for User Story 3

- [ ] T022 [P] [US3] Write failing follow-up, New chat, no-history, and stale-response tests in `tests/unit/chat-session.test.tsx` and `tests/unit/chat-shell.test.tsx`.

### Implementation for User Story 3

- [ ] T023 [US3] Add ordered current-chat forwarding, generation tracking, and stale-response protection to `src/hooks/useChatSession.ts`.
- [ ] T024 [US3] Implement the New chat action and loading/error reset behavior in `src/components/ChatShell.tsx` and `src/components/MessageComposer.tsx` while keeping the disclaimer and controls available.
- [ ] T025 [US3] Ensure the production and fake service receive only the active ordered message list and preserve role/content order in `src/services/gemini-chat-service.ts` and `src/services/fake-chat-service.ts`.
- [ ] T026 [US3] Pass the current-chat memory and reset suite in `tests/unit/chat-session.test.tsx`, `tests/unit/chat-shell.test.tsx`, and `tests/unit/chat-service.test.ts` without adding browser or server persistence.

**Checkpoint**: Follow-up questions use prior active-chat messages, New chat immediately
starts an empty generation, and late provider responses cannot repopulate a reset chat.

---

## Phase 6: User Story 4 - Use the Chat on Different Devices (Priority: P2)

**Goal**: Complete responsive accessibility and browser-level coverage for the full
chat workflow, including intercepted Gemini requests and mobile-sized layouts.

**Independent Test**: Run `tests/e2e/chat.spec.ts` at desktop and mobile viewport
sizes with the provider request intercepted; verify the empty shell, GST response,
loading state, follow-up payload, New chat reset, CA recommendation, safe failures,
and absence of horizontal scrolling or overlapping content.

### Tests for User Story 4

- [ ] T027 [P] [US4] Write failing responsive and accessibility assertions for roles, labels, keyboard submission, visible disclaimer, focusable controls, and mobile-safe layout in `tests/unit/chat-shell.test.tsx`.
- [ ] T028 [US4] Complete semantic markup, `aria-live` status behavior, keyboard focus treatment, touch-sized controls, scrollable messages, and mobile/desktop responsive CSS in `src/components/ChatShell.tsx`, `src/components/MessageList.tsx`, `src/components/MessageComposer.tsx`, `src/components/StatusMessage.tsx`, and `src/index.css`.
- [ ] T029 [US4] Configure the Playwright browser project, local web server, test environment, and service-worker blocking in `playwright.config.ts`.
- [ ] T030 [US4] Implement intercepted Gemini request scenarios for supported topics, loading, follow-up context, New chat, CA escalation, missing configuration, request failure, and desktop/mobile viewports in `tests/e2e/chat.spec.ts`.
- [ ] T031 [US4] Extend `.github/workflows/ci.yml` with Playwright browser installation and `npm run test:e2e` on every push and pull request after the unit job succeeds.

---

## Phase 7: Polish & Cross-Cutting Delivery

**Purpose**: Build and deploy the tested static site through GitHub Pages only after
all required checks pass, then validate the complete quickstart and acceptance flow.

- [ ] T032 [P] Configure the repository-aware GitHub Pages base path and production build behavior in `vite.config.ts` using `VITE_BASE_PATH` while preserving `/` for local development and custom domains.
- [ ] T033 Add the gated Pages deployment job to `.github/workflows/ci.yml` with `needs: test`, default-branch protection, Pages permissions, build-time environment configuration, artifact upload, and deployment steps.
- [ ] T034 [P] Update `.env.example` and `specs/001-ca-buddy-chat/quickstart.md` with the final scripts, Node.js prerequisite, fake/intercepted test flow, restricted browser-key warning, and Pages base-path validation.
- [ ] T035 Run the full validation sequence from `specs/001-ca-buddy-chat/quickstart.md`, including unit tests, Playwright tests, production build, desktop/mobile acceptance checks, missing-configuration checks, reset behavior, and the three-minute demo walkthrough.

## PRD Delivery Task Mapping

The PRD requires exactly five ordered delivery tasks, with one GitHub issue and one
pull request per task. The checklist items above are the executable subtasks inside
those five delivery boundaries:

1. **Chat UI shell, unit tests, and unit CI**: T001-T013.
2. **ChatService interface, Gemini implementation, and fake**: T014-T017.
3. **CA persona, scope rules, fallback, disclaimer, and conversation memory**: T018-T026.
4. **Playwright end-to-end tests with intercepted Gemini request and CI wiring**: T027-T031.
5. **GitHub Pages deployment gated on all checks**: T032-T035.

## Dependencies & Execution Order

- **Setup**: T001 precedes T002-T004.
- **Foundational**: T005-T007 precede user stories.
- **US1**: T008-T009 precede T010-T013.
- **US2**: T014-T021 follows the shell.
- **US3**: T022-T026 follows the service and safety boundary.
- **US4**: T027-T031 follows complete chat state.
- **Polish**: T032-T035 follows all required checks.

## Implementation Strategy

### MVP First

1. Complete T001-T007.
2. Complete T008-T013 for the deterministic shell.
3. Complete T014-T017 for the production service boundary.
4. Complete the safety, memory, E2E, and deployment tasks before public release.

### Parallel Opportunities

- T002 and T003 after T001.
- T006 and T007 after the setup scripts exist.
- T008 and T009 as separate test files.
- T018 and T019 after the shell exists.
- T032 and T034 after the workflow is known.

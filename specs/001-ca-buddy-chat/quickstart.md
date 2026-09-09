# CA Buddy Chat Quickstart

This guide validates the planned feature from a clean checkout. It uses a fake model
for unit tests and intercepted model requests for browser tests, so no real Gemini
credential is required to run the automated checks.

## Prerequisites

- Node.js 22.12 or newer
- npm
- A browser installed for Playwright's test runner
- For manual model-backed development only: a restricted Google API key configured as
  `VITE_GOOGLE_API_KEY` in a local environment file

## Install and run locally

```bash
npm install
cp .env.example .env.local
# Set VITE_GOOGLE_API_KEY in .env.local for a real local model request.
npm run dev
```

Open the local URL shown by the development server. The production browser build must
not run without the configured key; missing configuration should render the safe error
state described in [the UI contract](contracts/ui-state.md).

## Automated validation commands

Run the unit and component checks:

```bash
npm run test:unit
```

Expected result: the fake service drives empty, loading, ready, error, follow-up, New
chat, missing-configuration, and duplicate-submit behavior without any external model
request.

Run the browser checks:

```bash
npm run test:e2e
```

Expected result: Playwright starts the app with a test-only configuration, intercepts
the provider request before navigation, and verifies the visible UI contract. The test
must assert that the intercepted request contains the prior current-chat messages when
a follow-up is submitted.

Build the static site:

```bash
npm run build
npm run preview
```

Expected result: the build completes into the configured static output directory and
previewing it shows the same one-screen surface. For a repository Pages deployment,
CI supplies the repository-aware `VITE_BASE_PATH` before building.

## Acceptance walkthrough

1. Open the page with a configured test environment and verify the empty initial state,
   header, input, submit control, New chat control, and disclaimer.
2. Submit `When is my GST return due?`. Verify the user message appears immediately,
   the loading status is visible, and the intercepted assistant response appears.
3. Submit one TDS, ITR-deadline, and audit-basics question. Verify each response is
   readable and remains general rather than personalized.
4. Ask a follow-up that refers to the previous answer. Verify the service request
   contains the preceding ordered messages and the response is rendered in the same
   chat.
5. Select New chat. Verify all messages and old error/status content disappear, the
   input is ready, and no prior message appears after a new question.
6. Submit a question requiring individualized judgment. Verify the response states
   the limitation, recommends consulting a CA, and does not make a guarantee.
7. Run the same primary flow at a mobile-sized viewport. Verify no horizontal scroll,
   clipping, or overlap and confirm keyboard-accessible controls.
8. Run with missing configuration and with a simulated provider failure. Verify both
   produce safe recoverable error states without exposing a credential.

See [the data model](data-model.md), [the service contract](contracts/chat-service.md),
and [the UI contract](contracts/ui-state.md) for state and interface invariants.

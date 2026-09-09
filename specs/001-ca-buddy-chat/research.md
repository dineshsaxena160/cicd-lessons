# Research: CA Buddy Chat

## Scope

This research resolves the planning choices required by the feature specification and
constitution. The repository contains no application source, package manifest, test
configuration, or deployment workflow, so decisions are based on the PRD, the CA Buddy
constitution, and current official guidance for the required tools.

## Decision: Use a single root-level frontend with npm and Node.js 22.12+

**Rationale**: The product is one static frontend surface and there is no existing
repository structure to preserve. A root-level app keeps the five ordered delivery
tasks easy to review. Current Vitest guidance requires Node.js 22.12+ and Vite 6.4+
for the current toolchain, so Node.js 22.12+ is the minimum documented runtime for
local development and CI. npm and a committed `package-lock.json` are the smallest
setup compatible with the Vite and GitHub Pages guidance.

**Alternatives considered**:

- Node.js 20: rejected because current Vitest requires Node.js 22.12+.
- pnpm: viable, but it adds a package-manager choice without a repository convention
  or a monorepo need.
- A nested application directory: rejected because the feature has one app and no
  existing multi-project layout.

## Decision: Keep the required LangChain Gemini integration behind ChatService

**Rationale**: The PRD fixes `@langchain/google-genai`, the `gemini-2.5-flash` model,
and direct browser requests. The implementation will isolate the provider-specific
model object behind a small `ChatService` interface. The production service will
prepend the dedicated CA system prompt, pass the ordered current-chat messages, set
the 1024-token output limit, and return one assistant text result.

The current LangChain JavaScript documentation identifies `ChatGoogleGenerativeAI`
in `@langchain/google-genai` and shows invocation with ordered chat messages. The
same documentation notes that this integration is being replaced by a newer Google
integration. Because the PRD and constitution explicitly require the current package,
this release will use the required package and keep the provider code isolated so a
future migration is localized rather than spread through the UI.

**Alternatives considered**:

- A direct Google SDK call: rejected because it violates the required LangChain
  integration boundary.
- A server-side proxy: rejected because the constitution requires a frontend-only
  browser call and no backend.
- Streaming responses: deferred because the feature requires a visible loading state
  but does not require token streaming; one-shot responses keep the service contract
  and race handling smaller.

**Source**: [LangChain Google Generative AI integration](https://docs.langchain.com/oss/javascript/integrations/chat/google_generative_ai)

## Decision: Treat the browser API key as exposed configuration

**Rationale**: Vite exposes client variables with the `VITE_` prefix in the built
application, and the PRD intentionally requires `VITE_GOOGLE_API_KEY` for direct
browser calls. The key must therefore be treated as a restricted browser credential,
not as a server secret. The app will check for the value before creating a model
request and show a user-visible configuration error when it is absent. Deployment
configuration should restrict the key by allowed API and, where available, allowed
origins. The app will not persist the key or any conversation data.

**Alternatives considered**:

- Hiding the key in a backend: rejected by the frontend-only architecture.
- Storing the key in browser storage: rejected because it adds persistence and
  increases exposure.
- Silently attempting a request without a key: rejected because FR-012 requires a
  visible error state.

## Decision: Use one-shot invocation with a dedicated system prompt

**Rationale**: The system prompt is a versioned frontend artifact separate from
service code. Each request contains the prompt, the current ordered conversation,
and the latest user message. The production service uses one invocation and extracts
text from the assistant result. A non-empty response is required; an empty or blocked
result becomes a recoverable request error. A low or zero temperature is appropriate
for concise, consistent educational guidance, while the UI still states that answers
are not guaranteed current or correct.

**Alternatives considered**:

- Prompt text embedded in the service: rejected because the PRD requires a dedicated
  prompt file and separate prompt review.
- Retrieval or tax-rule database: rejected as backend/data scope expansion and not
  required by the PRD.
- Tool-based web search: rejected for the first release because it changes the
  response contract and would make current-rule claims harder to test deterministically.

## Decision: Model chat state explicitly and guard against stale requests

**Rationale**: The current chat is an ordered in-memory list of user and assistant
  messages. A session hook owns the list, loading/error phase, and a monotonically
  increasing session generation. New chat clears messages and increments the
  generation. A response may update the UI only if its generation still matches the
  active session, which prevents a late response from reappearing after a reset.
  Empty input is rejected before the service call, and the send control is disabled
  while a request is loading.

**Alternatives considered**:

- Browser storage: rejected by the no-history and no-persistence boundary.
- An external state-management library: rejected because one screen and one active
  chat do not justify another runtime dependency.
- Streaming state: deferred with one-shot invocation; the same generation guard can
  be extended if streaming becomes a later requirement.

## Decision: Use a fake service for unit tests and native Playwright routing for E2E

**Rationale**: Unit tests can exercise UI, state transitions, prompt/service mapping,
and error handling without network access by injecting a deterministic fake service.
Playwright tests will install a route before navigation, fulfill the expected Gemini
request with canned responses, and assert visible behavior. The E2E context will
block service workers so native request routing remains observable if a future asset
introduces one. Tests will verify the request includes current-chat context rather
than only checking the rendered response.

**Alternatives considered**:

- Calling Gemini in tests: rejected because tests must be deterministic and must not
  require a credential or incur external model calls.
- Mocking provider modules in every component test: rejected because it couples UI
  tests to provider internals; the service boundary is the stable seam.
- A service-worker mocking library: rejected because native Playwright routing is
  sufficient for the single external request and has less setup.

**Sources**: [Vitest getting started](https://vitest.dev/guide/), [Playwright network
mocking](https://playwright.dev/docs/network)

## Decision: Use a single gated GitHub Actions workflow for CI and Pages deployment

**Rationale**: One workflow can run unit tests, E2E tests, and the production build on
every push and pull request, then expose a Pages deployment job that depends on the
successful test job and runs only for the default branch. The deployment job will use
GitHub's Pages artifact/deploy actions and set the repository-aware Vite base path at
build time. The exact repository name is not known in this workspace, so the build
will read `VITE_BASE_PATH` and CI will set it from the repository name. A user or
custom-domain Pages deployment can use `/` instead.

**Alternatives considered**:

- Separate test and deploy workflows without a workflow-run dependency: rejected
  because a separate workflow cannot express a direct job-level `needs` gate.
- A hard-coded repository base path: rejected because the repository identity is not
  available in the current workspace and hard-coding would break reuse.
- A third-party Pages action: rejected because the official Pages artifact flow
  directly models the required build and deployment stages.

**Source**: [Vite static deployment guide](https://vite.dev/guide/static-deploy.html#github-pages)

## Decision: Use semantic HTML and plain responsive CSS

**Rationale**: The product has one surface and no existing design system. Semantic
HTML elements, explicit labels, keyboard-visible focus, an `aria-live` message region,
and a plain CSS file keep the accessibility contract visible and the dependency set
small. A mobile-first layout will use a scrollable message panel, touch-sized
controls, and a persistent disclaimer without adding a CSS framework.

**Alternatives considered**:

- A component or CSS framework: rejected because it adds setup and visual conventions
  for a one-screen product without reducing a known problem.
- Decorative status-only animations: rejected because loading and error states need
  to communicate state, not add visual noise.

## Resolved Unknowns

No `NEEDS CLARIFICATION` items remain for implementation planning. Repository-specific
values that are unavailable, such as the GitHub repository name, are represented by
build-time configuration rather than guessed constants.

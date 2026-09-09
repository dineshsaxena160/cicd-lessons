# CA Buddy PRD

## One paragraph
CA Buddy is a simple, frontend-only chatbot for small-business owners who need quick, everyday guidance on Indian tax and audit topics such as GST, TDS, ITR deadlines, and audit basics. It gives clear, practical answers, identifies uncertainty, and tells the user when to consult a Chartered Accountant (CA). The product is a one-screen chat experience with no account or stored history.

## User
The user is an Indian small-business owner who wants a fast, understandable answer before deciding what to do next. They may know the topic but not the terminology, and they need a clear boundary between general information and advice requiring a CA.

## Happy path (this is the three-minute demo)
Open the deployed page, type “When is my GST return due?”, and submit. CA Buddy answers in plain language, asks for relevant context only when needed, and shows the one-line disclaimer. Click “New chat”, ask “Do I need a tax audit?”, and receive a concise explanation with an explicit “consult a CA” recommendation when the answer depends on business facts.

## Out of scope
No login, saved history, settings, backend, server, database, tax filing, return preparation, document upload, payment, personalized legal or tax advice, or guarantee that an answer is current or correct.

## Architecture
Frontend only. React + TypeScript + Vite. No backend, no server, no database. The browser calls Google Gemini directly through LangChain.js (@langchain/google-genai). The API key is read from VITE_GOOGLE_API_KEY — a local .env during development, a GitHub Actions secret when built in CI.

Design: modern, attractive and simple. One screen: a header, one chat panel, an input, a "New chat" button, a one-line disclaimer. No login, no saved history, no settings.

## Functional requirements
- **FR-1:** The page displays a header, one chat panel, a message input, a submit control, a "New chat" button, and a one-line disclaimer on one screen.
- **FR-2:** A user can submit a question and see the question and the model response in the chat panel, with a visible loading state while waiting.
- **FR-3:** The chatbot answers everyday questions about GST, TDS, ITR deadlines, and audit basics in clear, concise language.
- **FR-4:** The chatbot applies the CA persona, states relevant scope limits, and recommends consulting a CA when the question requires individualized, high-stakes, uncertain, or current professional judgment.
- **FR-5:** The chatbot preserves conversation memory for the current chat so follow-up questions use prior messages.
- **FR-6:** "New chat" clears the current conversation and starts an empty chat without saving history.
- **FR-7:** The app reads `VITE_GOOGLE_API_KEY` and makes the Gemini request directly from the browser; missing configuration produces a user-visible error state.
- **FR-8:** The interface remains usable on desktop and mobile, including readable messages, an accessible input and controls, and a visible one-line disclaimer.

## The model
Provider: Google GenAI through LangChain.js (`@langchain/google-genai`). Model name: `gemma-4-26b-a4b-it`. The system prompt lives in a dedicated frontend prompt file. Max tokens: 1024 per response.

## Quality gates
Testing: unit tests (Vitest + Testing Library) with the model faked; end-to-end tests (Playwright) with the Gemini request intercepted; both run in GitHub Actions on every push and pull request.

Deployment: GitHub Pages through GitHub Actions. Tests must pass before anything deploys.

## The five tasks
Exactly five tasks build the whole app, in this order, one GitHub issue and one pull request each:
1. Chat UI shell, unit tests, and the CI workflow that runs them.
2. ChatService interface; LangChain + Gemini implementation; a fake implementation for tests.
3. The CA persona: system prompt in a file, scope rules, "consult a CA" fallback, disclaimer, conversation memory.
4. Playwright end-to-end tests with the Gemini call intercepted, wired into CI.
5. GitHub Pages deployment, gated on all tests passing.

## Acceptance walkthrough
1. On the GitHub Pages URL, confirm the one-screen layout, disclaimer, responsive controls, and empty initial chat.
2. Ask a GST, TDS, ITR-deadline, and audit-basics question; confirm each response appears in the chat and is understandable.
3. Ask a follow-up; confirm current-chat conversation memory is used. Click "New chat"; confirm the messages disappear and no history is restored.
4. Trigger a question requiring individualized judgment; confirm the response recommends consulting a CA and does not present itself as personalized professional advice.
5. Run unit and end-to-end tests; confirm the model is faked or intercepted as specified, all checks pass on push and pull request, and deployment runs only after the checks pass.

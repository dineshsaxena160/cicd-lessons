# ChatService Contract

## Purpose

`ChatService` is the boundary between the chat session UI and the configured language
model. The UI depends on this contract and does not import provider-specific model
classes. A fake implementation conforms to the same contract for unit tests.

## Request

Conceptually, the service exposes:

```ts
interface ChatService {
  isConfigured(): boolean;
  sendMessage(request: ChatRequest): Promise<string>;
}

type ChatRequest = {
  messages: readonly ChatMessage[];
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};
```

The request includes the new user message and all prior current-chat messages in
chronological order. The service owns adding the CA system prompt before invoking the
provider. The UI owns message ids and presentation state.

## Response

A successful call resolves to a trimmed, non-empty assistant string. The UI appends
that string as one assistant message and changes the session phase to `ready`.

## Failure contract

The service rejects with a typed or classifiable error with one of these stable kinds:

- `missing-configuration`: `VITE_GOOGLE_API_KEY` is absent or blank.
- `request-failed`: the provider request fails, is blocked, or cannot be decoded.
- `empty-response`: the provider returns no usable text.

The UI maps these kinds to safe user-facing text. Raw provider errors and credentials
must not be rendered.

## Production implementation rules

- Use the required `@langchain/google-genai` integration and `gemini-2.5-flash`.
- Set the model output limit to 1024 tokens.
- Read configuration from `VITE_GOOGLE_API_KEY` at runtime/build time as supported by
  the frontend environment; fail visibly when it is unavailable.
- Use the dedicated system prompt file and the ordered request messages.
- Do not persist requests, responses, credentials, or chat history.
- Return one completed response; streaming is outside the first-release contract.

## Fake implementation rules

The fake service must:

- Report configured status without reading a real credential.
- Return deterministic responses for GST, audit, follow-up, and generic test inputs.
- Record received requests so tests can assert that current-chat history was forwarded.
- Support deterministic failure and empty-response scenarios.

## Compatibility expectations

The service contract is intentionally provider-neutral. Replacing the model provider
or moving model access behind a server would require a constitution and architecture
review because the current product boundary requires direct browser access.

# Data Model: CA Buddy Chat

## Overview

The app has one active chat session per browser tab. The model is intentionally
in-memory and ephemeral. No entity is written to browser storage, a database, a
server, or an analytics system.

## ChatMessage

Represents one user question or assistant response displayed in the current chat.

| Field | Type | Rules |
|-------|------|-------|
| `id` | string | Unique within the active session; generated when the message is added. |
| `role` | `user` or `assistant` | Determines visual treatment and the role sent to the model. |
| `content` | string | Trimmed, non-empty readable text. User content is the submitted question; assistant content is the model text. |

### Invariants

- Message order is the order shown to the user and the order supplied as context.
- A user message is never created from empty or whitespace-only input.
- An assistant message is created only from a non-empty successful service result.
- Messages exist only for the current session and are removed by New chat or page exit.

## ChatSessionState

Represents the active UI and request lifecycle.

| Field | Type | Rules |
|-------|------|-------|
| `messages` | ordered `ChatMessage[]` | Starts empty; contains only the current chat. |
| `phase` | `idle`, `loading`, `ready`, or `error` | Controls submit/loading/error presentation. |
| `error` | nullable `ChatError` | Present only in `error` phase and safe to show to the user. |
| `generation` | non-negative integer | Increments on New chat; identifies the session that started a request. |

### State transitions

```text
idle/ready --valid submit--> loading
loading --non-empty response--> ready
loading --recoverable failure--> error
error --retry with valid input--> loading
any state --New chat--> idle with empty messages and incremented generation
loading --late response from old generation--> ignored
```

### Invariants

- Only one request may be active for a session generation.
- A loading request cannot create a duplicate user message from a repeated submit.
- A response or error may update state only when its captured generation equals the
  current generation.
- New chat leaves the disclaimer, controls, and empty input available.

## ChatError

Represents a recoverable failure that can be displayed without exposing credentials
or provider internals.

| Kind | User-facing meaning | Recovery |
|------|---------------------|----------|
| `missing-configuration` | The chat service is not configured for this deployment. | Correct deployment configuration; New chat remains available. |
| `request-failed` | The answer could not be retrieved. | Retry the question or start New chat. |
| `empty-response` | The service returned no usable answer. | Retry the question or start New chat. |

The implementation may retain diagnostic details for local logging during development,
but those details must not be rendered as credentials, request headers, or raw provider
errors.

## ChatRequest

The service boundary receives the current ordered messages, including the newly added
user message.

| Field | Type | Rules |
|-------|------|-------|
| `messages` | readonly `ChatMessage[]` | Must contain at least one non-empty user message and preserve order. |

The production service adds the system prompt internally and maps the message roles to
the provider's chat format. The fake service accepts the same request shape so tests
exercise the real UI/service contract.

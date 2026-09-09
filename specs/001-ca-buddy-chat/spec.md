# Feature Specification: CA Buddy Chat

**Feature Branch**: `001-ca-buddy-chat`

**Created**: 2026-09-09

**Status**: Draft

**Input**: User description: CA Buddy PRD and CA Buddy project constitution

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ask Everyday Tax Questions (Priority: P1)

A small-business owner opens CA Buddy, enters a question about GST, TDS, an ITR
 deadline, or audit basics, and receives a clear, concise answer that helps them
 decide what to do next.

**Why this priority**: Answering a common tax question is the product's primary
value and the shortest path to the user's immediate need.

**Independent Test**: Start with an empty chat, submit one question from each
supported topic, and verify that each question and an understandable response are
visible in the chat.

**Acceptance Scenarios**:

1. **Given** the initial page with an empty chat, **When** the user submits "When
   is my GST return due?", **Then** the question appears in the chat, a visible
   loading state appears while the answer is being prepared, and a concise answer
   appears after completion.
2. **Given** an empty chat, **When** the user asks a GST, TDS, ITR-deadline, or
   audit-basics question, **Then** the chat displays both the submitted question
   and a corresponding assistant response.
3. **Given** a question lacks context needed for a useful general answer, **When**
   the assistant responds, **Then** it asks only for the relevant missing context
   or explains the applicable uncertainty.

---

### User Story 2 - Understand Advice Boundaries (Priority: P1)

A small-business owner receives general educational guidance while being clearly
 told when the answer depends on business facts, current rules, or professional
 judgment.

**Why this priority**: Tax and audit decisions can carry financial consequences,
so the product must prevent general information from being mistaken for
personalized professional advice.

**Independent Test**: Submit a question that requires individualized judgment and
verify that the response recommends consulting a Chartered Accountant, does not
claim to be personalized advice, and leaves the disclaimer visible.

**Acceptance Scenarios**:

1. **Given** the user asks whether they need a tax audit for their specific
   business, **When** the assistant responds, **Then** it gives a concise general
   explanation and explicitly recommends consulting a CA when the answer depends
   on business facts.
2. **Given** any chat state, **When** the user views the page, **Then** a concise
   disclaimer remains visible and states that the content is general information,
   not guaranteed current or correct, and not a substitute for professional advice.
3. **Given** the user asks for a definitive answer that requires current or
   individualized judgment, **When** the assistant responds, **Then** it states
   the relevant limitation and does not present a guaranteed conclusion.

---

### User Story 3 - Continue or Reset a Conversation (Priority: P2)

A user can ask a follow-up question in the same chat and then use New chat to
start over without seeing old messages return.

**Why this priority**: Follow-up context makes the short interaction useful, while
an explicit reset protects the user's expectation that no history is retained.

**Independent Test**: Submit a question, submit a context-dependent follow-up,
confirm the assistant receives and uses the earlier exchange, select New chat, and
verify that the chat is empty.

**Acceptance Scenarios**:

1. **Given** the user has submitted a question, **When** they submit a follow-up
   referring to the earlier exchange, **Then** the assistant receives the current
   chat messages and responds using that context.
2. **Given** the chat contains one or more exchanges, **When** the user selects
   New chat, **Then** all visible messages are removed and the input is ready for
   a new question.
3. **Given** the user has selected New chat, **When** they inspect the page or
   submit a new question, **Then** no previous messages are restored or included
   in the new conversation.

---

### User Story 4 - Use the Chat on Different Devices (Priority: P2)

A user can understand and operate the complete chat workflow from a desktop or
mobile-sized screen using readable messages and accessible controls.

**Why this priority**: Small-business owners may seek quick guidance from a phone,
and usability across common screen sizes is required for the single-screen
experience.

**Independent Test**: Open the initial page at desktop and mobile viewport sizes,
submit a question, use New chat, and verify that all required content and controls
remain readable and operable without horizontal scrolling.

**Acceptance Scenarios**:

1. **Given** the page is opened on a desktop or mobile-sized screen, **When** the
   user inspects the initial state, **Then** the header, chat area, input,
   submit control, New chat control, and disclaimer are visible within one usable
   screen.
2. **Given** the user is on a mobile-sized screen, **When** they enter and submit a
   question, **Then** the input and controls remain accessible and the messages
   remain readable without overlapping or being cut off.

### Edge Cases

- If the required model configuration is missing, the page MUST show a clear error
  state that tells the user the service is unavailable, without exposing a secret
  or silently failing.
- If the model request fails or returns no usable answer, the user MUST see a
  recoverable error state and retain the ability to retry or start a New chat.
- If the user submits an empty or whitespace-only input, the application MUST NOT
  add an empty user message or send a request.
- If the user submits while an answer is loading, the input and submit behavior
  MUST prevent duplicate requests until the current request finishes or fails.
- If the user starts New chat while a response is loading, the cleared chat MUST
  remain empty and a late response MUST NOT reappear in the new chat.
- If a question falls outside GST, TDS, ITR deadlines, or audit basics, the
  assistant MUST state the scope boundary and recommend a CA when appropriate
  rather than inventing a definitive answer.
- If a response is long, messages MUST remain readable and the required disclaimer
  and controls MUST remain available.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST present a one-screen chat experience containing a
  header, chat panel, question input, submit control, New chat control, and a
  visible one-line disclaimer.
- **FR-002**: Users MUST be able to submit a non-empty question and see their
  question appear in the current chat.
- **FR-003**: The system MUST show a visible loading state between question
  submission and the assistant response.
- **FR-004**: The assistant MUST provide clear, concise general guidance for
  everyday GST, TDS, ITR-deadline, and audit-basics questions.
- **FR-005**: The assistant MUST ask for relevant missing context or identify
  uncertainty when the available information is insufficient.
- **FR-006**: The assistant MUST apply a CA persona while clearly distinguishing
  general information from individualized professional advice.
- **FR-007**: For questions requiring individualized, high-stakes, uncertain, or
  current professional judgment, the assistant MUST recommend consulting a CA.
- **FR-008**: The assistant MUST NOT guarantee that an answer is current or correct
  and MUST NOT present general information as personalized professional advice.
- **FR-009**: The disclaimer MUST remain visible throughout the chat workflow.
- **FR-010**: The current chat MUST preserve the ordered messages needed for
  follow-up questions, and follow-up requests MUST use that current-chat context.
- **FR-011**: New chat MUST remove all visible messages and begin an empty chat
  without saving or restoring prior history.
- **FR-012**: The system MUST expose missing service configuration as a visible
  user-facing error state.
- **FR-013**: The system MUST expose request failures as a visible, recoverable
  error state without exposing credentials or internal secrets.
- **FR-014**: The system MUST reject empty submissions and prevent duplicate
  submissions while a response is loading.
- **FR-015**: The interface MUST remain readable and operable on desktop and
  mobile-sized screens, with accessible labels and controls.
- **FR-016**: The first release MUST exclude accounts, saved history, settings,
  tax filing, return preparation, document upload, payments, and personalized tax
  or legal advice.
- **FR-017**: The implementation MUST provide automated unit coverage with a fake
  model and end-to-end coverage with the model request intercepted, and deployment
  MUST be blocked until required checks pass.

### Key Entities *(include if feature involves data)*

- **Chat message**: A single user question or assistant response, with an ordered
  role and readable text held only for the current chat.
- **Current chat**: The ordered collection of messages used to display the active
  conversation and provide context for follow-up questions; it has no saved-history
  lifecycle.
- **Question topic**: A supported category of everyday guidance: GST, TDS, ITR
  deadlines, or audit basics.
- **Safety boundary**: The scope, uncertainty, disclaimer, and CA-escalation
  information associated with an assistant response.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time user can open the page, submit the GST demo question,
  read the response, start New chat, and submit the tax-audit question within
  three minutes without assistance.
- **SC-002**: In acceptance testing, 100% of the GST, TDS, ITR-deadline, and
  audit-basics test questions display the submitted question, a loading state, and
  a readable assistant response.
- **SC-003**: In 100% of acceptance tests involving individualized, high-stakes,
  uncertain, or current professional judgment, the response includes a CA
  recommendation, states the relevant limitation, and avoids a personalized
  guarantee.
- **SC-004**: In 100% of follow-up tests, the assistant response reflects the
  preceding current-chat exchange, and in 100% of New chat tests, prior messages
  are absent from the new chat.
- **SC-005**: At both desktop and mobile-sized acceptance viewports, 100% of the
  required controls, messages, and disclaimer remain readable and operable without
  horizontal scrolling or overlapping content.
- **SC-006**: In 100% of missing-configuration and request-failure tests, the user
  sees an understandable error state and can recover by retrying or starting a new
  chat without exposing a credential.
- **SC-007**: At least 90% of acceptance reviewers agree that the responses are
  understandable to a small-business owner and make the next step clear.

## Assumptions

- Users have an internet connection and may use the service without signing in.
- The service is intended for general educational guidance, not for filing returns
  or making a final tax or audit decision.
- Tax rules and deadlines can change; the product does not promise that any answer
  is current or correct.
- A configured external language model is available for normal operation, while
  missing configuration and request failures remain user-visible states.
- Current-chat memory lasts only for the open chat session and is discarded when
  the user selects New chat or leaves the page.
- The initial release supports only GST, TDS, ITR deadlines, and audit basics;
  unsupported topics receive a scope boundary rather than fabricated guidance.
- The five ordered delivery tasks in the PRD define the implementation sequence:
  chat shell and unit CI, chat service, CA persona and memory, end-to-end coverage,
  and gated deployment.

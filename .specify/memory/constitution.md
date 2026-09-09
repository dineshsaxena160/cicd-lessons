<!--
Sync Impact Report
- Version change: scaffold (unversioned) -> 1.0.0
- Modified principles: none; all five principles are newly established from the PRD
- Added sections: Product Boundaries; Quality and Delivery Workflow
- Removed sections: none
- Follow-up TODOs: original ratification date is not recorded
-->

# CA Buddy Constitution

## Core Principles

### I. Clear, Practical Guidance
CA Buddy MUST answer everyday GST, TDS, ITR-deadline, and audit-basics questions in
plain, concise language. Responses MUST distinguish general information from
individualized professional advice and MUST identify uncertainty when the available
context is insufficient. This keeps the product useful to small-business owners
without hiding complexity behind jargon.

### II. Professional Boundaries and User Safety
The chatbot MUST apply the CA persona without presenting itself as a Chartered
Accountant or as a substitute for one. It MUST recommend consulting a CA when a
question requires individualized, high-stakes, uncertain, or current professional
judgment, and it MUST NOT claim that an answer is guaranteed current or correct.
The interface MUST keep the one-line disclaimer visible. These boundaries reduce
the risk that general educational content is mistaken for personalized tax advice.

### III. Test-Backed Behavior
Every user-visible behavior MUST have an appropriate automated check. Unit tests
MUST fake the model, end-to-end tests MUST intercept the Gemini request, and both
test suites MUST cover loading, error, message, memory, disclaimer, and New chat
states where applicable. Tests MUST pass before deployment. This makes the
browser-only integration deterministic and protects the safety-critical response
flow.

### IV. Explicit State and Conversation Continuity
The current chat MUST preserve the ordered conversation messages needed for
follow-up questions, and the model request MUST receive that current-chat context.
New chat MUST clear the visible conversation and begin an empty chat. The application
MUST expose loading and missing-configuration errors as visible user states rather
than silently failing. Explicit state makes the single-screen workflow predictable
and inspectable.

### V. Minimal, Accessible Frontend
The product MUST remain a frontend-only React, TypeScript, and Vite application
using LangChain.js with Google Gemini in the browser. It MUST NOT add login, stored
history, settings, backend services, databases, filing workflows, document uploads,
payments, or personalized tax-advice features without a constitution amendment.
The one-screen interface MUST remain usable on desktop and mobile, with readable
messages and accessible controls. This preserves a fast, low-friction product with
a small and reviewable failure surface.

## Product Boundaries

The browser MUST read the Gemini credential from `VITE_GOOGLE_API_KEY`; missing
configuration MUST produce a visible error state. No credential, conversation
history, or other user data may be persisted by the application. The system prompt
MUST live in a dedicated frontend prompt file, use `gemini-2.5-flash`, and limit a
response to 1024 tokens unless this constitution is amended.

## Quality and Delivery Workflow

Work MUST be delivered as the five ordered tasks defined by the PRD, with one GitHub
issue and one pull request per task. The unit-test and CI foundation MUST precede
the chat service, persona behavior, end-to-end coverage, and deployment work.
GitHub Actions MUST run unit and end-to-end tests on every push and pull request.
GitHub Pages deployment MUST be gated on all required checks passing. Acceptance
review MUST cover the responsive one-screen layout, supported topic categories,
follow-up memory, New chat reset, CA escalation, and visible disclaimer.

## Governance

This constitution governs product and engineering decisions for CA Buddy. A change
to a principle, product boundary, or delivery gate MUST be proposed in a pull
request with the affected section, rationale, impact on existing work, and any
required migration or test updates. At least one reviewer MUST verify that the
change is consistent with the PRD or explicitly records the approved product
decision that supersedes it. The constitution MUST be updated before dependent
specifications, plans, or tasks rely on the new rule.

The version follows semantic versioning: MAJOR for incompatible removals or
redefinitions of governance; MINOR for a new principle or materially expanded
governance section; PATCH for clarifications and non-semantic wording changes. A
review MUST check constitution compliance whenever a pull request changes user
behavior, model prompting, data handling, testing gates, or deployment.

**Version**: 1.0.0 | **Ratified**: TODO(RATIFICATION_DATE): original adoption date
is not recorded | **Last Amended**: 2026-09-09

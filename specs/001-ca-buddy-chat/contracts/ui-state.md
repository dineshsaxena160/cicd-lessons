# Chat UI Contract

## Required accessible surface

The page exposes one usable chat surface with these semantic elements and accessible
names:

- A page header identifying CA Buddy.
- A main chat region containing the ordered messages.
- A labeled question textbox.
- A submit button with an accessible name that indicates sending the question.
- A `New chat` button that is available in every state, including loading.
- A visible one-line disclaimer outside the message list.
- A polite live region or status element for loading and recoverable error text.

Tests should locate controls by role and accessible name rather than CSS class names.

## State contract

### Empty / idle

- The message region contains no prior messages.
- The input is available and the send control rejects empty submission.
- New chat is available and leaves the state empty.
- The disclaimer is visible.

### Loading

- The submitted user question remains visible.
- A visible status communicates that an answer is being prepared.
- The send control cannot submit another request.
- New chat remains available.

### Ready

- The assistant response appears after the user question.
- The response is readable and remains within the scrollable chat region.
- The input is available for a follow-up question.
- The disclaimer remains visible.

### Error

- A safe, understandable error is visible in a status/live region.
- The user can retry with a valid question or select New chat.
- Credentials and raw provider diagnostics are absent from rendered text.
- The disclaimer and primary controls remain available.

## Reset contract

Selecting New chat immediately removes every visible message and clears error/loading
presentation for the new generation. A response from a request started before the reset
must not be appended to the new chat.

## Responsive and keyboard contract

- The complete surface works at desktop and mobile-sized viewports without horizontal
  scrolling or overlapping content.
- The question can be submitted with the visible control and with the input's normal
  keyboard submission action.
- Focus indicators remain visible for the input, submit control, and New chat control.
- The message region can be read in document order by assistive technology.

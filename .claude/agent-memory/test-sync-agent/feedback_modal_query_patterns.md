---
name: Modal query patterns — date inputs, submit buttons, headings
description: How to correctly query elements in ChoreModal and TeamModal tests
type: feedback
---

**"Add Chore" heading vs. button ambiguity**: `ChoreModal` renders an `<h2>` with "Add Chore" AND a submit `<button>` with "Add Chore". Use `getByRole('heading', { name: 'Add Chore' })` for the title, and `getByRole('button', { name: /add chore/i })` for the submit button.

**Date inputs lack `htmlFor`**: `ChoreModal` date inputs are siblings to their `<label>` elements — not wrapped or `for`-linked. `getByLabelText` will fail. Use `document.querySelectorAll('input[type="date"]')` indexed by position: `[0]` = start date, `[1]` = end date. Wrap in helpers `getStartDateInput()` and `getEndDateInput()`.

**Monthly day-of-month input**: The `<input type="number">` for day-of-month has no label association. Query it via `screen.getByRole('spinbutton')` — it is the only spinbutton when monthly recurrence is active.

**Remove buttons with multiple members**: When multiple members exist, `getByRole('button', { name: 'Remove' })` throws "found multiple". Use `getAllByRole('button', { name: 'Remove' })` and index by position, OR reduce the member list in the test to a single member when testing single-member scenarios.

**Recurrence type buttons**: The recurrence buttons have exact capitalized text: 'none', 'daily', 'weekly', 'monthly'. Use `^` anchors in regex to avoid matching "Add Chore" when looking for "none": `/^none$/i`, `/^weekly$/i`, etc.

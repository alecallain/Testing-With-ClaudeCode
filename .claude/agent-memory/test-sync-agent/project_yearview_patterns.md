---
name: YearView test patterns
description: Fixture and assertion patterns for YearView component tests, including occurrence count verification via aria-label
type: project
---

YearView month cards render as `<button>` elements with `aria-label` of the form `"MonthName YYYY: N occurrence(s)"` (singular when count is 1). This is the most reliable selector for asserting per-month occurrence counts because multiple months can share the same numeric count as visible text.

**Why:** Using `getByRole('button', { name: 'March 2026: 1 occurrence' })` avoids ambiguity with bare `getByText('1')` which matches many elements.

**How to apply:** When testing YearView count display, always use the full aria-label string on the button role. For verifying all 12 months at once with a daily chore, compute expected days-per-month from a known array (e.g., `DAYS_IN_2026`) and iterate.

Days in each month of 2026 (non-leap year): [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

Navigation buttons use `aria-label="Previous year"` and `aria-label="Next year"`.
The view-switch button has visible text `"Month"` (exact, not regex needed).
`onSelectMonth` receives `new Date(currentYear, monthIndex, 1)` — assert `.getFullYear()` and `.getMonth()` on the captured argument.

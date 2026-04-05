---
paths:
  - "src/**/__tests__/**"
  - "src/**/*.test.ts"
  - "src/**/*.test.tsx"
  - "src/test/**"
---

# Unit Testing Practices

## Stack
- **Vitest 4** — test runner (configured in `vite.config.ts`)
- **@testing-library/react** — render and query components
- **@testing-library/user-event** — simulate real user interactions
- **@testing-library/jest-dom** — custom matchers (`toBeInTheDocument`, `toHaveStyle`, etc.), imported globally via `src/test/setup.ts`
- **jsdom** — browser environment for tests

## File Placement
Test files live in a `__tests__/` directory co-located with the component directory they cover:
```
src/components/CalendarView/
├── ChoreChip.tsx
└── __tests__/
    └── ChoreChip.test.tsx
```

## Render Helper Pattern
Each test file defines a typed `render*` helper that wraps the component with sensible defaults. This keeps individual tests short and focused on what varies:

```tsx
function renderChip(overrides: {
  chore?: Partial<Chore>;
  assignees?: Member[];
  allMembers?: Member[];
  done?: boolean;
  onToggleDone?: () => void;
  onEdit?: () => void;
  onToggleAssignee?: (memberId: string) => void;
} = {}) {
  const props = {
    chore: { ...baseChore, ...overrides.chore },
    date: '2026-03-23',
    assignees: overrides.assignees !== undefined ? overrides.assignees : [assignee],
    allMembers: overrides.allMembers !== undefined ? overrides.allMembers : [assignee, bob],
    done: overrides.done ?? false,
    onToggleDone: overrides.onToggleDone ?? vi.fn(),
    onEdit: overrides.onEdit ?? vi.fn(),
    onToggleAssignee: overrides.onToggleAssignee ?? vi.fn(),
  };
  return { ...render(<ChoreChip {...props} />), props };
}
```

Define fixture objects at the top of the file using full valid objects (all required fields populated). For `ChoreChip` tests, define both `assignee` (primary member) and `bob` (secondary member) so multi-assignee scenarios can be tested without extra setup.

When testing edge cases for assignee names (single-word, long names), pass `allMembers` containing only the assigned member — this prevents the "Add assignee" section from showing other names that could confuse `getByText` queries:

```tsx
renderChip({
  assignees: [{ id: 'm2', name: 'Alice', color: '#fff' }],
  allMembers: [{ id: 'm2', name: 'Alice', color: '#fff' }],
})
```

## Querying Elements
- Prefer **role-based queries** (`getByRole`, `getByRole('button', { name: /…/i })`) — they mirror how assistive tech works
- Use **text queries** (`getByText`, `queryByText`) for content that has no implicit role
- Use `queryBy*` (returns `null`) when asserting absence; use `getBy*` (throws) when asserting presence
- Use `within(container).getBy*` when the same text appears in multiple places (e.g., title in chip and in popover, or an assignee name appearing in both the "Assigned to" section and potentially elsewhere)

## User Interactions
Always use `userEvent` (not `fireEvent`) for interactions. Set up the user instance once per test:

```tsx
it('opens popover on click', async () => {
  const user = userEvent.setup();
  renderChip();
  await user.click(screen.getByRole('button', { name: /wash dishes/i }));
  expect(screen.getByText('Edit')).toBeInTheDocument();
});
```

For a group of tests that all need the same setup (e.g., popover open), use `beforeEach`:

```tsx
describe('popover content', () => {
  beforeEach(async () => {
    const user = userEvent.setup();
    renderChip();
    await user.click(screen.getByRole('button', { name: /wash dishes/i }));
  });
  // tests here can assert popover content directly
});
```

## Callbacks
Use `vi.fn()` for all callback props. Assert call count and arguments:

```tsx
const onToggleAssignee = vi.fn();
renderChip({ onToggleAssignee });
await user.click(screen.getByRole('button', { name: /remove alice johnson/i }));
expect(onToggleAssignee).toHaveBeenCalledWith('member-1');
```

The render helper already supplies `vi.fn()` defaults for all callbacks, so individual tests only need to declare a spy when they want to assert on it.

Note that `onToggleAssignee` (add/remove from popover) does **not** close the popover — assert `screen.getByText('Edit')` is still present after the call. Only `onToggleDone` closes the popover.

## Test Organization
Group tests by feature area using nested `describe` blocks. Typical structure for a component:

```
describe('ComponentName')
  describe('chip button rendering')   — static output, badge display
  describe('popover toggle')          — open/close behavior
  describe('popover content')         — what appears when open
  describe('popover — <feature>')     — one describe per conditional section
  describe('callbacks')               — spy assertions
  describe('edge cases')              — empty arrays, long strings, missing props
```

## What to Test
- Default render output (titles, colors, badges, attributes)
- Conditional rendering (shown/hidden based on props like `done`, `assignees.length`, `description`)
- Multi-assignee display: multiple initials badges on the chip, "Assigned to" section with remove buttons, "Add assignee" / "Assign to" section for available members
- Max-3 enforcement: "Add assignee" section absent when 3 assigned, "Max 3 assignees" note present
- Popover-stays-open behavior after `onToggleAssignee` calls (contrast with `onToggleDone` which closes)
- UI state transitions (popover open/close, form resets)
- Callback invocations and argument values
- Edge cases: empty `assignees`, empty `allMembers`, single-word names, long names, very long titles

## What Not to Test
- Implementation details — don't assert on class names, internal state variables, or React hook internals
- Tailwind classes — assert on `toHaveStyle({ … })` for visual properties, not class strings
- `useStore` in component tests — components receive props; test them in isolation with plain props and `vi.fn()` callbacks; store logic is tested separately
- Third-party library behaviour (Headless UI dialog transitions, date-fns output) — trust the library

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
  assignee?: Member | null;
  done?: boolean;
  onToggleDone?: () => void;
  onEdit?: () => void;
} = {}) {
  const props = {
    chore: { ...baseChore, ...overrides.chore },
    date: '2026-03-23',
    assignee: overrides.assignee !== undefined ? overrides.assignee : assignee,
    done: overrides.done ?? false,
    onToggleDone: overrides.onToggleDone ?? vi.fn(),
    onEdit: overrides.onEdit ?? vi.fn(),
  };
  return { ...render(<ChoreChip {...props} />), props };
}
```

Define `baseChore` and `baseAssignee` fixtures at the top of the file using full valid objects (all required fields populated).

## Querying Elements
- Prefer **role-based queries** (`getByRole`, `getByRole('button', { name: /…/i })`) — they mirror how assistive tech works
- Use **text queries** (`getByText`, `queryByText`) for content that has no implicit role
- Use `queryBy*` (returns `null`) when asserting absence; use `getBy*` (throws) when asserting presence
- Use `within(container).getBy*` when the same text appears in multiple places (e.g., title in chip and in popover)

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
const onToggleDone = vi.fn();
renderChip({ onToggleDone });
await user.click(/* … */);
expect(onToggleDone).toHaveBeenCalledOnce();
```

The render helper already supplies `vi.fn()` defaults for all callbacks, so individual tests only need to declare a spy when they want to assert on it.

## Test Organization
Group tests by feature area using nested `describe` blocks. Typical structure for a component:

```
describe('ComponentName')
  describe('rendering')        — static output, default props
  describe('interaction')      — click / type / keyboard events
  describe('callbacks')        — spy assertions
  describe('edge cases')       — null props, empty strings, long values
```

## What to Test
- Default render output (titles, colors, badges, attributes)
- Conditional rendering (shown/hidden based on props like `done`, `assignee`, `description`)
- UI state transitions (popover open/close, form resets)
- Callback invocations and that the UI updates accordingly (e.g., popover closes after action)
- Edge cases: `null` assignee, empty description, single-word names, very long strings

## What Not to Test
- Implementation details — don't assert on class names, internal state variables, or React hook internals
- Tailwind classes — assert on `toHaveStyle({ … })` for visual properties, not class strings
- `useStore` in component tests — components receive props; test them in isolation with plain props and `vi.fn()` callbacks; store logic is tested separately
- Third-party library behaviour (Headless UI dialog transitions, date-fns output) — trust the library

# Contributing Workflow

## Prerequisites

Before starting, ensure the following are set up once:
- `gh auth login` — GitHub CLI must be authenticated for `pr-prep` to push and open PRs
- `npm install` — dependencies installed
- A running backend if testing SSE/persistence (`npm run dev` starts both Vite and the Express server)

## Standard Flow

Every change, regardless of size, follows this order:

### 1. Plan (`/plan` or plan mode)
- Use plan mode for any non-trivial change
- Explore the codebase before designing — reuse existing utilities (`getOccurrencesInRange`, `useStore` actions, date-fns helpers) rather than writing new ones
- Lift ambiguous requirements into questions before implementation begins
- Navigation and view state belongs in `App.tsx`, not in child components

### 2. Implement
- Follow the conventions in `architectural_patterns.md` and `CLAUDE.md`
- `useStore()` is called only in `App.tsx` — pass state and callbacks as props
- All date math uses `date-fns` — never `new Date(dateString)`
- Dynamic colors use inline styles — never constructed Tailwind class names

### 3. Sync Tests (test-sync-agent)
After any meaningful code change, invoke the test-sync-agent to:
- Update existing tests broken by interface or prop changes
- Add new tests for new components or utilities
- Target: every exported component and utility function has at least basic coverage

Test files live in `__tests__/` co-located with the code they cover. See `unit_testing_practices.md` for patterns.

### 4. Quality Gate (`/checklist`)
Run the checklist before opening a PR:
1. Architectural review — no anti-patterns against `CLAUDE.md` conventions
2. `npm run build` — must pass with zero TypeScript errors
3. `npx vitest run` — all tests must be green

Do not proceed to PR if any step fails.

### 5. Branch + PR (`pr-prep`)
- Create a feature branch before committing: `git checkout -b feature/<short-description>`
- Run `/pr-prep` to commit, push, and open the PR via `gh pr create`
- PR titles use imperative voice, ≤70 chars (e.g. "Add year view with monthly occurrence counts")

## Known Gotchas

- **`vi.fn()` type errors**: Vitest's `Mock<Procedure | Constructable>` doesn't satisfy typed callback signatures directly. Cast the whole props object: `{ ... } as Parameters<typeof Component>[0]`
- **`gh` not authed**: `pr-prep` will fail at the push step with an auth error. Run `gh auth login` once to fix permanently
- **`new Date(string)`**: Always use `parseISO` from date-fns — `new Date('YYYY-MM-DD')` produces UTC midnight which shifts to the previous day in negative-UTC timezones

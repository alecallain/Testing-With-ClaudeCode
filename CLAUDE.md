# Office Chores

A React app for managing recurring chores in an office setting. Team members can be added, chores created with recurrence rules, and completions tracked on a monthly calendar view.

## Tech Stack

- **React 19** + **TypeScript** (~5.9)
- **Vite 7** — dev server and bundler
- **Tailwind CSS 3** — utility-first styling
- **Headless UI** (`@headlessui/react`) — accessible modal dialogs
- **date-fns 4** — all date math and formatting
- **Vitest 4** + **Testing Library** — unit testing

## Build & Dev Commands

```bash
npm run dev       # Start Vite dev server (HMR)
npm run build     # Type-check then build for production
npm run lint      # Run ESLint
npm run preview   # Preview production build locally
npx vitest        # Run tests (watch mode)
npx vitest run    # Run tests once
```

## File Structure

```
src/
├── App.tsx                        # Root component; calls useStore() once, passes props down
├── main.tsx                       # Entry point
├── types.ts                       # All shared interfaces: Chore, Member, Completion, Recurrence, StoreState
├── store/
│   └── useStore.ts                # Single custom hook; all app state + localStorage persistence
├── utils/
│   ├── colors.ts                  # Hex color palettes for members/chores; getInitials()
│   └── recurrence.ts              # getOccurrencesInRange() — all recurrence math
└── components/
    ├── Sidebar.tsx                # Nav sidebar with member list, "Add Chore" and "Manage Team" buttons
    ├── CalendarView/
    │   ├── MonthView.tsx          # 6-week calendar grid; spanning bar rendering; month navigation
    │   ├── DayCell.tsx            # Single calendar cell; chip list with "+N more" overflow
    │   ├── ChoreChip.tsx          # Individual chore chip with popover menu
    │   └── __tests__/
    │       └── ChoreChip.test.tsx
    └── Modals/
        ├── ChoreModal.tsx         # Add/edit chore form (title, dates, recurrence, color, assignee)
        └── TeamModal.tsx          # Add/remove team members
```


## Key Conventions

### Dates
- All dates are stored as `"YYYY-MM-DD"` strings — never `Date` objects in state or props
- Always use `date-fns` functions (`parseISO`, `format`, `startOfMonth`, etc.) for parsing and date math
- Never use `new Date(dateString)` directly — it produces unpredictable UTC/local offset behavior
- `Completion.date` stores the occurrence date (not the completion timestamp); `completedAt` is the ISO timestamp

### Colors
- Colors for chores and members are **hex strings** (e.g., `#3b82f6`), not Tailwind class names
- Palette constants live in `src/utils/colors.ts` (`MEMBER_COLORS`, `CHORE_COLORS`)
- Use **inline styles** for dynamic colors; never construct dynamic Tailwind class names (they won't be included in the build)

### Components
- Every component file declares a typed `interface Props` at the top
- Components are pure presentational unless they're a modal (which manages local form state)
- `useStore()` is called **only in `App.tsx`**; all other components receive state and callbacks via props

### State Management
- All state lives in `useStore` — no Context API, Redux, Zustand, or other libraries
- Mutations use functional `setState(prev => ({ ...prev, ... }))` — always spread previous state
- Cascading effects happen in a single `update()` call (e.g., removing a member also unassigns their chores)
- Entity IDs are assigned inside store actions using `crypto.randomUUID()` — callers pass `Omit<Entity, 'id'>`

### Forms / Modals
- Modals manage their own local form state; the parent decides whether to call `addChore` or `updateChore`
- A `useEffect` keyed on the `open` prop resets form state each time the modal opens
- Modals call `onSave(formData)` and `onClose()` — they never call store actions directly

### Styling
- Tailwind utility classes for all layout and static styles
- Inline styles (`style={{ backgroundColor: color }}`) for dynamic hex colors
- Key layout constants in `MonthView.tsx`: `DATE_HEADER_HEIGHT = 32px`, `SPAN_BAR_HEIGHT = 22px`, `SPAN_BAR_GAP = 2px`

## Architecture Notes

### Recurrence
All recurrence logic is isolated in `src/utils/recurrence.ts` → `getOccurrencesInRange(chore, rangeStart, rangeEnd): string[]`. It handles:
- `none` — single date or date range (if `endDate` is set)
- `daily` — every day in range
- `weekly` — days matching `daysOfWeek` (0=Sun … 6=Sat)
- `monthly` — day-of-month, clamped to end-of-month (e.g., day 31 in Feb → Feb 28/29)

### Spanning Chores
Chores with `recurrence.type === 'none'` and a non-null `endDate` render as absolute-positioned bars stretching across calendar cells in `MonthView`. Single-day chores and recurring chores render as chips inside `DayCell`. `DayCell` adds top padding proportional to `spanRowsPerDay` to avoid overlap with spanning bars.

### Derived Data
`MonthView` computes the 42-day grid and the `occurrenceMap` (`Record<dateStr, ChoreOccurrence[]>`) via `useMemo` — these are the only expensive derived values and should stay memoized.

## What Not to Do

- **Do not add a state management library** (Context, Redux, Zustand, Jotai, etc.) — the custom hook pattern is intentional and sufficient
- **Do not use `new Date(string)`** for parsing — always use `parseISO` from date-fns
- **Do not use dynamic Tailwind class names** (e.g., `` `bg-[${color}]` ``) — they won't be included in the purged build; use inline styles for dynamic values
- **Do not call `useStore()` in child components** — state flows down from App via props only
- **Do not generate entity IDs outside the store** — ID generation belongs in `useStore` actions
- **Do not add a backend or API layer** — the app is intentionally client-only with localStorage
- **Do not add a router** — the app is a single-view UI; navigation state (e.g., current month) is local component state
- **Do not store `Date` objects in state** — use `YYYY-MM-DD` strings and parse only when needed for computation

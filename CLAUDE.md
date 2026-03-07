# Office Chores

A React app for managing recurring chores in an office setting. Team members can be added, chores created with recurrence rules, and completions tracked on a monthly calendar view.

## Tech Stack

- **React 19** + **TypeScript** (~5.9)
- **Vite 7** — dev server and bundler
- **Tailwind CSS 3** — utility-first styling
- **Headless UI** — accessible modal dialogs (`@headlessui/react`)
- **date-fns 4** — all date math and formatting

## Key Directories

| Path | Purpose |
|---|---|
| `src/types.ts` | All shared TypeScript interfaces (`Chore`, `Member`, `Completion`, `Recurrence`, `StoreState`) |
| `src/store/useStore.ts` | Single custom hook managing all app state with localStorage persistence |
| `src/utils/` | Pure utility functions (recurrence math, color constants, initials) |
| `src/components/CalendarView/` | `MonthView`, `DayCell`, `ChoreChip` — calendar grid and chore rendering |
| `src/components/Modals/` | `ChoreModal`, `TeamModal` — Headless UI dialog forms |
| `src/components/Sidebar.tsx` | Nav sidebar with team member list |

## Build & Dev Commands

```bash
npm run dev       # Start Vite dev server (HMR)
npm run build     # Type-check then build for production
npm run lint      # Run ESLint
npm run preview   # Preview production build locally
```

## Additional Documentation

- `.claude/docs/architectural_patterns.md` — State management approach, data flow, component patterns, date conventions

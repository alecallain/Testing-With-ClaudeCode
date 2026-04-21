Run a structured debugging session. The user will describe the bug; work through it systematically.

## Phase 1 — Understand
Ask the user (or use $ARGUMENTS if provided):
- What is the symptom? (what do you see vs. what you expect)
- What is the reproduction path? (steps to trigger it)
- When did it start? (after a specific change, always been there, intermittent)

If $ARGUMENTS is provided, treat it as the symptom description and skip asking.

## Phase 2 — Reproduce
Attempt to locate the bug in the code without running it:
1. Search for the relevant component, function, or module based on the symptom
2. Read the code and trace the execution path
3. Identify any obvious suspects (off-by-one, wrong variable, missing guard, stale state)

## Phase 3 — Isolate
Narrow to the smallest possible failing unit:
1. Check if there are existing tests covering this path — run `npx vitest run` to see current state
2. Identify what inputs trigger the bug and what inputs don't
3. State your hypothesis: "I believe the bug is in [file:line] because [reason]"

## Phase 4 — Fix
Make the minimal change to fix the root cause:
- Do not refactor surrounding code
- Do not add error handling for unrelated cases
- Fix exactly what is broken

## Phase 5 — Verify
After the fix:
1. Run `npm run build` to confirm no TypeScript errors
2. Run `npx vitest run` to confirm no regressions
3. If the bug had no test coverage, note it — the test-sync-agent can add one

Report: what the bug was, what caused it, what the fix was, and test results.

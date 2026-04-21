Prepare a pull request from the current branch. Run each step in order and stop if anything fails.

## Step 1 — Quality gate
Run the checklist:
1. Check for architectural anti-patterns against CLAUDE.md conventions
2. Run `npm run build` — report any TypeScript or build errors
3. Run `npx vitest run` — report pass/fail counts

If any step fails, stop here and report the errors. Do not proceed to Step 2.

## Step 2 — PR draft
Once the quality gate passes:

1. Run `git log main...HEAD --oneline` to get all commits on this branch
2. Run `git diff main...HEAD --stat` to see which files changed
3. Identify the base branch (`main`) and current branch name

Draft a PR using this format:

**Title:** [imperative verb, ≤70 chars, e.g. "Add difficulty field to ChoreModal"]

**Body:**
```
## Summary
- [2-4 bullets describing what changed and why]

## Test plan
- [ ] Build passes (`npm run build`)
- [ ] All tests pass (`npx vitest run`)
- [ ] [Feature-specific manual test steps]

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

Present the draft for review. Then ask: "Ready to push and open this PR?"

If confirmed, run:
```
git push -u origin HEAD
gh pr create --title "<title>" --body "<body>"
```

Return the PR URL when done.

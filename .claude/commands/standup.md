Generate a daily standup update from recent git activity.

1. Run `git log --since="yesterday 6am" --until="now" --oneline --author="$(git config user.name)"` to get yesterday's and today's commits.
2. Run `git diff main...HEAD --stat` to see what files are in flight on the current branch.
3. Check for any open PRs or WIP branches with `git branch -v`.

Then write a standup in this format:

**Yesterday**
- [bullet per logical unit of work, inferred from commit messages — group related commits]

**Today**
- [what's next based on current branch state and any in-progress work]

**Blockers**
- None (or list anything that looks stuck — long-running branches, failing tests, etc.)

Keep each bullet to one line. Use plain English, not commit message syntax. Do not list every commit individually — summarize by feature or task.

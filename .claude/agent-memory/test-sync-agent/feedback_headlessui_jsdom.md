---
name: Headless UI v2 in jsdom — no mock needed, portal caveats
description: How Headless UI v2 Dialog behaves in jsdom tests and the portal reopen limitation
type: feedback
---

Headless UI v2 (`@headlessui/react`) renders natively in jsdom — **do not mock it**. The Dialog renders into a `#headlessui-portal-root` portal, and content is accessible with standard `screen.*` queries.

**Portal reopen limitation**: When a Dialog goes `open=true → open=false → open=true` within a single test (via `rerender`), Headless UI does NOT synchronously re-attach the portal content in jsdom. The body shows only `<div />` after reopening — `waitFor` times out with no result.

**Workaround for "reset on reopen" tests**: Instead of testing open→close→open within one render tree, test:
- Start with `open=false`, then `rerender` with `open=true` — this creates the portal fresh and the useEffect fires correctly.
- Or test the initial open state directly (the `useEffect` fires on mount when `open=true`).

**Why**: The close→reopen scenario fails because Headless UI v2 uses a React portal that is unmounted when `open=false` and the portal host element is removed. On `open=true` re-render, the portal re-attachment may be asynchronous or animation-gated in ways that don't complete in jsdom.

**How to apply**: Any test that needs to verify form reset on modal reopen should render `open=false` first, then rerender with `open=true`. Do not use the close-reopen-close pattern in a single test.

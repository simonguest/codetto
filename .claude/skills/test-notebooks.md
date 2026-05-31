---
description: Run the Playwright notebook test suite. Optional argument filters by spec name (e.g. "filesystem" runs only filesystem.spec.ts). The dev server starts automatically via the Playwright webServer config — no manual server start needed.
---

Run the Playwright tests using the Bash tool:

- No argument → run all specs: `npx playwright test`
- With an argument → filter by name: `npx playwright test <arg>`

Use `--reporter=line` for compact output. Capture the full stdout/stderr and report:
1. How many tests passed / failed / skipped
2. The full output for any failures (test name, error message, and relevant stack lines)
3. A one-line summary at the end

Command to run (substitute `<filter>` if provided, omit it if not):
```
npx playwright test <filter> --reporter=line
```

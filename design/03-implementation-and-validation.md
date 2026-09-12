# Stage 3: implementation and validation

`src/experiment.ts` defines the 33-candidate bank, selected 27-task demo, allowed efforts, and answer verifier. `src/live-runner.ts` calls OpenRouter for a vague-brief supervisor decision, then three worker attempts. `src/audit-runner.ts` evaluates all seven efforts. `src/analyze-results.ts` and `src/analyze-effort-audit.ts` produce the router and audit reports.

```bash
. /home/ruda/.nvm/nvm.sh
nvm use 22
npm test
npm run benchmark:plan
```

The plan is local. A live limit unit is one supervisor decision plus three worker attempts. Complete a router arm with `--limit=81`; run the full effort audit with `npm run benchmark:audit -- --run=effort-audit-v1 --limit=189`; then calculate formal metrics with `npm run benchmark:audit:analyze -- --run=effort-audit-v1`.

The `.env` key is never printed or committed. OpenRouter accepts named efforts only, so the implementation deliberately uses its seven supported choices instead of pretending the gateway accepts numeric 1-100 values.

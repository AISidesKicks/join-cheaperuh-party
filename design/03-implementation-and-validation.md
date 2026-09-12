# Stage 3: implementation and validation

`src/experiment.ts` defines the 33-candidate bank, selected nine-task demo, allowed efforts, and answer verifier. `src/live-runner.ts` calls OpenRouter for a vague-brief supervisor decision, then three worker attempts. `src/analyze-results.ts` summarizes a complete 3 x 3 task matrix.

```bash
. /home/ruda/.nvm/nvm.sh
nvm use 22
npm test
npm run benchmark:plan
```

The plan is local. A live limit unit is one supervisor decision plus three worker attempts. Start with `npm run benchmark:live -- --limit=1`; complete the demo with `--limit=27`; then run `npm run benchmark:analyze`.

The `.env` key is never printed or committed. OpenRouter accepts named efforts only, so the implementation deliberately uses its seven supported choices instead of pretending the gateway accepts numeric 1-100 values.

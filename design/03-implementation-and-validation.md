# Stage 3: implementation and validation

`datasets/poc-calibration.json` holds twelve original, illustrative 3 x 3 task curves. `src/router.ts` supplies a transparent heuristic router. `src/metrics.ts` calculates both requested metric variants and router scores. `src/cli.ts` prints a replay report.

Run with the project NVM Node 22 runtime:

```bash
. /home/ruda/.nvm/nvm.sh && nvm use 22
npm test
npm run benchmark:demo
```

Vitest covers formulas, matrix validation, and the 12-task router replay. Microsandbox is retained as a project dependency for the next phase, when executable tasks need isolated verifiers. It is deliberately not started by this no-execution PoC.

To advance beyond fixture results: run a fixed model and prompt at all levels only during calibration, replace the illustrative attempts with measured records, and ask the assessor for a single level at evaluation time.

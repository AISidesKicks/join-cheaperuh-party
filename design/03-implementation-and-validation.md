# Stage 3: implementation and validation

`src/experiment.ts` defines 81 original tasks and the nine numeric reasoning settings. `src/live-runner.ts` plans a 729-cell run and records a bounded direct-DeepSeek numeric calibration. `src/router.ts` supplies a transparent heuristic router. `src/metrics.ts` calculates both requested metric variants and router scores. `src/cli.ts` prints a replay report.

Run with the project NVM Node 22 runtime:

```bash
. /home/ruda/.nvm/nvm.sh && nvm use 22
npm test
npm run benchmark:plan
```

Vitest covers formulas, matrix validation, and the 9 x 9 task construction. Microsandbox is retained as a project dependency for the next phase, when executable tasks need isolated verifiers. It is deliberately not started for deterministic text prompts.

To advance beyond fixture results: run a fixed model and prompt at all nine levels only during calibration, replace illustrative attempts with measured records, and ask the assessor for a single level at evaluation time.

## Provider constraint discovered in validation

The native V4.1 model supports numeric `reasoning_effort` values from 1 to 100, but OpenRouter's current public chat-completions validation accepts only named gateway effort values. Therefore an OpenRouter API key cannot truthfully produce nine distinct numeric efforts. The runner fails closed on OpenRouter and requires `--provider=deepseek`, `DEEPSEEK_API_KEY`, and an explicit `DEEPSEEK_MODEL` for the numeric experiment. This avoids silently collapsing the nine planned settings into fewer gateway aliases.

# [Join cheaperuh party](https://join.cheaperuh.party)

Join cheaperuh (čipera) PARTY tests a cost-conscious supervisor: can it look at a vague task description and choose the least expensive reasoning effort likely to succeed?

In Czech, **čipera** means lively, brisk, nimble, or energetic, often said affectionately about an active child. Here it is affectionate sarcasm: an AI can be far too eager to think, orchestrate, and spend credit on work that should be simple.

![Models are not inherently lazy - reasoning levels and AI harness multi-agent orchestration](docs/assets/images/6reasoning-levels.jpeg)

## The idea

The worker model has freedom to use any OpenRouter-supported reasoning setting, including zero reasoning. The supervisor does not see the detailed benchmark prompt or answer. It sees only a short, deliberately vague brief such as "a user reports a small localized code defect" and selects one effort.

The worker then attempts the hidden task three times at that selected effort. This happens three times independently per task, producing a 3 x 3 matrix:

| Matrix axis | Meaning |
|---|---|
| 3 supervisor choices | Three independent cost-aware choices from the vague brief. |
| 3 attempts per choice | Three worker attempts at the chosen effort. |

This measures adaptive reasoning allocation, rather than assuming the correct level is known in advance.

## Reasoning choices

The target is `deepseek/deepseek-v4.1-flash` through OpenRouter. The supervisor may return any gateway-supported setting:

| Effort | Role in the demo |
|---|---|
| `none` | Zero reasoning baseline for extraction, formatting, and one-line repairs. |
| `minimal` | A small amount of deliberate work. |
| `low` | Short calculations and explicit rules. |
| `medium` | Multi-step but bounded constraints. |
| `high` | Stateful and dependency-heavy reasoning. |
| `xhigh` | Debugging and harder diagnosis. |
| `max` | Reserve for the genuinely difficult cases. |

OpenRouter validates these named values. It does not accept the model's native numeric 1-100 effort values through its chat-completions gateway. See the [OpenRouter reasoning guide](https://openrouter.ai/docs/guides/best-practices/reasoning-tokens), [OpenRouter model page](https://openrouter.ai/deepseek/deepseek-v4.1-flash), and [DeepSeek V4.1 reference](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/blob/main/encoding/README.md).

## Measured demo: 33 candidates, 27 selected tasks

The repository contains a diverse bank of 33 original deterministic tasks across nine categories. The measured demo selects three graded tasks per category, for 27 tasks total. With three supervisor choices and three worker attempts per choice, one strategy arm makes 243 worker calls. The full comparison adds always-`none` and always-`high` controls, for 729 canonical worker attempts and 81 supervisor calls.

| Category | Vague brief tests |
|---|---|
| One-line repair | Whether simple code fixes earn `none` or low effort. |
| Direct extraction | Literal reading without overthinking. |
| Formatting | Deterministic transformation. |
| Bounded arithmetic | A short calculation chain. |
| Boolean logic | Explicit rule evaluation. |
| Ordering constraints | Dependencies and ordering. |
| Stateful rules | Sequential transformations. |
| Debug diagnosis | Causal software reasoning. |
| Test design | Boundary and invariant awareness. |

Task shapes are original distillations inspired by [MMLU-Pro](https://arxiv.org/abs/2406.01574), [LiveCodeBench](https://github.com/LiveCodeBench/LiveCodeBench), and [SWE-bench](https://www.swebench.com/). They are not copied benchmark items.

## Metrics

- **Success rate**: verified correct answers over all 243 canonical worker attempts per strategy.
- **Selected efforts**: the supervisor's three independent choices.
- **Zero-reasoning selection rate**: how often the supervisor declines thinking.
- **Worker, supervisor, and combined cost**: observed provider usage and dollars, so routing overhead is visible.

The static site provides recorded success, token-use, and effort snapshots, plus an interactive 3D frontier. New runs can replace those snapshots with their own JSONL report.

### Recorded expanded calibration

The completed OpenRouter comparison uses DeepSeek V4.1 Flash. After deterministic rescoring, the free-choice supervisor verified **222 of 243 answers (91.4%)**. Always-`none` verified **218 of 243 (89.7%)** and always-`high` verified **208 of 243 (85.6%)**.

The supervisor's canonical combined cost was **$0.0246**, including **$0.0047** of supervisor overhead. Always-`none` cost **$0.0037**; always-`high` cost **$0.0304**. The result is deliberately not a victory lap: the supervisor improves accuracy slightly over `none`, but the cost gap shows that its routing policy still needs calibration.

The static demo reads the complete sanitized [expanded calibration data](docs/data/expanded-v1.json): every category-task row, three selected efforts, short supervisor rationales, success counts, token totals, and costs. Responses and credentials are excluded.

## Next iteration: calibrated restraint

The revised supervisor defaults to `none`. It may escalate only when the vague brief signals multi-step state, ambiguity, dependency chains, debugging, or test design. Every decision logs a concise rationale, effort, token use, and cost.

Compare it against two controls with the same three-attempt groups:

```bash
npm run benchmark:live -- --strategy=supervisor --run=my-run --limit=81
npm run benchmark:live -- --strategy=none --run=my-run --limit=81
npm run benchmark:live -- --strategy=high --run=my-run --limit=81
npm run benchmark:publish -- --run=my-run
```

This separates harmful underthinking from harmless overthinking: if `none` fails where `high` succeeds, it is harmful; if the revised supervisor matches `high` while costing less, it is calibrated restraint.

## Run it

```bash
. /home/ruda/.nvm/nvm.sh
nvm use 22
npm test
npm run benchmark:plan
```

The plan makes no network calls. For a bounded paid pilot, place `OPENROUTER_API_KEY` in the ignored `.env` file and run one supervisor-choice group at a time:

```bash
npm run benchmark:live -- --strategy=supervisor --run=my-run --limit=1
```

One limit unit makes one supervisor request and three worker attempts. The full selected demo is `--limit=81`. Results append to ignored `results/openrouter-<strategy>-<run>.jsonl`; analyze a complete run with `npm run benchmark:analyze -- results/openrouter-supervisor-my-run.jsonl --write`, then publish its sanitized static dataset with `npm run benchmark:publish -- --run=my-run`. The runner never prints the API key.

## Design notes

- [PoC scope](design/01-poc-scope.md)
- [Rubric and metrics](design/02-rubric-and-metrics.md)
- [Implementation and validation](design/03-implementation-and-validation.md)
- [Calibrated restraint](design/04-calibrated-restraint.md)
- [Expanded calibration](design/05-expanded-calibration.md)

AI Tinkerers Prague Hackathon 12.9.2026 - part of the global [Agents, Everywhere: Bots, Channels, & More - Global Hackathon](https://prague.aitinkerers.org/p/agents-everywhere-bots-channels-more-global-hackathon).

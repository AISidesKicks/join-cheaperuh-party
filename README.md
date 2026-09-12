# [Join cheaperuh party](https://join.cheaperuh.party)

Join cheaperuh (čipera) PARTY asks a simple question: can a model spend only as much reasoning as the task deserves?

The project is a reasoning-level benchmark and a logical router PoC. It is not a model router. One model receives one task and the router suggests a single reasoning setting before inference.

![Models are not inherently lazy - reasoning levels and AI harness multi-agent orchestration](docs/assets/images/6reasoning-levels.jpeg)

## The hypothesis

One-line repairs, fact extraction, and formatting should be allowed to run with no thinking. Multi-step constraints, state tracking, debugging, and test design may benefit from progressively more reasoning. Always choosing the maximum setting wastes latency and tokens; always choosing zero harms completion.

The benchmark exposes the full response curve during calibration, then measures whether a router can choose one safe, efficient level for a new task.

## DeepSeek V4.1 Flash

The target model is `deepseek/deepseek-v4.1-flash` through OpenRouter. It is a reasoning-capable sparse MoE model with a one million-token context window. Its native reasoning budget is continuously controllable from 1 to 100. Zero is represented by disabling thinking, not by passing an unsupported numeric effort of zero.

The benchmark uses this nine-setting ladder:

| Display label | Numeric reasoning effort | Meaning |
|---|---:|---|
| Off | 0 | Thinking disabled |
| Warm-up | 12 | Minimal deliberate work |
| Low | 25 | Light reasoning |
| Low+ | 38 | Between low and high |
| High | 50 | Moderate reasoning |
| High+ | 63 | Between high and xhigh |
| Xhigh | 75 | Deep reasoning |
| Xhigh+ | 88 | Near maximum |
| Max | 100 | Maximum reasoning budget |

These labels are benchmark labels. DeepSeek's documented string aliases map differently: `low` to 50, `high` to 75, and `max` to 100. Numeric requests avoid that ambiguity. Important: OpenRouter currently validates its gateway `reasoning.effort` as named values only, so an OpenRouter key cannot execute all nine distinct numeric settings. The code therefore plans the 9 x 9 matrix from OpenRouter metadata but reserves true numeric calibration for the direct DeepSeek API with a `DEEPSEEK_API_KEY` and explicit `DEEPSEEK_MODEL`. See the [DeepSeek V4.1 encoding reference](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/blob/main/encoding/README.md), [OpenRouter model page](https://openrouter.ai/deepseek/deepseek-v4.1-flash), and [OpenRouter reasoning guide](https://openrouter.ai/docs/guides/best-practices/reasoning-tokens).

## The 9 x 9 task suite

There are nine categories, each with nine original, deterministic prompts. That creates 81 tasks. Calibrating every task at every reasoning setting produces 729 cells per model revision and prompt template.

| Category | Why it belongs |
|---|---|
| One-line repair | Tests whether zero thinking can safely handle localized fixes. |
| Direct extraction | Tests literal reading and output control. |
| Formatting | Tests constrained transformation. |
| Bounded arithmetic | Tests short calculations. |
| Boolean logic | Tests simple rule evaluation. |
| Ordering constraints | Tests dependency chains. |
| Stateful rules | Tests sequential transformations. |
| Debug diagnosis | Tests causal software reasoning. |
| Test design | Tests boundary and invariant awareness. |

The task shapes are original distillations inspired by [MMLU-Pro](https://arxiv.org/abs/2406.01574), [LiveCodeBench](https://github.com/LiveCodeBench/LiveCodeBench), and [SWE-bench](https://www.swebench.com/). They are not copied benchmark questions.

## What the benchmark measures

Each calibration record includes success, output text, provider usage, wall time, model ID, and numeric effort. The raw JSONL is the source of truth.

- **Difficulty**: failure rate across the response curve.
- **Minimum solvable effort**: lowest effort with a verified success.
- **Over-compute ratio**: average cost at and above the minimum solvable effort, divided by cost at that effort. `1.0` means no extra higher-tier spend.
- **Marginal ROI**: accuracy gain from maximum vs. disabled thinking divided by the extra cost.
- **Router safety**: selected effort has a verified success in calibration.
- **Router waste**: selected cost compared with always choosing Max.

The 3D explorer on the site plots difficulty, minimum solvable effort, and over-compute. It makes the desirable frontier visual: easy tasks near zero, difficult tasks high only when the extra work pays off.

## Run it

Use the local NVM Node 22 runtime.

```bash
. /home/ruda/.nvm/nvm.sh
nvm use 22
npm test
npm run benchmark:plan
```

`benchmark:plan` makes no network calls. It confirms the 81 tasks, nine reasoning settings, and 729 planned requests.

For a bounded paid numeric run, put `DEEPSEEK_API_KEY` and the exact direct-provider `DEEPSEEK_MODEL` identifier in the ignored `.env` file, then specify an explicit cap:

```bash
npm run benchmark:live -- --provider=deepseek --limit=9
```

The runner never prints the key. It appends results to ignored `results/deepseek-v4.1-flash.jsonl`. Increase the limit deliberately until the full 729-cell calibration is complete. Keep model revision, prompt, verifier, and provider policy fixed for a comparable run.

## Design notes

- [PoC scope](design/01-poc-scope.md)
- [Rubric and metrics](design/02-rubric-and-metrics.md)
- [Implementation and validation](design/03-implementation-and-validation.md)

AI Tinkerers Prague Hackathon 12.9.2026 - part of the global [Agents, Everywhere: Bots, Channels, & More - Global Hackathon](https://prague.aitinkerers.org/p/agents-everywhere-bots-channels-more-global-hackathon).

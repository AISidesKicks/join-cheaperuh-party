# Stage 5: expanded calibration

## Purpose

The first nine-task run established that the model could complete simple work accurately, but did not establish whether it could distinguish easy work from work that needs more reasoning. This stage replaces that narrow selection with 27 measured tasks: three task briefs in each of the nine categories.

## Task shape

Each category contributes a deliberately graded trio:

1. A direct, low-risk task where `none` is expected to be viable.
2. A compact rule, calculation, or dependency task where a small effort may be justified.
3. A task with explicit sequential state, nested logic, a larger dependency graph, diagnosis, or boundary reasoning.

The supervisor still sees only the individual vague brief. It never receives the hidden prompt, expected answer, verifier, or an oracle complexity label. The brief must state the visible reason for escalation, so the policy is evaluated on evidence rather than guessing hidden difficulty.

## Measured comparison

Every selected task receives three independent choices and three worker attempts per choice. One strategy arm therefore has 27 x 3 x 3 = 243 worker attempts. The measured comparison has three arms:

- `supervisor`: a free choice from all seven gateway-supported efforts.
- `none`: a zero-reasoning cost floor and underthinking control.
- `high`: a deliberately expensive quality control.

The full comparison therefore makes 729 worker calls and 81 supervisor decisions. All answers are deterministically verified. The run ledger records usage and dollar cost for each worker attempt and supervisor decision.

## Pass criteria

The supervisor must outperform the `none` control on the tasks with stated complexity while approaching the `high` control's verified accuracy. It must also choose `none` for a meaningful share of literal, deterministic, and isolated-repair briefs. Report combined cost, not worker cost alone, so routing overhead is visible.

## Publication

The site publishes a sanitized summary generated from the three JSONL ledgers. It includes all category rows, every supervisor decision and rationale, per-choice 3-attempt results, token use, worker cost, supervisor cost, and combined cost. Raw responses and API credentials are excluded.

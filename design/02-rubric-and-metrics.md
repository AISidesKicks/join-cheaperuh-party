# Stage 2: task rubric and metrics

| Category | Candidate tasks | Demo tasks | Expected behavior |
|---|---:|---:|---|
| One-line repair | 4 | 3 | Prefer `none` or low effort. |
| Direct extraction | 4 | 3 | Prefer `none`. |
| Formatting | 4 | 3 | Prefer `none` or minimal. |
| Bounded arithmetic | 4 | 3 | Use low to medium as needed. |
| Boolean logic | 4 | 3 | Use low to medium as needed. |
| Ordering constraints | 4 | 3 | Consider high effort. |
| Stateful rules | 3 | 3 | Consider high effort. |
| Debug diagnosis | 3 | 3 | Consider xhigh. |
| Test design | 3 | 3 | Reserve xhigh or max for real uncertainty. |

Each worker task has a deterministic answer and verifier. Each supervisor sees only the category's vague brief. The supervisor may select `none`, `minimal`, `low`, `medium`, `high`, `xhigh`, or `max`.

Report success rate over all nine worker attempts per selected task, the three selected efforts, zero-reasoning selection rate, and worker, supervisor, and combined provider cost. The seven-effort audit now supplies an empirical minimum-effort curve; its definitions live in Stage 6.

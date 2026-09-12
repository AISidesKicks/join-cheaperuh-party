# Stage 2: task rubric and metrics

| Category | Candidate tasks | Demo tasks | Expected behavior |
|---|---:|---:|---|
| One-line repair | 4 | 1 | Prefer `none` or low effort. |
| Direct extraction | 4 | 1 | Prefer `none`. |
| Formatting | 4 | 1 | Prefer `none` or minimal. |
| Bounded arithmetic | 4 | 1 | Use low to medium as needed. |
| Boolean logic | 4 | 1 | Use low to medium as needed. |
| Ordering constraints | 4 | 1 | Consider high effort. |
| Stateful rules | 3 | 1 | Consider high effort. |
| Debug diagnosis | 3 | 1 | Consider xhigh. |
| Test design | 3 | 1 | Reserve xhigh or max for real uncertainty. |

Each worker task has a deterministic answer and verifier. Each supervisor sees only the category's vague brief. The supervisor may select `none`, `minimal`, `low`, `medium`, `high`, `xhigh`, or `max`.

Report success rate over all nine worker attempts, the three selected efforts, zero-reasoning selection rate, and mean provider token use. This constrained demo measures adaptive spending. It does not claim an oracle minimum effort because it intentionally does not run every effort for every task.

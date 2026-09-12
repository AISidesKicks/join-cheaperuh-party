# Stage 2: 9 x 9 rubric and metrics

| Rubric | Tasks | Signals for a router | Likely setting |
|---|---:|---|---|
| One-line repair | 9 | Local syntax or boundary correction | Off to Low |
| Direct extraction | 9 | One literal fact | Off |
| Formatting | 9 | Deterministic text transformation | Off to Low |
| Bounded arithmetic | 9 | Short numeric chain | Low to High |
| Boolean logic | 9 | Explicit rule evaluation | Low to High |
| Ordering constraints | 9 | Dependencies and ordering | High |
| Stateful rules | 9 | Sequential state changes | High to Xhigh |
| Debug diagnosis | 9 | Causal code reasoning | Xhigh |
| Test design | 9 | Boundary and invariant selection | Xhigh to Max |

Every task has a prompt, deterministic answer, and matching rule. This lets a rule-based router work now and lets a model-based assessor later return one numeric effort.

## Reference metrics

For task `k`, the reference matrix contains three successes and costs at each level.

```
D_k = 1 - mean(success over 9 calibration attempts)
L*_k = lowest level with at least one success
R_k = mean(cost at L*_k and higher levels) / mean(cost at L*_k)
```

`D`, `L*`, and `R` preserve Variant A. Restricting `R` to `L*` and higher makes its baseline consistently 1.0 when there is no higher-tier waste. Variant B reports `DeltaAcc = accuracy(L3) - accuracy(L1)`, `Expansion = meanCost(L3) / meanCost(L1)`, and `ROI = DeltaAcc / (meanCost(L3) - meanCost(L1))`.

Router metrics are more important in this PoC: exact-level match with `L*`, safe-selection rate (the selected level had at least one reference success), under-selection rate, and cost ratio against always using L3. Exact match is intentionally not the only measure because selecting a higher successful level can be safe but inefficient.

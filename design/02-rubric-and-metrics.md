# Stage 2: 12-task rubric and metrics

| Rubric | Tasks | Signals for a router | Default level |
|---|---:|---|---|
| Direct extraction | 3 | One fact or direct format conversion, no dependency chain | L1 |
| Bounded transformation | 3 | Several stated constraints or arithmetic steps | L2 |
| Compositional reasoning | 3 | Multi-hop dependencies, ordering, counterfactuals, ambiguity checks | L2 |
| Executable debugging | 3 | Code semantics, hidden edge cases, test or tool requirement | L3 |

Every task has a prompt, a verifier rubric, and a compact `complexity` profile. This lets a rule-based router work now and lets a model-based assessor later return the same `L1` to `L3` choice.

## Reference metrics

For task `k`, the reference matrix contains three successes and costs at each level.

```
D_k = 1 - mean(success over 9 calibration attempts)
L*_k = lowest level with at least one success
R_k = mean(cost at L*_k and higher levels) / mean(cost at L*_k)
```

`D`, `L*`, and `R` preserve Variant A. Restricting `R` to `L*` and higher makes its baseline consistently 1.0 when there is no higher-tier waste. Variant B reports `DeltaAcc = accuracy(L3) - accuracy(L1)`, `Expansion = meanCost(L3) / meanCost(L1)`, and `ROI = DeltaAcc / (meanCost(L3) - meanCost(L1))`.

Router metrics are more important in this PoC: exact-level match with `L*`, safe-selection rate (the selected level had at least one reference success), under-selection rate, and cost ratio against always using L3. Exact match is intentionally not the only measure because selecting a higher successful level can be safe but inefficient.

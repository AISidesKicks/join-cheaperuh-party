# Stage 6: measured seven-effort audit

## Why a separate audit exists

The router sees only a vague brief and chooses one effort. That evaluates routing, but cannot reveal the counterfactual lowest successful effort or the whole cost-accuracy curve. The audit therefore runs every selected task at all seven OpenRouter efforts, with three attempts each: 27 x 7 x 3 = 567 canonical worker attempts.

## Variant A: absolute efficiency

For task k and effort e, let Acc(k,e) be the verified success fraction across three attempts and Cost(k,e) the mean provider cost.

- Difficulty: D(k) = 1 - mean_e Acc(k,e).
- Minimum solvable effort: L*(k) = the lowest e with Acc(k,e) > 0.
- Over-compute ratio: R(k) = mean_e Cost(k,e) / Cost(k,L*(k)).

R(k) is undefined when no effort succeeds. It is an audit metric, not an oracle available to the supervisor at routing time.

## Variant B: marginal return on reasoning

Using `none` as the lower endpoint and `max` as the upper endpoint:

- Marginal accuracy gain: DeltaAcc(k) = Acc(k,max) - Acc(k,none).
- Compute expansion: X(k) = Cost(k,max) / Cost(k,none).
- Marginal ROI: DeltaE(k) = DeltaAcc(k) / (Cost(k,max) - Cost(k,none)).
- Diminishing-return effort: the first adjacent effort whose accuracy increase is below theta = 0.05.

The adaptive-fit score is Pearson correlation between audited D(k) and the supervisor's mean selected-effort index. It measures alignment, not causation.

## Measured result

The completed effort audit cost $0.0650 canonically. Mean difficulty was 0.143, mean `none` to `max` accuracy gain was -0.074, mean compute expansion was 8.44x, mean over-compute ratio was 6.59x, and adaptive fit was 0.123. In this suite, more reasoning was not reliably better; the documentation and data preserve that negative finding.

The complete sanitized audit is published at `docs/data/effort-audit-v1.json`. Retry records are retained in local ignored ledgers and excluded from canonical scoring.

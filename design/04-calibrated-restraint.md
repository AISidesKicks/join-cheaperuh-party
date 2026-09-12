# Stage 4: calibrated restraint experiment

The original supervisor achieved high task success but never selected `none`. The next policy therefore defaults to `none` and allows escalation only for evidence visible in the vague brief: multi-step state, ambiguity, dependency chains, debugging, or test design.

Run three comparable strategies over the same selected tasks and three-attempt groups:

- `supervisor`: revised cost-aware policy.
- `none`: no-reasoning control.
- `high`: high-reasoning control.

The runner writes a worker ledger and a supervisor-decision ledger. The analyzer reports worker tokens and cost, supervisor tokens and cost, and combined cost per task. The desired outcome is supervisor success close to the high baseline at lower combined cost, with zero reasoning used where it is safe.

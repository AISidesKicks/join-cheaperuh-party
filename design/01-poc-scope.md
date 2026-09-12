# Stage 1: PoC scope

## Goal

Demonstrate a logical reasoning router: given one task, suggest one reasoning level before invoking a model. It does not route between models and it does not make nine live calls per task.

The 3 x 3 matrix is calibration evidence. For each task shape, three attempts at each of `L1`, `L2`, and `L3` establish a reference response curve. A router recommendation is replayed against that curve to estimate its expected accuracy and cost.

## Limits

The checked-in reference values are illustrative fixture data, not a claim about a real model. A real evaluation replaces the fixture with measured, pinned model runs. The PoC intentionally does not need credentials, downloads, or a live sandbox because it evaluates routing logic only.

## Source inspiration

Task shapes are original distillations inspired by broad reasoning benchmarks, not copied questions: [MMLU-Pro](https://arxiv.org/abs/2406.01574), [LiveCodeBench](https://github.com/LiveCodeBench/LiveCodeBench), and [SWE-bench](https://arxiv.org/abs/2310.06770).

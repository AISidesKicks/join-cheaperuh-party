# Stage 1: PoC scope

## Goal

Demonstrate a logical reasoning router: given one task, suggest one reasoning level before invoking a model. It does not route between models. Calibration makes nine live calls per task; evaluation makes one.

The 9 x 9 matrix is calibration evidence. There are nine categories with nine tasks each, evaluated at nine reasoning settings from disabled thinking through 100. A router recommendation is replayed against that curve to estimate its expected accuracy and cost.

## Limits

The checked-in reference values are illustrative fixture data, not a claim about a real model. A real evaluation replaces the fixture with measured, pinned model runs. The PoC intentionally does not need credentials, downloads, or a live sandbox because it evaluates routing logic only.

## Source inspiration

Task shapes are original distillations inspired by broad reasoning benchmarks, not copied questions: [MMLU-Pro](https://arxiv.org/abs/2406.01574), [LiveCodeBench](https://github.com/LiveCodeBench/LiveCodeBench), and [SWE-bench](https://arxiv.org/abs/2310.06770).

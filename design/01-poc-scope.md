# Stage 1: supervisor-routing PoC scope

The PoC evaluates a cost-conscious supervisor, not a fixed level router. The supervisor receives only a vague task brief and may choose any OpenRouter-supported effort, including `none`. It does not see the detailed worker prompt, expected answer, or calibration outcomes.

The task bank has 33 original deterministic candidates across nine categories. The measured router demo selects 27 tasks: three graded tasks per category.

Each selected task receives three independent supervisor choices. The worker then makes three attempts at each chosen effort. This is a 3 x 3 task matrix, or nine worker attempts per task. One router strategy uses 243 worker calls and 81 supervisor calls.

The separate seven-effort audit measures every selected task at `none`, `minimal`, `low`, `medium`, `high`, `xhigh`, and `max`, with three attempts each. It supplies counterfactual evidence for the formal metrics in Stage 6.

# Stage 1: supervisor-routing PoC scope

The PoC evaluates a cost-conscious supervisor, not a fixed level router. The supervisor receives only a vague task brief and may choose any OpenRouter-supported effort, including `none`. It does not see the detailed worker prompt, expected answer, or calibration outcomes.

The task bank has 33 original deterministic candidates across nine categories. The budget demo selects nine tasks, one per category.

Each selected task receives three independent supervisor choices. The worker then makes three attempts at each chosen effort. This is a 3 x 3 task matrix, or nine worker attempts per task. The full demo uses 81 worker calls and 27 supervisor calls.

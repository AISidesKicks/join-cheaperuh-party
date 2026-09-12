export const SUPPORTED_EFFORTS = ["none", "minimal", "low", "medium", "high", "xhigh", "max"] as const;
export type ReasoningEffort = (typeof SUPPORTED_EFFORTS)[number];
export const SUPERVISOR_CHOICES = 3;
export const ATTEMPTS_PER_CHOICE = 3;
export type MatchMode = "exact" | "contains" | "ordering" | "all-terms";

export interface BenchmarkTask {
  id: string;
  category: string;
  brief: string;
  prompt: string;
  expected: string;
  matchMode: MatchMode;
}

interface SeedCase { prompt: string; expected: string; matchMode?: MatchMode; brief?: string }
interface CategoryTemplate { id: string; brief: string; cases: SeedCase[] }

const categories: CategoryTemplate[] = [
  { id: "one-line-repair", brief: "A user reports a small localized code defect. Choose how much reasoning is justified before a repair.", cases: [
    { prompt: "Fix this JavaScript condition so it returns true only when count is zero: if (!count)", expected: "count === 0", matchMode: "contains", brief: "A user needs one local condition corrected; there are no dependencies or hidden state." },
    { prompt: "Fix the JavaScript loop bound so an array is never read out of range: for (let i = 0; i <= items.length; i++)", expected: "i < items.length", matchMode: "contains", brief: "A user reports one loop-bound defect in an otherwise isolated snippet." },
    { prompt: "Fix this Python comparison: if name = 'Ada':", expected: "name == 'Ada'", matchMode: "contains", brief: "A user needs a single syntax-level comparison repair." },
    { prompt: "Fix this JavaScript null guard so zero remains valid: if (!value) throw new Error()", expected: "value == null", matchMode: "contains" },
    { prompt: "Fix this TypeScript array callback to return the transformed values: items.forEach(x => x * 2)", expected: "items.map", matchMode: "contains" },
    { prompt: "Fix this Python range to include 5: range(1, 5)", expected: "range(1, 6)", matchMode: "contains" },
    { prompt: "Fix this JavaScript equality check to avoid coercion: if (id == 0)", expected: "id === 0", matchMode: "contains" },
    { prompt: "Fix this SQL predicate to match unknown values: status = NULL", expected: "status IS NULL", matchMode: "contains" },
    { prompt: "Fix this JavaScript cache key so locale is part of it: `${userId}`", expected: "${userId}:${locale}", matchMode: "contains" },
  ] },
  { id: "direct-extraction", brief: "A user asks to retrieve one explicit value from a short record.", cases: [
    { prompt: "Return only the quantity in: Order: 17 blue pens.", expected: "17", brief: "A user asks for one literal value in a one-line record." }, { prompt: "Return only the country code in: Prague, CZ.", expected: "CZ", brief: "A user asks to copy one explicit field from a short record." }, { prompt: "Return only the boolean in: active: false.", expected: "false", brief: "A user asks for one explicitly stated boolean, with no inference." },
    { prompt: "Return only the version in: release=v2.4.1.", expected: "v2.4.1" }, { prompt: "Return only the port in: localhost:5432.", expected: "5432" }, { prompt: "Return only the filename in: /srv/app/main.ts.", expected: "main.ts" },
    { prompt: "Return only the hex color in: primary=#0ea5e9.", expected: "#0ea5e9" }, { prompt: "Return only the date in: 2026-09-12T10:00:00Z.", expected: "2026-09-12" }, { prompt: "Return only the email domain in: hello@example.org.", expected: "example.org" },
  ] },
  { id: "formatting", brief: "A user needs a short value transformed into a specified format.", cases: [
    { prompt: "Return only lowercase words joined by one hyphen: '  Ada   LOVELACE '.", expected: "ada-lovelace", brief: "A user needs one deterministic string normalization." }, { prompt: "Return only camelCase for 'user profile card'.", expected: "userProfileCard", brief: "A user requests a conventional short identifier format." }, { prompt: "Return only snake_case for 'Total Price CZK'.", expected: "total_price_czk", brief: "A user needs a small deterministic formatting conversion." },
    { prompt: "Return only the ISO date for 12 September 2026.", expected: "2026-09-12" }, { prompt: "Return only the JSON array for red, green, blue.", expected: "[\"red\",\"green\",\"blue\"]" }, { prompt: "Return only the trimmed string: '  hello  '.", expected: "hello" },
    { prompt: "Return only the URL slug for 'Ship It Faster!'.", expected: "ship-it-faster" }, { prompt: "Return only the plural of 'analysis'.", expected: "analyses" }, { prompt: "Return only the title case of 'logical reasoning router'.", expected: "Logical Reasoning Router" },
  ] },
  { id: "bounded-arithmetic", brief: "A user needs a compact calculation with stated inputs and constraints.", cases: [
    { prompt: "A 120 CZK item is discounted 15%, then taxed 21%. Return only the result to two decimals.", expected: "123.42", brief: "A user needs a short two-step calculation with stated rates." }, { prompt: "Split 53 attendees into tables of 8. Return only full tables, then remainder as 'a,b'.", expected: "6,5", brief: "A user needs a compact quotient-and-remainder calculation." }, { prompt: "An invoice is 1275.50 CZK. Apply a 12.5% discount, then 21% tax, then subtract a 50 CZK credit. Return only the final amount to two decimals.", expected: "1300.44", brief: "A user needs a sequenced financial calculation with rounding only at the end." },
    { prompt: "A train leaves at 09:35 and travels 2 hours 45 minutes. Return only arrival as HH:MM.", expected: "12:20" }, { prompt: "Return only the average of 8, 11, 14, 19.", expected: "13" }, { prompt: "Return only 2 to the power of 10.", expected: "1024" },
    { prompt: "A 500 CZK bill is shared 3:2. Return only the larger share.", expected: "300" }, { prompt: "Return only the next Friday after 2026-09-12 as ISO date.", expected: "2026-09-18" }, { prompt: "Convert 3.5 hours to minutes. Return only the number.", expected: "210" },
  ] },
  { id: "boolean-logic", brief: "A user needs a decision from a small set of explicit rules.", cases: [
    { prompt: "An alert requires armed AND doorOpen AND online. armed=true, doorOpen=true, online=false. Return only yes or no.", expected: "no", brief: "A user needs one explicit boolean rule evaluated." }, { prompt: "Access requires admin OR owner. admin=false, owner=true. Return only yes or no.", expected: "yes", brief: "A user needs a small access predicate evaluated from given facts." }, { prompt: "Release is allowed when (approved AND signed) OR emergency, and NOT frozen. approved=true, signed=true, emergency=false, frozen=false. Return only yes or no.", expected: "yes", brief: "A user needs a nested policy expression evaluated from explicit inputs." },
    { prompt: "A retry occurs if timeout OR 5xx. timeout=false, status=503. Return only yes or no.", expected: "yes" }, { prompt: "Publish requires approved AND signed. approved=true, signed=true. Return only yes or no.", expected: "yes" }, { prompt: "A discount applies if member AND cart over 100. member=false, cart=120. Return only yes or no.", expected: "no" },
    { prompt: "Lock if failedAttempts >= 3. failedAttempts=3. Return only yes or no.", expected: "yes" }, { prompt: "Show banner if beta AND NOT dismissed. beta=true, dismissed=false. Return only yes or no.", expected: "yes" }, { prompt: "Run backup if Sunday OR monthEnd. It is Tuesday and not month end. Return only yes or no.", expected: "no" },
  ] },
  { id: "ordering-constraints", brief: "A user needs an answer from dependent ordering constraints.", cases: [
    { prompt: "A is before B. C is after B. D is before A. Return only the order, comma separated.", expected: "D,A,B,C", brief: "A user needs a short order derived from linked constraints." }, { prompt: "Mira is older than Noa. Noa is older than Omar. Return only the youngest.", expected: "Omar", brief: "A user needs one conclusion from a short transitive ordering." }, { prompt: "A is before D. B is before D. C is after B. E is after D. F is after E. Return only one valid order using all letters, comma separated.", expected: "A,B,C,D,E,F", matchMode: "ordering", brief: "A user needs a valid execution order from a six-item dependency graph." },
    { prompt: "P is left of Q. R is right of Q. Return only left-to-right order.", expected: "P,Q,R" }, { prompt: "Review happens after draft and before publish. Return only the order.", expected: "draft,review,publish" }, { prompt: "Lena arrives before Max. Max before Zoe. Return only the last arrival.", expected: "Zoe" },
    { prompt: "Cache clear is after deploy. Deploy is after test. Return only the first step.", expected: "test" }, { prompt: "C depends on B; B depends on A. Return only the safe order.", expected: "A,B,C" }, { prompt: "Tuesday is after Monday and before Wednesday. Return only the middle day.", expected: "Tuesday" },
  ] },
  { id: "stateful-rules", brief: "A user needs the result of several changes to an initial state.", cases: [
    { prompt: "Start balance 10. Add 7, subtract 4, add 3. Return only final balance.", expected: "16", brief: "A user needs the result of three explicit state updates." }, { prompt: "A queue starts [A,B]. Enqueue C, dequeue once. Return only the queue comma separated.", expected: "B,C", brief: "A user needs the result of a small ordered queue mutation." }, { prompt: "An account starts at 80. Apply: +25, -10%, +12, -20%, then +5. Return only the final balance to two decimals.", expected: "90.20", brief: "A user needs a sequential state simulation with percentage updates." },
    { prompt: "Counter starts 2. Double it, add 5, halve it. Return only the result.", expected: "4.5" }, { prompt: "Start at (0,0). Move north 2 then east 3. Return only x,y.", expected: "3,2" }, { prompt: "Inventory starts 9. Sell 2 then restock 6. Return only inventory.", expected: "13" },
    { prompt: "Text starts 'a'. Append 'b', reverse, append 'c'. Return only text.", expected: "bac" }, { prompt: "A set starts {a,b}. Add c, remove b. Return only comma-separated sorted members.", expected: "a,c" }, { prompt: "Score starts 100. Lose 15%, then gain 10%. Return only result.", expected: "93.5" },
  ] },
  { id: "debug-diagnosis", brief: "A user reports an application symptom and needs its likely root cause.", cases: [
    { prompt: "A request sometimes serves English to Czech users because the cache key omits locale. Return only the root cause.", expected: "omits locale", matchMode: "contains", brief: "A user reports a cross-locale cache symptom with one stated cause." }, { prompt: "A form submits twice because both click and submit handlers call save. Return only the root cause.", expected: "click|submit|save", matchMode: "all-terms", brief: "A user reports duplicate persistence from overlapping UI events." }, { prompt: "After sorting a translated product list, clicking the second row opens details for a different product. The rows use their current array index as the key. Return only the root cause.", expected: "array|index|key", matchMode: "all-terms", brief: "A user reports a UI identity bug that appears only after reordering data." },
    { prompt: "A list displays stale rows because its key is array index after sorting. Return only the root cause.", expected: "unstable index key", matchMode: "contains" }, { prompt: "An API returns 401 after refresh because the old token remains in the header. Return only the root cause.", expected: "stale authorization token", matchMode: "contains" }, { prompt: "A batch skips its last item because the loop uses i < length - 1. Return only the root cause.", expected: "off-by-one loop bound", matchMode: "contains" },
    { prompt: "A database query is slow because it filters by an unindexed email column. Return only the root cause.", expected: "missing email index", matchMode: "contains" }, { prompt: "A service crashes on null configuration because it dereferences config.port. Return only the root cause.", expected: "missing null guard", matchMode: "contains" }, { prompt: "A timezone test fails only in CI because it relies on local time. Return only the root cause.", expected: "environment-dependent timezone", matchMode: "contains" },
  ] },
  { id: "test-design", brief: "A user needs to identify a valuable boundary or invariant test for a behavior.", cases: [
    { prompt: "A function accepts an inclusive range. Name one essential edge-case test. Return only the test input.", expected: "0", matchMode: "contains", brief: "A user needs one boundary test for an inclusive range contract." }, { prompt: "A password validator has minimum length 8. Name one boundary test. Return only the length.", expected: "8", brief: "A user needs the stated threshold boundary." }, { prompt: "A pagination API accepts page >= 1 and rejects non-integers. Name the closest invalid numeric boundary. Return only the page value.", expected: "0", brief: "A user needs a boundary test from a small input-domain contract." },
    { prompt: "A division function must reject zero denominator. Return only the test denominator.", expected: "0" }, { prompt: "A sort must preserve equal-item order. Return only the property name.", expected: "stability" }, { prompt: "An email parser handles plus aliases. Return only one valid example.", expected: "a+b@example.com", matchMode: "contains" },
    { prompt: "A cache expires after 60 seconds. Return only the first time that should be expired in seconds.", expected: "61" }, { prompt: "A UTF-8 truncator must not split emoji. Return only the test character.", expected: "😀" }, { prompt: "A retry limit is 3 attempts. Return only the first rejected attempt number.", expected: "4" },
  ] },
];

const candidateCounts = [4, 4, 4, 4, 4, 4, 3, 3, 3] as const;

export const CANDIDATE_TASKS: BenchmarkTask[] = categories.flatMap((category, categoryIndex) => category.cases.slice(0, candidateCounts[categoryIndex]).map((testCase, index) => ({
  id: `${category.id}-${String(index + 1).padStart(2, "0")}`,
  category: category.id,
  brief: testCase.brief ?? category.brief,
  prompt: `${testCase.prompt}\nRespond with only the requested final answer.`,
  expected: testCase.expected,
  matchMode: testCase.matchMode ?? "exact",
})));

export const TASKS_PER_CATEGORY = 3;
export const DEMO_TASKS = categories.flatMap((category) => {
  const tasks = CANDIDATE_TASKS.filter((candidate) => candidate.category === category.id).slice(0, TASKS_PER_CATEGORY);
  if (tasks.length !== TASKS_PER_CATEGORY) throw new Error(`Expected ${TASKS_PER_CATEGORY} demo tasks in ${category.id}`);
  return tasks;
});

export function isCorrect(task: BenchmarkTask, response: string): boolean {
  const normalized = response.trim().toLowerCase();
  const expected = task.expected.toLowerCase();
  if (task.matchMode === "contains") return normalized.includes(expected);
  if (task.matchMode === "all-terms") return expected.split("|").every((term) => normalized.includes(term));
  if (task.matchMode === "ordering") {
    const values = normalized.split(",").map((value) => value.trim()).filter(Boolean);
    if (values.length !== 6 || new Set(values).size !== 6 || !["a", "b", "c", "d", "e", "f"].every((value) => values.includes(value))) return false;
    const index = (value: string) => values.indexOf(value);
    return index("a") < index("d") && index("b") < index("d") && index("b") < index("c") && index("d") < index("e") && index("e") < index("f");
  }
  return normalized.replaceAll(/\s/g, "") === expected.replaceAll(/\s/g, "");
}

export function reasoningRequest(effort: ReasoningEffort): Record<string, unknown> {
  return effort === "none" ? { enabled: false, exclude: true } : { effort, exclude: true };
}

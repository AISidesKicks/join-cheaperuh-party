import { mkdir, readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { summarizeRun, type RunRecord, type SupervisorDecision } from "./analyze-results.js";

const strategies = ["supervisor", "none", "high"] as const;
const readJsonl = async <T>(path: string): Promise<T[]> => (await readFile(path, "utf8")).split("\n").filter(Boolean).map((line) => JSON.parse(line) as T);

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const runId = process.argv.find((arg) => arg.startsWith("--run="))?.split("=")[1] ?? "expanded-v1";
  const reports = Object.fromEntries(await Promise.all(strategies.map(async (strategy) => {
    const prefix = `results/openrouter-${strategy}-${runId}`;
    const records = await readJsonl<RunRecord>(`${prefix}.jsonl`);
    const decisions = await readJsonl<SupervisorDecision>(`${prefix}-decisions.jsonl`).catch(() => []);
    return [strategy, summarizeRun(records, decisions)] as const;
  })));
  const published = { version: 1, runId, protocol: { categories: 9, selectedTasks: 27, supervisorChoicesPerTask: 3, attemptsPerChoice: 3, workerAttemptsPerStrategy: 243, selectableEfforts: ["none", "minimal", "low", "medium", "high", "xhigh", "max"] }, strategies: reports };
  await mkdir("docs/data", { recursive: true });
  await writeFile(`docs/data/${runId}.json`, `${JSON.stringify(published, null, 2)}\n`);
  console.log(`Published docs/data/${runId}.json`);
}

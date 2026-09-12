const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 4, maximumFractionDigits: 4 });
const percent = (value) => `${(value * 100).toFixed(1)}%`;
const totalSuccess = (report) => report.tasks.reduce((total, task) => total + task.successRate * 9, 0);

const data = await fetch("data/expanded-v1.json").then((response) => response.json());
const { supervisor, none, high } = data.strategies;
document.querySelector("#supervisorSuccess").textContent = `${totalSuccess(supervisor)} / ${supervisor.workerTotals.attempts}`;
document.querySelector("#supervisorRate").textContent = percent(totalSuccess(supervisor) / supervisor.workerTotals.attempts);
document.querySelector("#supervisorCost").textContent = money(supervisor.tasks.reduce((total, task) => total + task.combinedCost, 0));
document.querySelector("#runNote").textContent = `Measured OpenRouter ${data.runId}: ${data.protocol.categories} categories, ${data.protocol.selectedTasks} selected tasks, and a 3 x 3 matrix per task.`;

const reports = [["Supervisor", supervisor], ["Always none", none], ["Always high", high]];
document.querySelector("#strategyRows").innerHTML = reports.map(([label, report]) => {
  const combined = report.tasks.reduce((total, task) => total + task.combinedCost, 0);
  return `<tr><td>${label}</td><td class="good">${totalSuccess(report)} / ${report.workerTotals.attempts} (${percent(totalSuccess(report) / report.workerTotals.attempts)})</td><td>${report.workerTotals.tokens.toLocaleString()}</td><td>${money(report.workerTotals.cost)}</td><td>${money(report.supervisorTotals.cost)}</td><td>${money(combined)}</td></tr>`;
}).join("");

document.querySelector("#taskRows").innerHTML = supervisor.tasks.map((task, index) => {
  const selections = task.supervisor.selections.map((selection) => `<span class="pill" title="${selection.rationale}">${selection.effort}</span>`).join("");
  const result = (report) => `${Math.round(report.tasks[index].successRate * 9)} / 9`;
  return `<tr><td><strong>${task.category}</strong><br><span class="note">${task.taskId}</span></td><td>${selections}</td><td>${result(supervisor)}</td><td>${result(none)}</td><td>${result(high)}</td><td>${money(task.combinedCost)}</td></tr>`;
}).join("");

const retryAttempts = reports.reduce((total, [, report]) => total + report.ignoredDuplicateRecords, 0);
const recordedSpend = reports.reduce((total, [, report]) => total + report.recordedWorkerTotals.cost + report.recordedSupervisorTotals.cost, 0);
document.querySelector("#runNote").textContent += ` Canonical scoring excludes ${retryAttempts} interrupted duplicate attempts; recorded provider spend, including retries, was ${money(recordedSpend)}.`;

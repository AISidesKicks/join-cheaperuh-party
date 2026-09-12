const money = (value) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(value);
const percent = (value) => `${(value * 100).toFixed(1)}%`;
const totalSuccess = (report) => report.tasks.reduce((total, task) => total + task.successRate * 9, 0);
const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;" })[character]);

function renderFrontier(data, audit) {
  const canvas = document.querySelector("#frontier");
  const context = canvas.getContext("2d");
  const slider = document.querySelector("#effort");
  const effortValue = document.querySelector("#effortValue");
  const status = document.querySelector("#frontierStatus");
  const detail = document.querySelector("#frontierDetail");
  const matchesList = document.querySelector("#frontierMatches");
  const reset = document.querySelector("#resetFrontier");
  const efforts = data.protocol.selectableEfforts;
  const auditByTask = new Map(audit.tasks.map((task) => [task.taskId, task]));
  const supervisorTasks = data.strategies.supervisor.tasks;
  const tokenValues = supervisorTasks.map((task) => task.meanTokens);
  const minTokens = Math.min(...tokenValues);
  const maxTokens = Math.max(...tokenValues);
  const points = supervisorTasks.map((task) => ({
    ...task,
    difficulty: auditByTask.get(task.taskId)?.difficulty ?? 0,
    effort: task.selectedEfforts.reduce((total, effort) => total + efforts.indexOf(effort), 0) / task.selectedEfforts.length / (efforts.length - 1),
    tokenCost: maxTokens === minTokens ? 0.5 : (task.meanTokens - minTokens) / (maxTokens - minTokens),
  }));
  let yaw = -0.55;
  let pitch = 0.42;
  let drag = null;
  let moved = false;
  let selectedTask = null;
  let projectedPoints = [];

  const project = (x, y, z) => {
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const rotatedX = x * cy - z * sy;
    const rotatedZ = x * sy + z * cy;
    const rotatedY = y * cp - rotatedZ * sp;
    return [canvas.width / 2 + rotatedX * 300, canvas.height * 0.72 - rotatedY * 250, rotatedZ];
  };

  const selectedEffort = () => efforts[Number(slider.value)];
  const matching = () => points.filter((task) => task.selectedEfforts.includes(selectedEffort()));

  function draw() {
    const effort = selectedEffort();
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#aab7d4";
    context.font = "16px system-ui";
    context.fillText("audited difficulty →", 535, 455);
    context.fillText("mean supervisor effort ↑", 20, 40);
    context.fillText("z: worker tokens", 20, 65);
    const origin = project(-0.5, -0.5, -0.5);
    [[0.5, -0.5, -0.5], [-0.5, 0.5, -0.5], [-0.5, -0.5, 0.5]].forEach((axis) => {
      const end = project(...axis);
      context.strokeStyle = "#2d3858";
      context.beginPath();
      context.moveTo(...origin);
      context.lineTo(...end);
      context.stroke();
    });
    projectedPoints = points.map((task) => {
      const [x, y, depth] = project(task.difficulty - 0.5, task.effort - 0.5, task.tokenCost - 0.5);
      return { task, x, y, depth, matches: task.selectedEfforts.includes(effort) };
    }).sort((left, right) => left.depth - right.depth);
    projectedPoints.forEach((point) => {
      const isSelected = point.task.taskId === selectedTask?.taskId;
      context.globalAlpha = point.matches ? 1 : 0.18;
      context.fillStyle = point.matches ? "#65d6a1" : "#7aa7ff";
      context.beginPath();
      context.arc(point.x, point.y, isSelected ? 12 : point.matches ? 8 : 4, 0, Math.PI * 2);
      context.fill();
      if (point.matches || isSelected) {
        context.globalAlpha = 1;
        context.fillStyle = "#edf2ff";
        context.font = "13px system-ui";
        context.fillText(point.task.taskId.replace(/-.{3}$/, ""), point.x + 11, point.y + 4);
      }
    });
    context.globalAlpha = 1;
  }

  function update() {
    const effort = selectedEffort();
    const tasks = matching();
    effortValue.textContent = effort;
    status.textContent = `${tasks.length} of ${points.length} tasks selected ${effort} in at least one supervisor choice.`;
    matchesList.innerHTML = tasks.map((task) => `<li><strong>${escapeHtml(task.taskId)}</strong>: ${escapeHtml(task.selectedEfforts.join(", "))}</li>`).join("") || "<li>No supervisor choices at this effort.</li>";
    selectedTask = null;
    detail.textContent = "Drag to rotate. Click a highlighted point for its measured result.";
    draw();
  }

  function showTask(task) {
    selectedTask = task;
    const auditTask = auditByTask.get(task.taskId);
    detail.textContent = `${task.taskId}: ${Math.round(task.successRate * 9)}/9 supervisor success, ${task.meanTokens.toFixed(0)} mean worker tokens, ${money(task.combinedCost)} combined cost, audited difficulty ${(auditTask?.difficulty ?? 0).toFixed(2)}.`;
    draw();
  }

  slider.addEventListener("input", update);
  reset.addEventListener("click", () => { yaw = -0.55; pitch = 0.42; selectedTask = null; detail.textContent = "View reset. Drag to rotate. Click a highlighted point for its measured result."; draw(); });
  canvas.addEventListener("pointerdown", (event) => { drag = [event.clientX, event.clientY]; moved = false; canvas.setPointerCapture(event.pointerId); });
  canvas.addEventListener("pointermove", (event) => {
    if (!drag) return;
    const dx = event.clientX - drag[0], dy = event.clientY - drag[1];
    if (Math.abs(dx) + Math.abs(dy) > 2) moved = true;
    yaw += dx * 0.01;
    pitch += dy * 0.01;
    drag = [event.clientX, event.clientY];
    draw();
  });
  canvas.addEventListener("pointerup", (event) => {
    if (!moved) {
      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) * canvas.width / rect.width;
      const y = (event.clientY - rect.top) * canvas.height / rect.height;
      const closest = projectedPoints.filter((point) => point.matches).sort((left, right) => (left.x - x) ** 2 + (left.y - y) ** 2 - ((right.x - x) ** 2 + (right.y - y) ** 2))[0];
      if (closest && (closest.x - x) ** 2 + (closest.y - y) ** 2 < 324) showTask(closest.task);
    }
    drag = null;
  });
  canvas.addEventListener("keydown", (event) => { if (event.key.toLowerCase() === "r") reset.click(); });
  update();
}

try {
  const [data, audit] = await Promise.all([
    fetch("data/expanded-v1.json").then((response) => { if (!response.ok) throw new Error("Expanded calibration data could not load."); return response.json(); }),
    fetch("data/effort-audit-v1.json").then((response) => { if (!response.ok) throw new Error("Effort audit data could not load."); return response.json(); }),
  ]);
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
    const selections = task.supervisor.selections.map((selection) => `<span class="pill" title="${escapeHtml(selection.rationale)}">${escapeHtml(selection.effort)}</span>`).join("");
    const result = (report) => `${Math.round(report.tasks[index].successRate * 9)} / 9`;
    return `<tr><td><strong>${escapeHtml(task.category)}</strong><br><span class="note">${escapeHtml(task.taskId)}</span></td><td>${selections}</td><td>${result(supervisor)}</td><td>${result(none)}</td><td>${result(high)}</td><td>${money(task.combinedCost)}</td></tr>`;
  }).join("");
  const retryAttempts = reports.reduce((total, [, report]) => total + report.ignoredDuplicateRecords, 0);
  const recordedSpend = reports.reduce((total, [, report]) => total + report.recordedWorkerTotals.cost + report.recordedSupervisorTotals.cost, 0);
  document.querySelector("#runNote").textContent += ` Canonical scoring excludes ${retryAttempts} interrupted duplicate attempts; recorded provider spend, including retries, was ${money(recordedSpend)}.`;
  renderFrontier(data, audit);
} catch (error) {
  const message = error instanceof Error ? error.message : "Dashboard data could not load.";
  document.querySelector("#runNote").textContent = message;
  document.querySelector("#frontierStatus").textContent = message;
  document.querySelector("#strategyRows").innerHTML = `<tr><td colspan="6" class="warn">${escapeHtml(message)}</td></tr>`;
}

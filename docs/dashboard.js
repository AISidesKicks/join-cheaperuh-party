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
  const formatTokenTick = (value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : `${Math.round(value)} t`;
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
    return [canvas.width / 2 + rotatedX * 250, canvas.height * 0.56 - rotatedY * 210, rotatedZ];
  };

  const selectedEffort = () => efforts[Number(slider.value)];
  const matching = () => points.filter((task) => task.selectedEfforts.includes(selectedEffort()));

  function draw() {
    const effort = selectedEffort();
    const origin = project(-0.5, -0.5, -0.5);
    const xEnd = project(0.5, -0.5, -0.5);
    const yEnd = project(-0.5, 0.5, -0.5);
    const zEnd = project(-0.5, -0.5, 0.5);
    const xyEnd = project(0.5, 0.5, -0.5);
    const xzEnd = project(0.5, -0.5, 0.5);
    const yzEnd = project(-0.5, 0.5, 0.5);
    const drawPlane = (corners, color) => {
      context.fillStyle = color;
      context.beginPath();
      context.moveTo(...corners[0]);
      corners.slice(1).forEach((corner) => context.lineTo(...corner));
      context.closePath();
      context.fill();
      context.strokeStyle = "#34496f";
      context.lineWidth = 1;
      context.setLineDash([5, 6]);
      context.stroke();
      context.setLineDash([]);
    };
    const label = (text, x, y, color = "#edf2ff") => {
      context.save();
      context.font = "600 12px system-ui";
      const width = context.measureText(text).width;
      context.fillStyle = "rgba(11, 16, 32, .9)";
      context.fillRect(x - 5, y - 15, width + 10, 21);
      context.fillStyle = color;
      context.fillText(text, x, y);
      context.restore();
    };
    const drawAxis = (end, color, title, middle, endTick) => {
      const dx = end[0] - origin[0];
      const dy = end[1] - origin[1];
      const length = Math.hypot(dx, dy) || 1;
      const nx = dx / length;
      const ny = dy / length;
      const px = -ny;
      const py = nx;
      context.strokeStyle = "rgba(11, 16, 32, .9)";
      context.lineWidth = 7;
      context.beginPath();
      context.moveTo(...origin);
      context.lineTo(...end);
      context.stroke();
      context.strokeStyle = color;
      context.lineWidth = 4;
      context.beginPath();
      context.moveTo(...origin);
      context.lineTo(...end);
      context.stroke();
      context.fillStyle = color;
      context.beginPath();
      context.moveTo(end[0], end[1]);
      context.lineTo(end[0] - nx * 17 + px * 8, end[1] - ny * 17 + py * 8);
      context.lineTo(end[0] - nx * 17 - px * 8, end[1] - ny * 17 - py * 8);
      context.closePath();
      context.fill();
      [[0.5, middle], [1, endTick]].forEach(([position, tick]) => {
        const x = origin[0] + dx * position;
        const y = origin[1] + dy * position;
        context.strokeStyle = color;
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(x - px * 6, y - py * 6);
        context.lineTo(x + px * 6, y + py * 6);
        context.stroke();
        label(tick, x + px * 10 + 3, y + py * 10 + 4, color);
      });
      label(title, end[0] + px * 17 - 5, end[1] + py * 17 + 4, color);
    };
    context.fillStyle = "#17213a";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "#253755";
    context.lineWidth = 1;
    for (let step = 90; step < canvas.width; step += 90) { context.beginPath(); context.moveTo(step, 0); context.lineTo(step, canvas.height); context.stroke(); }
    for (let step = 80; step < canvas.height; step += 80) { context.beginPath(); context.moveTo(0, step); context.lineTo(canvas.width, step); context.stroke(); }
    drawPlane([origin, xEnd, xyEnd, yEnd], "rgba(122, 167, 255, .055)");
    drawPlane([origin, xEnd, xzEnd, zEnd], "rgba(101, 214, 161, .045)");
    drawPlane([origin, yEnd, yzEnd, zEnd], "rgba(255, 184, 107, .035)");
    label("3D AXES:  X difficulty  ·  Y effort  ·  Z worker tokens", 22, 29, "#edf2ff");
    label("green = selected effort  ·  blue = other measured task  ·  drag to rotate", 22, 52, "#aab7d4");
    drawAxis(xEnd, "#ffb86b", "X difficulty", "0.5", "hard");
    drawAxis(yEnd, "#65d6a1", "Y supervisor effort", "medium", "max");
    drawAxis(zEnd, "#7aa7ff", "Z worker tokens", formatTokenTick((minTokens + maxTokens) / 2), formatTokenTick(maxTokens));
    label("easy / none / low", origin[0] - 9, origin[1] + 22, "#aab7d4");
    projectedPoints = points.map((task) => {
      const [x, y, depth] = project(task.difficulty - 0.5, task.effort - 0.5, task.tokenCost - 0.5);
      return { task, x, y, depth, matches: task.selectedEfforts.includes(effort) };
    }).sort((left, right) => left.depth - right.depth);
    projectedPoints.forEach((point) => {
      const isSelected = point.task.taskId === selectedTask?.taskId;
      const radius = isSelected ? 13 : point.matches ? 10 : 5;
      if (point.matches) {
        context.globalAlpha = 1;
        context.strokeStyle = "#ff9f43";
        context.lineWidth = 4;
        context.beginPath();
        context.arc(point.x, point.y, radius + 5, 0, Math.PI * 2);
        context.stroke();
      }
      context.globalAlpha = point.matches ? 1 : 0.42;
      context.fillStyle = point.matches ? "#65d6a1" : "#7aa7ff";
      context.beginPath();
      context.arc(point.x, point.y, radius, 0, Math.PI * 2);
      context.fill();
      if (point.matches) {
        context.globalAlpha = 0.95;
        context.strokeStyle = "#0b1020";
        context.lineWidth = 2;
        context.stroke();
      }
      if (isSelected) {
        context.globalAlpha = 1;
        context.fillStyle = "#edf2ff";
        context.font = "13px system-ui";
        context.fillText(point.task.taskId.replace(/-.{3}$/, ""), point.x + 11, point.y + 4);
      }
    });
    context.globalAlpha = 1;
    canvas.dataset.rendered = "true";
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

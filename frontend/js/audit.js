// =============================================================
// The Rule of Thumb - AI Usage Audit & Monitoring
// =============================================================

async function loadAuditLogs() {
  const stats = await callBackend('audit_stats');
  const tbody = document.getElementById('audit-table-body');
  if (!tbody) return;
  tbody.innerHTML = "";

  if (stats && stats.recent_logs && stats.recent_logs.length > 0) {
    stats.recent_logs.forEach(log => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-family: var(--font-mono); color: var(--text-muted);">${log.id}</td>
        <td style="font-family: var(--font-mono); font-size: 0.8rem;">${log.timestamp}</td>
        <td><span class="badge-pill" style="margin: 0; padding: 2px 8px;">${log.tool_name}</span></td>
        <td><strong>${log.action}</strong></td>
        <td style="color: var(--text-muted);">${log.notes}</td>
      `;
      tbody.appendChild(tr);
    });
  } else {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No audit logs yet. Use the form above to record one.</td></tr>`;
  }
}

async function submitAuditLog() {
  const toolInput = document.getElementById('audit-tool-name');
  const actionInput = document.getElementById('audit-action');
  const notesInput = document.getElementById('audit-notes');

  const tool = toolInput ? toolInput.value.trim() : "";
  const action = actionInput ? actionInput.value.trim() : "";
  const notes = notesInput ? notesInput.value.trim() : "";

  if (!tool) return showToast("Tool name is required", "error");

  const res = await callBackend('audit_log', { tool_name: tool, action, notes });
  if (res && res.status === "ok") {
    showToast("Audit event recorded in SQLite!");
    if (toolInput) toolInput.value = "";
    if (actionInput) actionInput.value = "";
    if (notesInput) notesInput.value = "";
    loadAuditLogs();
    loadDashboardStats();
  } else {
    showToast(`Error logging audit: ${res?.error || "Unknown"}`, "error");
  }
}

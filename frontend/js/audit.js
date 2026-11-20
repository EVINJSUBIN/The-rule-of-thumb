// =============================================================
// The Rule of Thumb - AI Usage Audit & Sarcastic Mentor (v0 Aesthetic)
// =============================================================

function handleAuditKeydown(e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    submitAuditLog();
  }
}

function handleAuditInput(textarea) {
  // Auto-resize textarea like v0
  textarea.style.height = "70px";
  const newHeight = Math.min(220, Math.max(70, textarea.scrollHeight));
  textarea.style.height = `${newHeight}px`;

  // Toggle active styling on send button
  const sendBtn = document.getElementById('v0-submit-btn');
  if (sendBtn) {
    if (textarea.value.trim().length > 0) {
      sendBtn.classList.add('active');
    } else {
      sendBtn.classList.remove('active');
    }
  }
}

function quickFillPrompt(text) {
  const textarea = document.getElementById('audit-notes');
  if (textarea) {
    textarea.value = text;
    handleAuditInput(textarea);
    textarea.focus();
  }
}

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
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No audit logs yet. Use the prompt box above to log an action.</td></tr>`;
  }
}

async function submitAuditLog() {
  const toolInput = document.getElementById('audit-tool-name');
  const actionInput = document.getElementById('audit-action');
  const notesInput = document.getElementById('audit-notes');

  const tool = toolInput ? toolInput.value.trim() : "sarcastic_mentor";
  const action = actionInput ? actionInput.value.trim() : "architecture_review";
  const notes = notesInput ? notesInput.value.trim() : "";

  if (!notes) return showToast("Enter a prompt or question first", "error");

  // Show sarcastic mentor feedback if mentor was selected
  const mentorBox = document.getElementById('mentor-response-box');
  const mentorText = document.getElementById('mentor-response-text');
  
  if (tool === "sarcastic_mentor" && mentorBox && mentorText) {
    const snarkyReplies = [
      "Nice try asking an AI to do your job. I refuse to write a single line of code for you. Read the documentation, break the algorithm into 3 steps, and write it yourself.",
      "You have hands, don't you? Real programmers solve this with logic, not AI auto-complete. Check your data structures and handle the edge cases.",
      "Did you even look at the SQLite schema before asking? The query is two lines of standard SQL. Go type it in by hand.",
      "0% AI code generation policy is active. I can tell you what library function to look up, but your keyboard is waiting for your fingers.",
      "Your aura is slipping! Stop trying to copy-paste. Think through the state flow: input -> transform -> persist."
    ];
    const pickedReply = snarkyReplies[Math.floor(Math.random() * snarkyReplies.length)];
    mentorText.textContent = `"${pickedReply}"`;
    mentorBox.style.display = "block";
  }

  const res = await callBackend('audit_log', { tool_name: tool, action, notes });
  if (res && res.status === "ok") {
    showToast("Audit event logged in SQLite!");
    if (notesInput) {
      notesInput.value = "";
      handleAuditInput(notesInput);
    }
    loadAuditLogs();
    loadDashboardStats();
  } else {
    showToast(`Error logging audit: ${res?.error || "Unknown"}`, "error");
  }
}

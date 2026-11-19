// =============================================================
// The Rule of Thumb - Desktop Frontend Client (Tauri RPC Bridge)
// =============================================================

const hasTauri = typeof window.__TAURI__ !== 'undefined' && window.__TAURI__.core;

/**
 * Universal caller: invokes Rust Tauri commands when running in desktop app,
 * or provides graceful fallback mock responses if previewed in browser.
 */
async function callBackend(cmd, args = {}) {
  if (hasTauri) {
    try {
      const res = await window.__TAURI__.core.invoke(cmd, args);
      return typeof res === 'string' ? JSON.parse(res) : res;
    } catch (err) {
      console.error(`Tauri invoke [${cmd}] failed:`, err);
      showToast(`Error: ${err}`, "error");
      return { error: err };
    }
  } else {
    console.warn(`[Browser Demo] Mocking Tauri call: ${cmd}`, args);
    if (cmd === 'audit_stats') {
      return {
        total_ai_requests: 1,
        total_coding_seconds: 46800,
        total_coding_hours: 13.0,
        recent_logs: [
          { id: 1, timestamp: "2026-11-19 19:39:18", tool_name: "sidecar", action: "setup", notes: "offline test" }
        ]
      };
    }
    if (cmd === 'docs_installed') {
      return { installed: ["sqlite"] };
    }
    if (cmd === 'list_files') {
      return {
        filepaths: [
          "backend/sidecar.py",
          "src-tauri/src/lib.rs",
          "frontend/index.html",
          "frontend/css/style.css",
          "frontend/js/app.js",
          "README.md",
          "docs/AI_DECLARATION.md"
        ]
      };
    }
    return { status: "ok" };
  }
}

// -------------------------------------------------------------
// UI Navigation & Tab Switching
// -------------------------------------------------------------
function switchTab(tabId) {
  document.querySelectorAll('.tab-view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));

  const targetView = document.getElementById(`view-${tabId}`);
  if (targetView) targetView.classList.add('active');

  const activeBtn = Array.from(document.querySelectorAll('.nav-item')).find(b =>
    b.textContent.toLowerCase().includes(tabId)
  );
  if (activeBtn) activeBtn.classList.add('active');

  // Refresh relevant data on tab open
  if (tabId === 'dashboard') loadDashboardStats();
  if (tabId === 'docs') loadInstalledDocs();
  if (tabId === 'files') loadWorkspaceFiles();
  if (tabId === 'audit') loadAuditLogs();
}

function showToast(message, type = "info") {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  if (type === "error") toast.style.borderLeftColor = "var(--accent-red)";
  container.appendChild(toast);
  setTimeout(() => { toast.remove(); }, 3500);
}

// -------------------------------------------------------------
// Dashboard Metrics
// -------------------------------------------------------------
async function loadDashboardStats() {
  const stats = await callBackend('audit_stats');
  if (stats && !stats.error) {
    document.getElementById('stat-ai-calls').textContent = stats.total_ai_requests || 0;
    const hours = stats.total_coding_hours || 13.0;
    document.getElementById('stat-hours').innerHTML = `${hours.toFixed(1)} <span style="font-size: 1rem; color: var(--text-muted);">/ 40h</span>`;
    const pct = Math.min(100, (hours / 40) * 100);
    document.getElementById('stat-progress-bar').style.width = `${pct}%`;
  }

  const docs = await callBackend('docs_installed');
  if (docs && docs.installed) {
    document.getElementById('stat-installed-docs').textContent = docs.installed.length;
  }
}

// -------------------------------------------------------------
// Offline Docs Explorer
// -------------------------------------------------------------
let activeDocSlug = "";

async function loadInstalledDocs() {
  const res = await callBackend('docs_installed');
  const container = document.getElementById('installed-docs-list');
  container.innerHTML = "";

  if (res && res.installed && res.installed.length > 0) {
    res.installed.forEach(slug => {
      const div = document.createElement('div');
      div.className = `doc-item ${slug === activeDocSlug ? 'active' : ''}`;
      div.innerHTML = `<strong>${slug}</strong><span style="font-size: 0.75rem; color: var(--accent);">Installed</span>`;
      div.onclick = () => selectDocset(slug);
      container.appendChild(div);
    });
    if (!activeDocSlug) selectDocset(res.installed[0]);
  } else {
    container.innerHTML = `<div style="font-size: 0.82rem; color: var(--text-muted);">No offline docsets downloaded yet. Enter a slug below!</div>`;
  }
}

function selectDocset(slug) {
  activeDocSlug = slug;
  document.querySelectorAll('.doc-item').forEach(el => el.classList.remove('active'));
  loadInstalledDocs();
  searchDocEntries("");
}

async function downloadSelectedDoc() {
  const input = document.getElementById('doc-slug-input');
  const slug = input.value.trim();
  if (!slug) return showToast("Enter a slug name (e.g. 'sqlite' or 'rust')", "error");

  showToast(`Downloading '${slug}' from DevDocs CDN...`);
  const res = await callBackend('docs_download', { slug });
  if (res && res.status === "ok") {
    showToast(`'${slug}' successfully downloaded for offline use!`);
    input.value = "";
    loadInstalledDocs();
  } else {
    showToast(`Failed to download: ${res?.error || "Unknown error"}`, "error");
  }
}

let searchDebounceTimeout = null;
function debounceDocSearch() {
  clearTimeout(searchDebounceTimeout);
  searchDebounceTimeout = setTimeout(() => {
    const query = document.getElementById('doc-search-input').value.trim();
    searchDocEntries(query);
  }, 250);
}

async function searchDocEntries(query) {
  if (!activeDocSlug) return;
  const res = await callBackend('docs_search', { slug: activeDocSlug, query: query || "select" });
  const container = document.getElementById('doc-search-results');
  container.innerHTML = "";

  if (res && res.results && res.results.length > 0) {
    res.results.slice(0, 15).forEach(entry => {
      const item = document.createElement('div');
      item.className = 'search-result-item';
      item.innerHTML = `<span>${entry.name}</span><span style="font-size: 0.72rem; color: var(--text-muted);">${entry.type || ""}</span>`;
      item.onclick = () => loadDocContent(activeDocSlug, entry.path);
      container.appendChild(item);
    });
  } else {
    container.innerHTML = `<div style="font-size: 0.8rem; color: var(--text-muted); padding: 8px;">No matching results</div>`;
  }
}

async function loadDocContent(slug, path) {
  showToast(`Loading doc: ${path}...`);
  const res = await callBackend('docs_get', { slug, doc_path: path });
  const viewer = document.getElementById('doc-viewer-pane');

  if (res && res.html) {
    viewer.innerHTML = `
      <div style="margin-bottom: 1rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; display: flex; justify-content: space-between;">
        <span class="badge-pill">${slug.toUpperCase()}</span>
        <span style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-muted);">${path}</span>
      </div>
      <div class="doc-html">${res.html}</div>
    `;
  } else {
    showToast(`Failed to load article: ${res?.error || "Unknown error"}`, "error");
  }
}

// -------------------------------------------------------------
// Workspace File Explorer
// -------------------------------------------------------------
let currentOpenFilePath = "";

async function loadWorkspaceFiles() {
  const res = await callBackend('list_files', { subpath: "" });
  const container = document.getElementById('file-tree-container');
  container.innerHTML = "";

  if (res && res.filepaths && res.filepaths.length > 0) {
    res.filepaths.forEach(fp => {
      const div = document.createElement('div');
      div.className = `file-tree-item ${fp === currentOpenFilePath ? 'active' : ''}`;
      div.innerHTML = `📄 <span>${fp}</span>`;
      div.onclick = () => openFile(fp);
      container.appendChild(div);
    });
  } else {
    container.innerHTML = `<div style="color: var(--text-muted); font-size: 0.85rem;">No files found</div>`;
  }
}

async function openFile(filename) {
  currentOpenFilePath = filename;
  document.getElementById('current-file-label').textContent = filename;
  document.querySelectorAll('.file-tree-item').forEach(el => el.classList.remove('active'));
  loadWorkspaceFiles();

  const res = await callBackend('read_file', { filename });
  const editor = document.getElementById('file-editor-textarea');
  if (res && res.content !== undefined) {
    editor.value = res.content;
  } else {
    showToast(`Could not read file: ${res?.error || "Error"}`, "error");
  }
}

async function saveCurrentFile() {
  if (!currentOpenFilePath) return showToast("No file selected", "error");
  const content = document.getElementById('file-editor-textarea').value;
  const res = await callBackend('write_file', { file_path: currentOpenFilePath, content });
  if (res && (res.status === "ok" || res.success)) {
    showToast(`Saved '${currentOpenFilePath}' to disk!`);
  } else {
    showToast(`Error saving file: ${res?.error || "Unknown"}`, "error");
  }
}

// -------------------------------------------------------------
// AI Audit Logs
// -------------------------------------------------------------
async function loadAuditLogs() {
  const stats = await callBackend('audit_stats');
  const tbody = document.getElementById('audit-table-body');
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
  const tool = document.getElementById('audit-tool-name').value.trim();
  const action = document.getElementById('audit-action').value.trim();
  const notes = document.getElementById('audit-notes').value.trim();

  if (!tool) return showToast("Tool name is required", "error");

  const res = await callBackend('audit_log', { tool_name: tool, action, notes });
  if (res && res.status === "ok") {
    showToast("Audit event recorded in SQLite!");
    document.getElementById('audit-tool-name').value = "";
    document.getElementById('audit-action').value = "";
    document.getElementById('audit-notes').value = "";
    loadAuditLogs();
    loadDashboardStats();
  } else {
    showToast(`Error logging audit: ${res?.error || "Unknown"}`, "error");
  }
}

// -------------------------------------------------------------
// Stopwatch / Coding Time Tracker
// -------------------------------------------------------------
let timerRunning = false;
let timerSeconds = 0;
let timerInterval = null;

function formatTime(s) {
  const hrs = Math.floor(s / 3600).toString().padStart(2, '0');
  const mins = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
  const secs = (s % 60).toString().padStart(2, '0');
  return `${hrs}:${mins}:${secs}`;
}

function toggleTimer() {
  const btn = document.getElementById('timer-toggle-btn');
  if (!timerRunning) {
    timerRunning = true;
    btn.textContent = "⏸ Pause Session";
    btn.style.background = "var(--accent-amber)";
    timerInterval = setInterval(() => {
      timerSeconds++;
      document.getElementById('timer-display').textContent = formatTime(timerSeconds);
    }, 1000);
  } else {
    timerRunning = false;
    btn.textContent = "▶ Resume Session";
    btn.style.background = "var(--accent)";
    clearInterval(timerInterval);
  }
}

function resetTimer() {
  timerRunning = false;
  clearInterval(timerInterval);
  timerSeconds = 0;
  document.getElementById('timer-display').textContent = "00:00:00";
  const btn = document.getElementById('timer-toggle-btn');
  btn.textContent = "▶ Start Session";
  btn.style.background = "var(--accent)";
}

// Initial load
window.addEventListener('DOMContentLoaded', () => {
  loadDashboardStats();
});

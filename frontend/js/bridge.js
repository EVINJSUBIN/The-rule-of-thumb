// =============================================================
// The Rule of Thumb - Tauri RPC Bridge & Universal Caller
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

/**
 * Global toast notification system
 */
function showToast(message, type = "info") {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  if (type === "error") toast.style.borderLeftColor = "var(--accent-red)";
  container.appendChild(toast);
  setTimeout(() => { toast.remove(); }, 3500);
}

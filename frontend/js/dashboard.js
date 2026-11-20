// =============================================================
// The Rule of Thumb - Dashboard Metrics View
// =============================================================

async function loadDashboardStats() {
  const stats = await callBackend('audit_stats');
  if (stats && !stats.error) {
    const aiElem = document.getElementById('stat-ai-calls');
    if (aiElem) aiElem.textContent = stats.total_ai_requests || 0;

    const hours = stats.total_coding_hours || 13.0;
    const hoursElem = document.getElementById('stat-hours');
    if (hoursElem) {
      hoursElem.innerHTML = `${hours.toFixed(1)} <span style="font-size: 1rem; color: var(--text-muted);">/ 40h</span>`;
    }

    const pct = Math.min(100, (hours / 40) * 100);
    const progressElem = document.getElementById('stat-progress-bar');
    if (progressElem) progressElem.style.width = `${pct}%`;
  }

  const docs = await callBackend('docs_installed');
  if (docs && docs.installed) {
    const docsElem = document.getElementById('stat-installed-docs');
    if (docsElem) docsElem.textContent = docs.installed.length;
  }
}

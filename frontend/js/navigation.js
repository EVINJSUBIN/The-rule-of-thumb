// =============================================================
// The Rule of Thumb - Navigation & Tab Switcher
// =============================================================

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

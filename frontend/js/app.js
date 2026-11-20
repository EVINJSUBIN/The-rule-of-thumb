// =============================================================
// The Rule of Thumb - Main Application Bootstrap
// Loads modular scripts: bridge.js, navigation.js, dashboard.js,
// docs.js, files.js, audit.js, tracker.js
// =============================================================

window.addEventListener('DOMContentLoaded', () => {
  console.log("The Rule of Thumb desktop shell initialized.");
  if (typeof loadDashboardStats === 'function') {
    loadDashboardStats();
  }
});

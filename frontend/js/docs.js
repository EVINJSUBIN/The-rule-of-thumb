// =============================================================
// The Rule of Thumb - Offline DevDocs Explorer & Reader
// =============================================================

let activeDocSlug = "";
let searchDebounceTimeout = null;

async function loadInstalledDocs() {
  const res = await callBackend('docs_installed');
  const container = document.getElementById('installed-docs-list');
  if (!container) return;
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

function debounceDocSearch() {
  clearTimeout(searchDebounceTimeout);
  searchDebounceTimeout = setTimeout(() => {
    const input = document.getElementById('doc-search-input');
    const query = input ? input.value.trim() : "";
    searchDocEntries(query);
  }, 250);
}

async function searchDocEntries(query) {
  if (!activeDocSlug) return;
  const res = await callBackend('docs_search', { slug: activeDocSlug, query: query || "select" });
  const container = document.getElementById('doc-search-results');
  if (!container) return;
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
  if (!viewer) return;

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

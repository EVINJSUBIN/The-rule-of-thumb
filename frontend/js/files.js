// =============================================================
// The Rule of Thumb - Workspace File Explorer & Code Editor
// =============================================================

let currentOpenFilePath = "";

async function loadWorkspaceFiles() {
  const res = await callBackend('list_files', { subpath: "" });
  const container = document.getElementById('file-tree-container');
  if (!container) return;
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
  const labelElem = document.getElementById('current-file-label');
  if (labelElem) labelElem.textContent = filename;
  document.querySelectorAll('.file-tree-item').forEach(el => el.classList.remove('active'));
  loadWorkspaceFiles();

  const res = await callBackend('read_file', { filename });
  const editor = document.getElementById('file-editor-textarea');
  if (res && res.content !== undefined) {
    if (editor) editor.value = res.content;
  } else {
    showToast(`Could not read file: ${res?.error || "Error"}`, "error");
  }
}

async function saveCurrentFile() {
  if (!currentOpenFilePath) return showToast("No file selected", "error");
  const editor = document.getElementById('file-editor-textarea');
  const content = editor ? editor.value : "";
  const res = await callBackend('write_file', { file_path: currentOpenFilePath, content });
  if (res && (res.status === "ok" || res.success)) {
    showToast(`Saved '${currentOpenFilePath}' to disk!`);
  } else {
    showToast(`Error saving file: ${res?.error || "Unknown"}`, "error");
  }
}

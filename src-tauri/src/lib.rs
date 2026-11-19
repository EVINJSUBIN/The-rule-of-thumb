use std::process::Command;

/// Executes the Python sidecar engine with command and arguments.
fn call_sidecar(cmd: &str, arg1: Option<&str>, arg2: Option<&str>) -> Result<String, String> {
    let mut command = Command::new("python");
    command.arg("backend/sidecar.py").arg(cmd);
    
    if let Some(a1) = arg1 {
        command.arg(a1);
    }
    if let Some(a2) = arg2 {
        command.arg(a2);
    }
    
    let output = command
        .output()
        .map_err(|e| format!("Failed to invoke Python sidecar: {}", e))?;
        
    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }
    
    Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
}

#[tauri::command]
fn read_file(filename: String) -> Result<String, String> {
    call_sidecar("read", Some(&filename), None)
}

#[tauri::command]
fn write_file(file_path: String, content: String) -> Result<String, String> {
    call_sidecar("write", Some(&file_path), Some(&content))
}

#[tauri::command]
fn list_files(subpath: Option<String>) -> Result<String, String> {
    call_sidecar("list", subpath.as_deref(), None)
}

#[tauri::command]
fn docs_available() -> Result<String, String> {
    call_sidecar("docs_available", None, None)
}

#[tauri::command]
fn docs_download(slug: String) -> Result<String, String> {
    let payload = format!("{{\"slug\":\"{}\"}}", slug);
    call_sidecar("docs_download", Some(&payload), None)
}

#[tauri::command]
fn docs_installed() -> Result<String, String> {
    call_sidecar("docs_installed", None, None)
}

#[tauri::command]
fn docs_search(slug: String, query: String) -> Result<String, String> {
    let payload = format!("{{\"slug\":\"{}\",\"query\":\"{}\"}}", slug, query);
    call_sidecar("docs_search", Some(&payload), None)
}

#[tauri::command]
fn docs_get(slug: String, doc_path: String) -> Result<String, String> {
    let payload = format!("{{\"slug\":\"{}\",\"doc_path\":\"{}\"}}", slug, doc_path);
    call_sidecar("docs_get", Some(&payload), None)
}

#[tauri::command]
fn audit_log(tool_name: String, action: String, notes: String) -> Result<String, String> {
    let payload = format!(
        "{{\"tool_name\":\"{}\",\"action\":\"{}\",\"notes\":\"{}\"}}",
        tool_name, action, notes
    );
    call_sidecar("audit_log", Some(&payload), None)
}

#[tauri::command]
fn audit_stats() -> Result<String, String> {
    call_sidecar("audit_stats", None, None)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            read_file,
            write_file,
            list_files,
            docs_available,
            docs_download,
            docs_installed,
            docs_search,
            docs_get,
            audit_log,
            audit_stats
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

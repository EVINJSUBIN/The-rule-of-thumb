use std::path::PathBuf;
use std::process::Command;

fn project_root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("..")
}

/// Executes the Python sidecar engine with command and arguments.
fn sidecar_json(cmd: &str, payload: serde_json::Value) -> Result<String, String> {
    call_sidecar(cmd, Some(&payload.to_string()), None)
}

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
        .current_dir(project_root())
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

#[tauri::command]
fn session_record(duration_seconds: i64, project_name: Option<String>) -> Result<String, String> {
    let name = project_name.unwrap_or_else(|| "The Rule of Thumb".to_string());
    let safe_name = name.replace('\\', "\\\\").replace('"', "\\\"");
    let payload = format!(
        "{{\"duration_seconds\":{},\"project_name\":\"{}\"}}",
        duration_seconds, safe_name
    );
    call_sidecar("session_record", Some(&payload), None)
}

#[tauri::command]
fn sessions_list() -> Result<String, String> {
    call_sidecar("sessions_list", None, None)
}

#[tauri::command]
fn telemetry_record(key_count: i64, source: Option<String>) -> Result<String, String> {
    sidecar_json(
        "telemetry_record",
        serde_json::json!({
            "key_count": key_count,
            "source": source.unwrap_or_else(|| "typing".to_string()),
        }),
    )
}

#[tauri::command]
fn telemetry_stats() -> Result<String, String> {
    call_sidecar("telemetry_stats", None, None)
}

#[tauri::command]
fn errors_analyze(error_text: String) -> Result<String, String> {
    sidecar_json(
        "errors_analyze",
        serde_json::json!({ "error_text": error_text }),
    )
}

#[tauri::command]
fn errors_list() -> Result<String, String> {
    call_sidecar("errors_list", None, None)
}

#[tauri::command]
fn tasks_add(title: String, detail: Option<String>, source: Option<String>) -> Result<String, String> {
    sidecar_json(
        "tasks_add",
        serde_json::json!({
            "title": title,
            "detail": detail.unwrap_or_default(),
            "source": source.unwrap_or_else(|| "you".to_string()),
        }),
    )
}

#[tauri::command]
fn tasks_list() -> Result<String, String> {
    call_sidecar("tasks_list", None, None)
}

#[tauri::command]
fn tasks_update(task_id: i64, status: String) -> Result<String, String> {
    sidecar_json(
        "tasks_update",
        serde_json::json!({ "task_id": task_id, "status": status }),
    )
}

#[tauri::command]
fn rule_status() -> Result<String, String> {
    call_sidecar("rule_status", None, None)
}

#[tauri::command]
fn projects_list() -> Result<String, String> {
    call_sidecar("projects_list", None, None)
}

#[tauri::command]
fn projects_add(name: String, tags: String) -> Result<String, String> {
    sidecar_json(
        "projects_add",
        serde_json::json!({ "name": name, "tags": tags }),
    )
}

#[tauri::command]
fn git_status(folder: String) -> Result<String, String> {
    sidecar_json("git_status", serde_json::json!({ "folder": folder }))
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
            audit_stats,
            session_record,
            sessions_list,
            telemetry_record,
            telemetry_stats,
            errors_analyze,
            errors_list,
            tasks_add,
            tasks_list,
            tasks_update,
            rule_status,
            projects_list,
            projects_add,
            git_status
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

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
pub fn read_file(filename: String) -> Result<String, String> {
    call_sidecar("read", Some(&filename), None)
}

#[tauri::command]
pub fn write_file(file_path: String, content: String) -> Result<String, String> {
    call_sidecar("write", Some(&file_path), Some(&content))
}

#[tauri::command]
pub fn list_files(subpath: Option<String>) -> Result<String, String> {
    call_sidecar("list", subpath.as_deref(), None)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            read_file,
            write_file,
            list_files
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

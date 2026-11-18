"""
The Rule of Thumb - Python Sidecar Engine
Zero-dependency, pure Python JSON-RPC processor.
Communicates with Tauri via stdin/stdout and command line arguments.
NO Flask, NO HTTP server, NO open ports.
"""

import sys
import os
import json

# Root project directory
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATA_DIR = os.path.join(BASE_DIR, "data")
DOCS_DIR = os.path.join(DATA_DIR, "docs")

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(DOCS_DIR, exist_ok=True)

# -------------------------------------------------------------
# Core Domain Logic (Maintained from your Hour 1 Coding Session)
# -------------------------------------------------------------

def handle_read(filename):
    """
    Reads a file relative to BASE_DIR.
    """
    if not filename:
        return {"error": "Missing filename parameter"}
    
    file_path = os.path.join(BASE_DIR, filename)
    if not os.path.exists(file_path):
        return {"error": f"File '{filename}' not found"}
    
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        return {"filename": filename, "content": content}
    except Exception as e:
        return {"error": str(e)}


def handle_write(file_path, content):
    """
    Writes content to a file, auto-creating parent directories.
    """
    if not file_path:
        return {"error": "Missing file_path parameter"}
    if content is None:
        return {"error": "Missing content parameter"}
    
    full_path = os.path.join(BASE_DIR, file_path)
    try:
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(content)
        return {"status": "ok", "message": f"Data successfully written into '{file_path}'"}
    except Exception as e:
        return {"error": str(e)}


def handle_list(subpath=""):
    """
    Lists workspace files relative to BASE_DIR, skipping VCS & cache noise.
    """
    full_path = os.path.join(BASE_DIR, subpath if subpath else "")
    if not os.path.isdir(full_path):
        return {"error": f"Path '{full_path}' does not exist or is not a directory"}
    
    try:
        file_list = []
        ignored = {".git", "__pycache__", ".venv", "node_modules", "target"}
        for root, dirs, files in os.walk(full_path):
            dirs[:] = [d for d in dirs if d not in ignored]
            for name in files:
                abs_path = os.path.join(root, name)
                rel_path = os.path.relpath(abs_path, BASE_DIR)
                file_list.append(rel_path)
        return {"filepaths": file_list}
    except Exception as e:
        return {"error": str(e)}


def handle_docs_installed():
    """
    Returns list of installed offline docsets in data/docs/
    """
    try:
        installed = [d for d in os.listdir(DOCS_DIR) if os.path.isdir(os.path.join(DOCS_DIR, d))]
        return {"installed": installed}
    except Exception as e:
        return {"error": str(e)}

# -------------------------------------------------------------
# Dispatcher / CLI Entry Point
# -------------------------------------------------------------

def process_command(cmd, payload):
    if cmd == "read":
        return handle_read(payload.get("filename"))
    elif cmd == "write":
        return handle_write(payload.get("file_path"), payload.get("content"))
    elif cmd == "list":
        return handle_list(payload.get("subpath", ""))
    elif cmd == "docs_installed":
        return handle_docs_installed()
    else:
        return {"error": f"Unknown command: '{cmd}'"}


def main():
    """
    Can run in two modes:
    1. Single-shot CLI mode:
       - python sidecar.py read <filename>
       - python sidecar.py write <file_path> <content>
       - python sidecar.py list [subpath]
       - Or python sidecar.py <cmd> '<json_payload>'
    2. Interactive line-by-line stdio mode for long-running Tauri process
    """
    if len(sys.argv) >= 2:
        cmd = sys.argv[1]
        payload = {}
        if len(sys.argv) >= 3:
            raw_arg = sys.argv[2]
            try:
                payload = json.loads(raw_arg)
            except Exception:
                if cmd == "read":
                    payload = {"filename": raw_arg}
                elif cmd == "write" and len(sys.argv) >= 4:
                    payload = {"file_path": raw_arg, "content": sys.argv[3]}
                elif cmd == "list":
                    payload = {"subpath": raw_arg}
                else:
                    payload = {"arg": raw_arg}
        result = process_command(cmd, payload)
        print(json.dumps(result))
        return

    # Fallback to stdin line loop
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            req = json.loads(line)
            cmd = req.get("cmd")
            payload = req.get("payload", {})
            res = process_command(cmd, payload)
            print(json.dumps(res), flush=True)
        except Exception as e:
            print(json.dumps({"error": f"Invalid JSON input: {str(e)}"}), flush=True)


if __name__ == "__main__":
    main()

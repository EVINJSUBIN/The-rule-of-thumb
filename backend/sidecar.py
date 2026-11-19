"""
The Rule of Thumb - Python Sidecar Engine
Zero-dependency, pure Python JSON-RPC processor.
Communicates with Tauri via stdin/stdout and command line arguments.
NO Flask, NO HTTP server, NO open ports.
"""

import sys
import os
import json
import urllib.request
import sqlite3
# Root project directory
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATA_DIR = os.path.join(BASE_DIR, "data")
DOCS_DIR = os.path.join(DATA_DIR, "docs")

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(DOCS_DIR, exist_ok=True)
url = "https://devdocs.io/docs.json"
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
# TODO BLOCK 1: Offline Docs — Fetch & Download from DevDocs CDN
# YOUR TASK: Write these two functions using only stdlib (no pip)
# -------------------------------------------------------------

def handle_docs_available():
    try:
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "TheRuleOfThumb/0.1.0"}
        )
        with urllib.request.urlopen(req, timeout=15) as response:
            raw = response.read().decode("utf-8")
            all_docs = json.loads(raw)

        cleaned = []
        for doc in all_docs:
            cleaned.append({
                "name": doc.get("name"),
                "slug": doc.get("slug"),
                "type": doc.get("type"),
                "links": doc.get("links"),
                "release": doc.get("release"),
                "db_size": doc.get("db_size"),
                "attribution": doc.get("attribution")
            })
        return {"docs": cleaned}
    except Exception as e:
        return {"error": str(e)}

def handle_docs_download(slug):
    if not slug or not str(slug).strip():
        return {"error": "Missing slug"}
    slug = str(slug).strip()
    try:
        docs_dir = os.path.join(DOCS_DIR, slug)
        os.makedirs(docs_dir, exist_ok=True)

        headers = {"User-Agent": "TheRuleOfThumb/0.1.0"}
        
        # 1. Download index.json
        index_url = f"https://documents.devdocs.io/{slug}/index.json"
        req_index = urllib.request.Request(index_url, headers=headers)
        with urllib.request.urlopen(req_index, timeout=30) as resp:
            index_data = resp.read()
        with open(os.path.join(docs_dir, "index.json"), "wb") as f:
            f.write(index_data)

        # 2. Download db.json
        db_url = f"https://documents.devdocs.io/{slug}/db.json"
        req_db = urllib.request.Request(db_url, headers=headers)
        with urllib.request.urlopen(req_db, timeout=60) as resp:
            db_data = resp.read()
        with open(os.path.join(docs_dir, "db.json"), "wb") as f:
            f.write(db_data)

        return {"status": "ok", "slug": slug, "path": docs_dir}
    except Exception as e:
        return {"error": str(e)}


# -------------------------------------------------------------
# TODO BLOCK 2: AI Audit Logging & Stats (SQLite)
# YOUR TASK: Write these two functions to track AI usage
# -------------------------------------------------------------

# Database path (same as database.py uses)
DB_PATH = os.path.join(DATA_DIR, "ruleofthumb.db")


def handle_audit_log(tool_name, action, notes):
    """
    Logs an AI interaction into the ai_logs SQLite table.
    Called every time an LLM/MCP tool is used on this project.
    """
    if not tool_name:
        return {"error": "Missing tool_name"}

    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO ai_logs (tool_name, action, notes) VALUES (?, ?, ?)",
            (tool_name, action or "", notes or "")
        )
        conn.commit()
        last_id = cursor.lastrowid
        conn.close()
        return {"status": "ok", "id": last_id}
    except Exception as e:
        return {"error": str(e)}


def handle_audit_stats():
    """
    Returns summary statistics: total AI requests + total coding seconds.
    Powers the dashboard stats cards.
    """
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*) FROM ai_logs")
        ai_count = cursor.fetchone()[0]

        cursor.execute("SELECT COALESCE(SUM(duration_seconds), 0) FROM coding_sessions")
        coding_seconds = cursor.fetchone()[0]

        cursor.execute("SELECT id, timestamp, tool_name, action, notes FROM ai_logs ORDER BY id DESC LIMIT 10")
        recent_logs = []
        for row in cursor.fetchall():
            recent_logs.append({
                "id": row[0],
                "timestamp": row[1],
                "tool_name": row[2],
                "action": row[3],
                "notes": row[4]
            })

        conn.close()
        return {
            "total_ai_requests": ai_count,
            "total_coding_seconds": coding_seconds,
            "total_coding_hours": round(coding_seconds / 3600, 2),
            "recent_logs": recent_logs
        }
    except Exception as e:
        return {"error": str(e)}


def handle_docs_search(slug, query):
    """
    Searches index.json of an installed docset for a query string.
    """
    if not slug:
        return {"error": "Missing slug"}
    if not query:
        return {"results": []}

    doc_index_path = os.path.join(DOCS_DIR, slug, "index.json")
    if not os.path.exists(doc_index_path):
        return {"error": f"Docset '{slug}' not found locally. Please download it first."}

    try:
        with open(doc_index_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        entries = data.get("entries", [])
        q = query.lower()
        matches = []
        for item in entries:
            name = item.get("name", "")
            if q in name.lower():
                matches.append(item)
                if len(matches) >= 50:
                    break
        return {"slug": slug, "query": query, "results": matches}
    except Exception as e:
        return {"error": str(e)}


def handle_docs_get(slug, doc_path):
    """
    Retrieves full rendered HTML content for a specific doc page from local db.json.
    """
    if not slug or not doc_path:
        return {"error": "Missing slug or doc_path"}

    clean_path = doc_path.split("#")[0]
    db_path = os.path.join(DOCS_DIR, slug, "db.json")
    if not os.path.exists(db_path):
        return {"error": f"Docset '{slug}' not found locally."}

    try:
        with open(db_path, "r", encoding="utf-8") as f:
            db_data = json.load(f)

        html = db_data.get(clean_path) or db_data.get(doc_path)
        if html is None:
            return {"error": f"Article '{doc_path}' not found in docset '{slug}'"}

        return {"slug": slug, "path": doc_path, "html": html}
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
    # --- TODO: These will work once you implement the functions above ---
    elif cmd == "docs_available":
        return handle_docs_available()
    elif cmd == "docs_download":
        return handle_docs_download(payload.get("slug"))
    elif cmd == "docs_search":
        return handle_docs_search(payload.get("slug"), payload.get("query"))
    elif cmd == "docs_get":
        return handle_docs_get(payload.get("slug"), payload.get("doc_path"))
    elif cmd == "audit_log":
        return handle_audit_log(
            payload.get("tool_name"),
            payload.get("action"),
            payload.get("notes")
        )
    elif cmd == "audit_stats":
        return handle_audit_stats()
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
            raw_arg = " ".join(sys.argv[2:])
            try:
                payload = json.loads(raw_arg)
            except Exception:
                if cmd == "read":
                    payload = {"filename": sys.argv[2]}
                elif cmd == "write" and len(sys.argv) >= 4:
                    payload = {"file_path": sys.argv[2], "content": sys.argv[3]}
                elif cmd == "list":
                    payload = {"subpath": sys.argv[2]}
                elif cmd == "docs_download":
                    payload = {"slug": sys.argv[2]}
                elif cmd == "docs_search" and len(sys.argv) >= 4:
                    payload = {"slug": sys.argv[2], "query": sys.argv[3]}
                elif cmd == "docs_get" and len(sys.argv) >= 4:
                    payload = {"slug": sys.argv[2], "doc_path": sys.argv[3]}
                elif cmd == "audit_log":
                    payload = {
                        "tool_name": sys.argv[2],
                        "action": sys.argv[3] if len(sys.argv) >= 4 else "",
                        "notes": sys.argv[4] if len(sys.argv) >= 5 else ""
                    }
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

"""
The Rule of Thumb - Python Sidecar Engine
Zero-dependency, pure Python JSON-RPC processor.
Communicates with Tauri via stdin/stdout and command line arguments.
NO Flask, NO HTTP server, NO open ports.
"""

import sys
import os
import re
import json
import subprocess
import urllib.request
import sqlite3
from datetime import datetime,timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import logic
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


def handle_docs_search(slug, query, type_name=""):
    """
    Searches index.json of an installed docset for a query string.
    An empty query returns one type at a time so large sets stay usable.
    """
    if not slug:
        return {"error": "Missing slug"}
    query = "" if query is None else str(query)
    type_name = "" if type_name is None else str(type_name)

    doc_index_path = os.path.join(DOCS_DIR, slug, "index.json")
    if not os.path.exists(doc_index_path):
        return {"error": f"Docset '{slug}' not found locally. Please download it first."}

    try:
        with open(doc_index_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        entries = data.get("entries", [])
        types = data.get("types") or []
        q = query.lower().strip()
        active_type = type_name
        matches = []
        if q:
            for item in entries:
                name = item.get("name", "")
                path = item.get("path", "")
                if q in name.lower() or q in path.lower():
                    matches.append({
                        "name": name,
                        "path": path,
                        "type": item.get("type", ""),
                    })
                    if len(matches) >= 120:
                        break
            active_type = ""
        else:
            if not active_type and types:
                active_type = types[0].get("name", "")
            for item in entries:
                if active_type and item.get("type") != active_type:
                    continue
                matches.append({
                    "name": item.get("name", ""),
                    "path": item.get("path", ""),
                    "type": item.get("type", ""),
                })
        return {
            "slug": slug,
            "query": query,
            "total": len(entries),
            "types": types,
            "active_type": active_type,
            "results": matches,
        }
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

        html = None
        for key in (clean_path, doc_path, clean_path.rstrip("/"), clean_path + ".html"):
            if key and key in db_data:
                html = db_data[key]
                break
        if html is None:
            lower = {str(key).lower(): value for key, value in db_data.items()}
            html = lower.get(clean_path.lower())
        if isinstance(html, dict):
            html = html.get("content") or html.get("html") or ""
        if not isinstance(html, str) or not html:
            return {"error": f"Article '{doc_path}' not found in docset '{slug}'"}

        return {"slug": slug, "path": doc_path, "html": html}
    except Exception as e:
        return {"error": str(e)}

def handle_session_record(duration_seconds, project_name="Project 1"):
    try:
        duration_seconds = int(duration_seconds)
    except (TypeError, ValueError):
        return {"error": "duration_seconds must be an integer"}
    if duration_seconds < 0:
        return {"error": "duration_seconds must be zero or greater"}

    end_time = datetime.now()
    start_time = end_time - timedelta(seconds=duration_seconds)

    conn = sqlite3.connect(DB_PATH)
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO coding_sessions
                (start_time, end_time, duration_seconds, project_name)
            VALUES (?, ?, ?, ?)
            """,
            (
                start_time.strftime("%Y-%m-%d %H:%M:%S"),
                end_time.strftime("%Y-%m-%d %H:%M:%S"),
                duration_seconds,
                project_name,
            )
        )
        conn.commit()
        return {
            "status": "ok",
            "id": cursor.lastrowid,
            "duration_seconds": duration_seconds,
            "project_name": project_name,
            "message": "Coding session logged successfully"
        }
    except Exception as e:
        return {"error": str(e)}
    finally:
        conn.close()


def ensure_schema():
    conn = sqlite3.connect(DB_PATH)
    try:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS ai_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                tool_name TEXT NOT NULL,
                action TEXT,
                notes TEXT
            );
            CREATE TABLE IF NOT EXISTS coding_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                end_time DATETIME,
                duration_seconds INTEGER DEFAULT 0,
                project_name TEXT
            );
            CREATE TABLE IF NOT EXISTS typing_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                key_count INTEGER NOT NULL,
                source TEXT
            );
            CREATE TABLE IF NOT EXISTS error_reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                raw_text TEXT NOT NULL,
                match_json TEXT
            );
            CREATE TABLE IF NOT EXISTS projects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                name TEXT NOT NULL,
                tags TEXT,
                slugs TEXT
            );
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                title TEXT NOT NULL,
                detail TEXT,
                source TEXT,
                status TEXT DEFAULT 'open'
            );
        """)
        conn.commit()
    finally:
        conn.close()


def _call_your_logic(fn, *args):
    try:
        return {"logic": "ready", "result": fn(*args)}
    except NotImplementedError:
        return {"logic": "pending", "file": "backend/logic.py", "function": fn.__name__}


def handle_sessions_list():
    ensure_schema()
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT id, start_time, end_time, duration_seconds, project_name
            FROM coding_sessions
            ORDER BY id DESC
            LIMIT 30
            """
        )
        rows = []
        for row in cursor.fetchall():
            rows.append({
                "id": row[0],
                "start_time": row[1],
                "end_time": row[2],
                "duration_seconds": row[3],
                "project_name": row[4],
            })
        cursor.execute("SELECT COALESCE(SUM(duration_seconds), 0) FROM coding_sessions")
        total = cursor.fetchone()[0]
        conn.close()
        return {"sessions": rows, "total_coding_seconds": total}
    except Exception as e:
        return {"error": str(e)}


def handle_telemetry_record(key_count, source="typing"):
    ensure_schema()
    try:
        key_count = int(key_count)
    except (TypeError, ValueError):
        return {"error": "key_count must be an integer"}
    if key_count <= 0:
        return {"status": "ok", "stored": 0}
    conn = sqlite3.connect(DB_PATH)
    try:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO typing_events (timestamp, key_count, source) VALUES (?, ?, ?)",
            (datetime.now().strftime("%Y-%m-%d %H:%M:%S"), key_count, source or "typing"),
        )
        conn.commit()
        cursor.execute("SELECT COALESCE(SUM(key_count), 0) FROM typing_events")
        total = cursor.fetchone()[0]
        return {"status": "ok", "stored": key_count, "total_keystrokes": total}
    except Exception as e:
        return {"error": str(e)}
    finally:
        conn.close()


def handle_telemetry_stats():
    ensure_schema()
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT COALESCE(SUM(key_count), 0) FROM typing_events")
        total = cursor.fetchone()[0]
        conn.close()
        judged = _call_your_logic(logic.typing_seconds_from_keystrokes, total)
        return {"total_keystrokes": total, "typing_time": judged}
    except Exception as e:
        return {"error": str(e)}


def handle_errors_analyze(error_text):
    ensure_schema()
    if not error_text or not str(error_text).strip():
        return {"error": "Paste an error first"}
    error_text = str(error_text)
    installed = []
    try:
        installed = [d for d in os.listdir(DOCS_DIR) if os.path.isdir(os.path.join(DOCS_DIR, d))]
    except Exception:
        installed = []
    judged = _call_your_logic(logic.match_error_to_docs, error_text, installed)
    conn = sqlite3.connect(DB_PATH)
    try:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO error_reports (timestamp, raw_text, match_json) VALUES (?, ?, ?)",
            (datetime.now().strftime("%Y-%m-%d %H:%M:%S"), error_text, json.dumps(judged)),
        )
        conn.commit()
        return {"status": "ok", "id": cursor.lastrowid, "match": judged}
    except Exception as e:
        return {"error": str(e)}
    finally:
        conn.close()


def handle_errors_list():
    ensure_schema()
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, timestamp, raw_text, match_json FROM error_reports ORDER BY id DESC LIMIT 20"
        )
        rows = []
        for row in cursor.fetchall():
            rows.append({
                "id": row[0],
                "timestamp": row[1],
                "raw_text": row[2],
                "match": json.loads(row[3]) if row[3] else None,
            })
        conn.close()
        return {"errors": rows}
    except Exception as e:
        return {"error": str(e)}


def handle_tasks_add(title, detail="", source="you"):
    ensure_schema()
    if not title or not str(title).strip():
        return {"error": "Missing title"}
    conn = sqlite3.connect(DB_PATH)
    try:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO tasks (timestamp, title, detail, source, status) VALUES (?, ?, ?, ?, 'open')",
            (datetime.now().strftime("%Y-%m-%d %H:%M:%S"), str(title).strip(), detail or "", source or "you"),
        )
        conn.commit()
        return {"status": "ok", "id": cursor.lastrowid}
    except Exception as e:
        return {"error": str(e)}
    finally:
        conn.close()


def handle_tasks_list():
    ensure_schema()
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, timestamp, title, detail, source, status FROM tasks ORDER BY id DESC LIMIT 40"
        )
        rows = []
        for row in cursor.fetchall():
            rows.append({
                "id": row[0],
                "timestamp": row[1],
                "title": row[2],
                "detail": row[3],
                "source": row[4],
                "status": row[5],
            })
        conn.close()
        return {"tasks": rows}
    except Exception as e:
        return {"error": str(e)}


def handle_tasks_update(task_id, status):
    ensure_schema()
    if status not in ("open", "done"):
        return {"error": "status must be open or done"}
    try:
        task_id = int(task_id)
    except (TypeError, ValueError):
        return {"error": "task_id must be an integer"}
    conn = sqlite3.connect(DB_PATH)
    try:
        cursor = conn.cursor()
        cursor.execute("UPDATE tasks SET status = ? WHERE id = ?", (status, task_id))
        conn.commit()
        return {"status": "ok", "updated": cursor.rowcount}
    except Exception as e:
        return {"error": str(e)}
    finally:
        conn.close()


DOC_TAGS = {
    "python": "python~3.13",
    "javascript": "javascript",
    "typescript": "typescript",
    "rust": "rust",
    "go": "go",
    "sqlite": "sqlite",
    "html": "html",
    "css": "css",
    "react": "react",
    "node": "node",
}


def handle_projects_list():
    ensure_schema()
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT id, timestamp, name, tags, slugs FROM projects ORDER BY id DESC")
        rows = []
        for row in cursor.fetchall():
            rows.append({
                "id": row[0],
                "timestamp": row[1],
                "name": row[2],
                "tags": json.loads(row[3]) if row[3] else [],
                "slugs": json.loads(row[4]) if row[4] else [],
                "folder": project_folder_name(row[2]).replace("\\", "/"),
            })
        conn.close()
        return {"projects": rows}
    except Exception as e:
        return {"error": str(e)}


def project_folder_name(name):
    safe = re.sub(r"[^A-Za-z0-9._-]+", "-", str(name).strip()).strip("-") or "project"
    return os.path.join("projects", safe)


def handle_git_status(folder):
    folder = "" if folder is None else str(folder)
    root = os.path.abspath(os.path.join(BASE_DIR, folder))
    base = os.path.abspath(BASE_DIR)
    if root != base and not root.startswith(base + os.sep):
        return {"error": "That folder is outside the workspace"}
    if not os.path.isdir(root):
        return {"error": "Project folder is not on disk"}
    try:
        proc = subprocess.run(
            ["git", "status", "--short", "--branch"],
            cwd=root,
            capture_output=True,
            text=True,
            timeout=8,
        )
        text = (proc.stdout or proc.stderr or "").strip()
        return {"status": "ok", "folder": folder, "text": text or "Clean"}
    except Exception as e:
        return {"error": str(e)}


def handle_projects_add(name, tags):
    ensure_schema()
    if not name or not str(name).strip():
        return {"error": "Name the project"}
    if isinstance(tags, str):
        tag_list = [part.strip().lower() for part in tags.split(",") if part.strip()]
    elif isinstance(tags, list):
        tag_list = [str(part).strip().lower() for part in tags if str(part).strip()]
    else:
        tag_list = []
    slugs = []
    for tag in tag_list:
        slug = DOC_TAGS.get(tag, tag)
        if slug not in slugs:
            slugs.append(slug)
    conn = sqlite3.connect(DB_PATH)
    try:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO projects (timestamp, name, tags, slugs) VALUES (?, ?, ?, ?)",
            (
                datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                str(name).strip(),
                json.dumps(tag_list),
                json.dumps(slugs),
            ),
        )
        conn.commit()
        folder = project_folder_name(name)
        full = os.path.join(BASE_DIR, folder)
        os.makedirs(full, exist_ok=True)
        readme = os.path.join(full, "README.md")
        if not os.path.exists(readme):
            with open(readme, "w", encoding="utf-8") as handle:
                handle.write("# " + str(name).strip() + "\n")
        if not os.path.isdir(os.path.join(full, ".git")):
            subprocess.run(["git", "init"], cwd=full, capture_output=True, text=True, timeout=8)
        return {
            "status": "ok",
            "id": cursor.lastrowid,
            "name": str(name).strip(),
            "tags": tag_list,
            "slugs": slugs,
            "folder": folder.replace("\\", "/"),
        }
    except Exception as e:
        return {"error": str(e)}
    finally:
        conn.close()


def handle_rule_status():
    ensure_schema()
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM ai_logs")
        ai_count = cursor.fetchone()[0]
        cursor.execute("SELECT COALESCE(SUM(duration_seconds), 0) FROM coding_sessions")
        coding_seconds = cursor.fetchone()[0]
        cursor.execute("SELECT COALESCE(SUM(key_count), 0) FROM typing_events")
        keystroke_count = cursor.fetchone()[0]
        conn.close()
        judged = _call_your_logic(
            logic.rule_of_thumb_decision, ai_count, coding_seconds, keystroke_count
        )
        return {
            "ai_count": ai_count,
            "coding_seconds": coding_seconds,
            "keystroke_count": keystroke_count,
            "decision": judged,
        }
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
        return handle_docs_search(payload.get("slug"), payload.get("query"), payload.get("type_name") or payload.get("type") or "")
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
    elif cmd == "session_record":
        return handle_session_record(
            payload.get("duration_seconds"),
            payload.get("project_name","Project 1")
        )
    elif cmd == "sessions_list":
        return handle_sessions_list()
    elif cmd == "telemetry_record":
        return handle_telemetry_record(payload.get("key_count"), payload.get("source"))
    elif cmd == "telemetry_stats":
        return handle_telemetry_stats()
    elif cmd == "errors_analyze":
        return handle_errors_analyze(payload.get("error_text"))
    elif cmd == "errors_list":
        return handle_errors_list()
    elif cmd == "tasks_add":
        return handle_tasks_add(
            payload.get("title"),
            payload.get("detail"),
            payload.get("source"),
        )
    elif cmd == "tasks_list":
        return handle_tasks_list()
    elif cmd == "tasks_update":
        return handle_tasks_update(payload.get("task_id"), payload.get("status"))
    elif cmd == "rule_status":
        return handle_rule_status()
    elif cmd == "projects_list":
        return handle_projects_list()
    elif cmd == "projects_add":
        return handle_projects_add(payload.get("name"), payload.get("tags"))
    elif cmd == "git_status":
        return handle_git_status(payload.get("folder") or "")
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
                elif cmd == "session_record" and len(sys.argv) >= 3:
                    payload = {
                        "duration_seconds": sys.argv[2],
                        "project_name": sys.argv[3] if len(sys.argv) >= 4 else "The Rule of Thumb"
                    }
                elif cmd == "errors_analyze" and len(sys.argv) >= 3:
                    payload = {"error_text": sys.argv[2]}
                elif cmd == "telemetry_record" and len(sys.argv) >= 3:
                    payload = {"key_count": sys.argv[2], "source": sys.argv[3] if len(sys.argv) >= 4 else "typing"}
                elif cmd == "tasks_add" and len(sys.argv) >= 3:
                    payload = {"title": sys.argv[2], "detail": sys.argv[3] if len(sys.argv) >= 4 else "", "source": sys.argv[4] if len(sys.argv) >= 5 else "you"}
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

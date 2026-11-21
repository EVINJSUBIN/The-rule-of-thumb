# The Rule of Thumb — Feature Plan & Specification

> **Hack Club Phantom Grant:** ~18.5 hours logged / 40 hours total (~46.2% completed)  
> **Architecture Spec & Wiki:** [`docs/wiki/Home.md`](wiki/Home.md)  
> **AI Usage Declaration:** [`docs/AI_DECLARATION.md`](AI_DECLARATION.md)

---

## Features Overview & Status

| # | Feature | Status | Priority | Implementation Details |
|---|---------|--------|----------|------------------------|
| **F1** | **Backend Engine (Sidecar RPC)** | ✅ **Completed** | P0 — Foundation | Pure Python JSON-RPC engine (`backend/sidecar.py`). Zero open ports. File read/write/list with path safety. |
| **F2** | **Offline Documentation Engine** | ✅ **Completed** | P0 — Core | DevDocs CDN sync (`index.json` + `db.json`). Category filtering, offline keyword search, and HTML viewer. |
| **F3** | **Sarcastic AI Mentor** | ✅ **Completed** | P1 — Core | Interactive guidance interface that strictly refuses to generate code. Files tasks for the user to hand-code. |
| **F4** | **AI Reliance Audit & Monitor** | ✅ **Completed** | P1 — Core | SQLite persistence (`ai_logs`). Audits tool calls, actions, and notes to enforce the one-third human rule. |
| **F5** | **Offline Code Time Tracker** | ✅ **Completed** | P1 — Critical | Precision stopwatch timer logging to `coding_sessions` + live keystroke telemetry in `typing_events`. |
| **F6** | **Traceback & Error Analyzer** | ✅ **Completed** | P2 — Enhancement | Parses stack traces and runtime exceptions, regex-matches tokens, and points to local DevDocs articles. |
| **F7** | **Developer Console & IDE UI** | ✅ **Completed** | P2 — Enhancement | Dark minimalist React 18 + Vite + TypeScript dashboard with integrated Monaco code editor and v0 AI chat. |

---

## Detailed Specifications

### F1: Backend Engine & File System Bridge
- **Engine:** Python sidecar invoked over stdin/CLI arguments via Rust `std::process::Command`.
- **Capabilities:**
  - `read(filename)`: Reads workspace files with UTF-8 decoding.
  - `write(file_path, content)`: Writes content to disk with automated parent directory creation.
  - `list(subpath)`: Traverses workspace hierarchy, excluding VCS, binary, and cache artifacts (`.git`, `node_modules`, `target`, `__pycache__`).
  - `projects_add(name, tags)` / `projects_list()`: Scaffolds and tracks sub-projects with automatic git repository initialization.

### F2: Offline Documentation Engine
- **Source:** DevDocs CDN (`https://devdocs.io/docs.json`).
- **Storage:** Local cached packages under `data/docs/<slug>/` (`index.json` + `db.json`).
- **Search:**
  - Tokenized keyword matching across API symbol names and document paths.
  - Fast category and type filtering for massive API docsets (Python, Rust, SQLite, CSS, JavaScript).
  - High-performance offline HTML rendering with embedded code block highlighting.

### F3: Sarcastic AI Mentor
- **Core Principle:** **0% Code Generation**.
- **Behavior:**
  - When asked for implementation code, the mentor refuses, provides architectural logic, breaks the problem down into sequential steps, and files an actionable task.
  - Keeps transcription context active across view navigations.
  - Encourages hands-on keyboard typing and official documentation reading.

### F4: AI Usage Monitor (One-Third Rule)
- **Database:** SQLite (`data/ruleofthumb.db` -> `ai_logs` table).
- **Schema:** `id`, `timestamp`, `tool_name`, `action`, `notes`.
- **Policy Engine:** Evaluates ratio of AI interactions against active human coding seconds and keystrokes via `rule_of_thumb_decision` in `backend/logic.py`.

### F5: Offline Coding Time Tracker
- **Database:** `coding_sessions` table (`start_time`, `end_time`, `duration_seconds`, `project_name`).
- **Telemetry:** `typing_events` table recording batches of active keystrokes.
- **UI:** Precision stopwatch with start, pause, and stop & log actions. Live telemetry meter displaying active typing versus idle time.

### F6: Error Analyzer & Heuristic Matcher
- **Database:** `error_reports` table (`raw_text`, `match_json`).
- **Pattern Matcher:** Regular expression extractor scanning for exception types (`NameError`, `TypeError`, `OperationalError`), compiler codes (`E0255`), SQL keywords, and function invocations.
- **Heuristic Ranking:** Scores candidates against installed docsets and deep-links directly to the relevant documentation section.

### F7: Developer Console Dashboard
- **Frontend Stack:** React 18, TypeScript, Tailwind CSS, Vite.
- **Code Editor:** `@monaco-editor/react` embedded for editing workspace files.
- **Aesthetic:** v0 and shadcn-inspired minimalist dark theme (`#09090b` zinc-950 base, `#171717` cards, `#262626` borders).

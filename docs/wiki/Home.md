# The Rule of Thumb

Offline desktop app. You code. Assistants are audited. Help stays at one third.

## Pages

- [Screens](Screens.md) — what each part of the UI is for
- [Backend tasks](Backend-tasks.md) — the logic you still write

## Rule

The chat, Cursor, Grok, and any other tool show up as rows in `ai_logs`. Coding time is `coding_sessions`. Keystrokes are `typing_events`. `rule_of_thumb_decision` in `backend/logic.py` is the function that says whether that mix is still inside one third.

The app does not write your source. A question becomes a task. You type the change.

## Commands the UI calls

| Command | What it stores or reads |
| --- | --- |
| `session_record` | One stopwatch session |
| `sessions_list` | Saved sessions, newest first |
| `telemetry_record` | A batch of keystrokes |
| `telemetry_stats` | Key total, then your seconds function |
| `audit_log` / `audit_stats` | Assistant actions |
| `rule_status` | Counts, then your one-third function |
| `errors_analyze` / `errors_list` | Pasted errors, then your doc match |
| `tasks_add` / `tasks_list` / `tasks_update` | Work the chat assigned to you |
| `docs_*` | Offline DevDocs packages |
| `read` / `write` / `list` | Workspace files |

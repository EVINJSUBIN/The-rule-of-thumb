# Screens

The UI is the Vite app in `frontend/src/App.tsx`. The same chat component stays mounted when you change tabs, so the transcript does not reset.

## Dashboard

Shows three different clocks side by side:

- Backend time: sum of `duration_seconds` from `coding_sessions`
- Typing: keystrokes stored in `typing_events`, plus keys from this visit
- One third: AI log count, and the decision from your function when it exists

## Time tracker

Start, pause, and Stop & log. Stop & log calls `session_record`. Under the clock, the table is `sessions_list`, so the seconds on screen are the seconds in SQLite. Keystrokes update while you type in a field.

## AI audit

The open chat files a task and an `ai_logs` row. It answers with a reminder to type the code yourself. The task list under it is how you mark the work done. The table under that is the latest audit rows. Other tools (Cursor, Grok, a skill) belong in this same table as `tool_name` values.

The Ask button on other screens opens that same chat without clearing it.

## Docs

Installed DevDocs sets, search, and the article, all from `data/docs`. Ask the chat about a page. The chat should point you back at the page, not replace it.

## Workspace

Read and write project files through the sidecar.

## Errors

Paste a traceback. It is stored in `error_reports`. The doc slug and path come from `match_error_to_docs` once you write it. Until then the row says the match is pending.

## Security and tests

There is no agent that rewrites the repo on a timer. Put a security check or a test run on the task list, run it yourself, and mark the task when the code is yours.

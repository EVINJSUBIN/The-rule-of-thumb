# The Rule of Thumb

> Hack Club Phantom · a desktop app for coding by hand  
> *Coding is being replaced by AI, but we will still code manually to prove our passions.*

An offline AI-audit desk. It tracks the time you actually sit and type, watches what assistants do, and keeps the help at one third of the work. The chat can file a task. It does not write the function. You type it.

The product wiki is in [`docs/wiki/Home.md`](docs/wiki/Home.md). The declaration is in [`docs/AI_DECLARATION.md`](docs/AI_DECLARATION.md).

## What you can do in the app

- Read the stopwatch time that SQLite already stored, next to live keystroke counts.
- Leave the audit chat open while you move between docs, files, and the tracker. Messages stay in that chat.
- Paste an error and keep it locally. Matching that error to a doc page is logic you still write.
- Turn a question into a task, then mark it when you have typed the code.
- Read DevDocs packages from disk, with no network after they are downloaded.

## Stack

- Desktop shell: Tauri 2 and Rust (`src-tauri`)
- UI: Vite, React 18, TypeScript, Tailwind (`frontend`)
- Engine: Python sidecar over stdin, no HTTP server (`backend/sidecar.py`)
- Storage: SQLite at `data/ruleofthumb.db`

## Run it

```bash
# desktop shell
cd src-tauri
cargo tauri dev

# UI only, sidecar included by the Vite dev server
cd frontend
npm install
npm run dev
```

Check one command by hand:

```bash
python backend/sidecar.py sessions_list
python backend/sidecar.py rule_status
```

## Who writes what

Storage, screens, and the command wire are in the repo. The decisions live in [`backend/logic.py`](backend/logic.py). Those three functions are yours:

- `typing_seconds_from_keystrokes`
- `match_error_to_docs`
- `rule_of_thumb_decision`

Until you fill them in, the screens show the raw counts and say the logic is pending. Details are in [`docs/wiki/Backend-tasks.md`](docs/wiki/Backend-tasks.md).

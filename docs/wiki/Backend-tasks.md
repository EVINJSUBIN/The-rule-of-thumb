# Backend tasks

These are the pieces left for you. The tables, the Tauri commands, and the screens already call them.

File: `backend/logic.py`

## 1. Typing time

`typing_seconds_from_keystrokes(keystroke_count)`

The sidecar already sums `typing_events.key_count`. You decide how many seconds of real coding that number is. Return an `int`. Idle bursts, repeats, and backspace can discount the total. The tracker screen will show your number when this function stops raising `NotImplementedError`.

## 2. Error codes to docs

`match_error_to_docs(error_text, installed_slugs)`

`error_text` is the paste. `installed_slugs` is the list of folders in `data/docs`. Return:

```python
{"slug": "python", "doc_path": "library/exceptions.html", "reason": "NameError"}
```

Read the local `index.json` for that slug. Do not call a network API from this function. The Errors screen prints `result` when you return the dict.

## 3. One third

`rule_of_thumb_decision(ai_count, coding_seconds, keystroke_count)`

Return:

```python
{"ai_share": 0.2, "limit": 0.333, "allowed": True, "note": "still your session"}
```

`allowed` should become false when assistant events are more than one third of the work. The dashboard reads `decision.result`. The chat should keep filing tasks either way. It still must not write code.

## Already done, so you can skip it

- Creating `typing_events`, `error_reports`, and `tasks`
- Inserting and listing those rows
- Wiring `src-tauri/src/lib.rs` to the sidecar
- Showing the rows in the React screens

Try a function from the shell after you write it:

```bash
python backend/sidecar.py rule_status
python backend/sidecar.py errors_analyze "{\"error_text\":\"NameError: name 'x' is not defined\"}"
```

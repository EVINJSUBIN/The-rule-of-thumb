# The Rule of Thumb — Feature Plan

> Hack Club Phantom · 6 hours logged / 40 hours total · 34 hours remaining

---

## Features Overview

| # | Feature | Status | Priority |
|---|---------|--------|----------|
| F1 | Backend API (File Service) | 🟡 In Progress | P0 — Foundation |
| F2 | Offline Docs (DevDocs Integration) | ⬜ Not Started | P0 — Core |
| F3 | Sarcastic AI Mentor (No Coding, Only Guidance) | ⬜ Not Started | P1 — Core |
| F4 | AI Usage Monitor (MCP/Skill for LLMs) | ⬜ Not Started | P1 — Core |
| F5 | Code Time Tracker (VS Code Extension) | ⬜ Not Started | P1 — Critical |
| F6 | Error Analyzer | ⬜ Not Started | P2 — Enhancement |
| F7 | Dashboard UI | ⬜ Not Started | P2 — Enhancement |

---

## F1: Backend API (File Service)

**What:** Flask backend with proper routes for reading/writing project files, serving as the API layer for all other features.

**Current state:** `main.py` has `/Analyze/<file_name>` (working) and `/Write/<file_path>` (incomplete, no POST body handling).

**Plan:**
- [ ] Reorganize into Flask blueprints (`app.py` + `routes/`)
- [ ] Move hardcoded path to config
- [ ] Fix `/Write` route — accept POST with file content
- [ ] Add directory listing endpoint
- [ ] Add SQLite database setup
- [ ] Add error handling middleware

**Hours estimate:** ~4h remaining (of 10h phase)

---

## F2: Offline Docs (DevDocs Integration)

**What:** Use freeCodeCamp's DevDocs as our documentation engine. It already works offline, has 400+ doc sets, and runs on port 9292. We just integrate it.

**Plan:**
- [ ] Set up DevDocs via Docker (`docker-compose.yml`)
- [ ] Download doc sets for key languages (Python, JavaScript, HTML, CSS, etc.)
- [ ] Create Flask proxy/deep-link route (`/api/docs/search?q=...`)
- [ ] Embed DevDocs in our frontend dashboard
- [ ] Build a "suggest docs" endpoint that maps topics/errors to DevDocs URLs

**Hours estimate:** ~3h

---

## F3: Sarcastic AI Mentor

**What:** An AI that integrates into LLMs as a skill. It DOES NOT code for the user. It forces them to study architectures, principles, and logic. Then code themselves. It's sarcastic about it.

**Plan:**
- [ ] Design the mentor personality/prompt (sarcastic, refuses to write code)
- [ ] Build mentor Flask endpoint (`/api/mentor/ask`)
- [ ] Connect mentor to DevDocs — when user asks, mentor says "go read this page"
- [ ] Track mentor interactions in SQLite (what was asked, what was suggested)
- [ ] Add difficulty scaling — more sarcastic if user keeps asking for code

**Hours estimate:** ~5h

---

## F4: AI Usage Monitor (MCP/Skill)

**What:** An MCP server that integrates into ALL LLMs. It monitors how much AI the user is using on their project, caps it, warns them, and logs everything. This skill is always active on the project.

**Plan:**
- [ ] Build MCP server skeleton (`mcp/server.py`)
- [ ] Implement usage tracking — count requests, tokens, timestamps
- [ ] Add configurable caps (max requests/hour, max tokens/day)
- [ ] Warning system — alert user when approaching cap
- [ ] Hard cap enforcement — block requests when over limit
- [ ] Log all AI interactions to SQLite with project ID
- [ ] Build audit query endpoints (`/api/audit/usage`, `/api/audit/project/<id>`)
- [ ] Generate usage reports per project

**Hours estimate:** ~7h

---

## F5: Code Time Tracker (VS Code Extension)

**What:** A reliable offline code time tracker that works across multiple projects. Like Hacktime but actually works offline in real time without glitches. Tracks every keystroke, file save, active window change.

**Plan:**
- [ ] Scaffold VS Code extension (`yo code`)
- [ ] File watcher — detect file changes and saves
- [ ] Keystroke listener — detect active coding vs idle
- [ ] Project detection — which workspace/folder is active
- [ ] SQLite offline storage — log sessions locally, no network needed
- [ ] Multi-project support — separate time logs per project
- [ ] Heartbeat system — ping every 2 minutes to track continuous coding
- [ ] Flask sync endpoint (`/api/tracker/push`) — push sessions from extension
- [ ] Dashboard query endpoint (`/api/tracker/hours?project=X&range=week`)
- [ ] Daily/weekly summary calculations

**Hours estimate:** ~10h

---

## F6: Error Analyzer

**What:** Catches errors from terminal/logs, categorizes them, and links to relevant DevDocs pages so user can learn to fix them.

**Plan:**
- [ ] Error input endpoint (`/api/errors/analyze`)
- [ ] Error parser — extract error type, message, stack trace
- [ ] Error categorization — syntax, runtime, import, type errors
- [ ] DevDocs linker — match error type to relevant doc page
- [ ] Error history — log analyzed errors in SQLite
- [ ] Pattern detection — show user their most common mistakes

**Hours estimate:** ~3h

---

## F7: Dashboard UI

**What:** A web frontend that wraps DevDocs + tracker + audit + mentor into one unified view.

**Plan:**
- [ ] HTML/CSS/JS dashboard layout
- [ ] DevDocs panel (embedded)
- [ ] Coding time display (daily/weekly/total hours)
- [ ] AI usage audit panel (how much AI used per project)
- [ ] Mentor chat interface
- [ ] Error history panel

**Hours estimate:** ~2h

---

## Hour Budget (Updated)

| Phase | Features | Hours | Running Total |
|-------|----------|-------|---------------|
| Already logged | Setup, ideation, initial `main.py` | 6h | 6h |
| Phase 1: Foundation | F1 (Backend API) | 4h | 10h |
| Phase 2: DevDocs | F2 (Offline Docs) | 3h | 13h |
| Phase 3: AI Core | F3 (Mentor) + F4 (Monitor) | 12h | 25h |
| Phase 4: Tracker | F5 (Code Time Tracker) | 10h | 35h |
| Phase 5: Polish | F6 (Error Analyzer) + F7 (UI) | 5h | 40h |
| **Total** | | **40h** | |

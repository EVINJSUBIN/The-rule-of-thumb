# AI Declaration & Disclosure

> **Project:** The Rule of Thumb (Hack Club Phantom)  
> **Author:** youri  
> **Philosophy:** *"Coding is being replaced by AI, but we will still code manually to prove our passions."*

---

## 1. Core Statement & Philosophy

In an era where coding is increasingly automated and flooded with AI-generated code ("AI slop"), **The Rule of Thumb** was born out of a personal challenge: to step away from mindless generation, regain hands-on coding confidence, and learn to build from scratch.

This project is built around the philosophy that **AI should plan and guide, but not code for you.**

---

## 2. Role of AI vs. Human Effort

| Area | Handled By | Details |
|------|------------|---------|
| **Source Code & Implementation** | **100% Human** | Every line of application code, route logic, and script is typed manually by hand. |
| **Typing & Muscle Memory** | **Human Challenge** | Coded directly without autocomplete crutches or blind pasting, building back raw coding skills. |
| **System Architecture & Planning** | **Human + AI (Collaborative)** | Brainstorming architecture, structuring roadmap phases, and formatting documentation. |
| **Review & Debug Guidance** | **AI Assistant** | AI reviews written code, explains errors, points to documentation, and suggests structural patterns without writing the solution. |

---

## 3. How AI Was Used on This Project

Following the strict **Rule of Thumb Rules of Engagement**:
1. **No Direct Code Generation for Business Logic:** The developer types the domain logic (file reading, directory creation writing, file listing).
2. **Architecture Migration & Boilerplates:** When pivoting the prototype from a standalone Flask HTTP server to a lightweight Tauri Python Sidecar architecture, the boilerplate bridge (`src-tauri/src/lib.rs` and the sidecar dispatcher in `backend/sidecar.py`) was assisted by AI at the developer's explicit direction, preserving the developer's hand-written domain logic.
3. **Concept Explanations:** Explaining Tauri IPC, Rust function signatures, and SQLite schema design.
4. **Architecture Sounding Board:** Organizing the user's raw thoughts and feature lists into modular milestones.
5. **Error Analysis:** Guiding the developer to understand runtime errors and learn the underlying fix.

---

## 4. Built-in Anti-AI Philosophy (The Product Itself)

Ironically and intentionally, the product being built enforces this exact declaration for other developers:
- **Offline-First Documentation:** Integrated local documentation (DevDocs) so developers can look up syntax and APIs without needing an LLM.
- **AI Usage Monitor & Hard Caps:** An MCP server that tracks LLM usage, warns the user when they over-rely on AI, and caps requests.
- **Sarcastic AI Mentor:** An AI guide designed to refuse writing code, instead forcing the programmer to inspect documentation and understand the logic.
- **Reliable Offline Time Tracking:** An offline tracker recording real, active keystrokes and manual coding time.

---

## 5. Creator's Pledge (In My Own Words)

> *"In this project I will try my max to code by hand because it's a challenge by me. I am seriously low on aura about coding, I need to learn how to code from scratch again, how to type without looking into the keyboard. Coding is being replaced by AI, but we will still code manually to prove our passions."*

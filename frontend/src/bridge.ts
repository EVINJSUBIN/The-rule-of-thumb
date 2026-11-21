// Tauri IPC Bridge for React components

declare global {
  interface Window {
    __TAURI__?: {
      core: {
        invoke: (cmd: string, args?: Record<string, any>) => Promise<any>
      }
    }
  }
}

export const hasTauri = typeof window !== 'undefined' && !!window.__TAURI__?.core

const SIDECAR_COMMANDS: Record<string, string> = {
  list_files: "list",
  read_file: "read",
  write_file: "write",
}

function sidecarPayload(args: Record<string, any>) {
  const payload: Record<string, any> = {}
  for (const [key, value] of Object.entries(args)) {
    const snake = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
    payload[snake] = value
  }
  return payload
}

export async function callBackend<T = any>(cmd: string, args: Record<string, any> = {}): Promise<T> {
  if (hasTauri && window.__TAURI__?.core) {
    try {
      const res = await window.__TAURI__.core.invoke(cmd, args)
      return typeof res === 'string' ? JSON.parse(res) : res
    } catch (err) {
      console.error(`Tauri invoke [${cmd}] error:`, err)
      return { error: String(err) } as T
    }
  }

  try {
    const res = await fetch("/__sidecar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cmd: SIDECAR_COMMANDS[cmd] ?? cmd, payload: sidecarPayload(args) }),
    })
    if (res.ok) {
      return await res.json()
    }
  } catch {
    // Dev server sidecar is unavailable; fall through to the demo mocks.
  }

  {
    if (cmd === 'audit_stats') {
      return {
        total_ai_requests: 1,
        total_coding_seconds: 46800,
        total_coding_hours: 13.0,
        recent_logs: [
          { id: 1, timestamp: "2026-11-20 19:15:00", tool_name: "sarcastic_mentor", action: "architecture_review", notes: "v0 chat integration test" }
        ]
      } as T
    }
    if (cmd === 'docs_installed') {
      return { installed: ["sqlite"] } as T
    }
    if (cmd === 'session_record') {
      const seconds = Number(args.durationSeconds ?? args.duration_seconds ?? 0)
      return {
        status: "ok",
        duration_seconds: seconds,
        project_name: args.projectName ?? args.project_name ?? "The Rule of Thumb",
        message: "Coding session logged successfully"
      } as T
    }
    if (cmd === 'list_files') {
      return {
        filepaths: [
          "backend/sidecar.py",
          "src-tauri/src/lib.rs",
          "frontend/src/App.tsx",
          "frontend/components/ui/v0-ai-chat.tsx",
          "README.md",
          "docs/AI_DECLARATION.md"
        ]
      } as T
    }
    return { status: "ok" } as T
  }
}

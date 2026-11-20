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

export async function callBackend<T = any>(cmd: string, args: Record<string, any> = {}): Promise<T> {
  if (hasTauri && window.__TAURI__?.core) {
    try {
      const res = await window.__TAURI__.core.invoke(cmd, args)
      return typeof res === 'string' ? JSON.parse(res) : res
    } catch (err) {
      console.error(`Tauri invoke [${cmd}] error:`, err)
      return { error: String(err) } as T
    }
  } else {
    // Web demo mocks
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

import { useEffect, useRef, useState } from "react"
import Editor from "@monaco-editor/react"
import { VercelV0Chat } from "@/components/ui/v0-ai-chat"
import { callBackend, hasTauri } from "@/src/bridge"
import {
  LayoutDashboard,
  BookOpen,
  FolderTree,
  Sparkles,
  Timer,
  Save,
  RefreshCw,
  Download,
  Search,
  FileCode,
  Bug,
  MessageSquare,
} from "lucide-react"

export type PageId = "dashboard" | "docs" | "files" | "ai" | "tracker" | "errors"

const NAV: { group: string; items: { id: PageId; label: string; icon: typeof Timer }[] }[] = [
  {
    group: "App",
    items: [
      { id: "dashboard", label: "Overview", icon: LayoutDashboard },
      { id: "docs", label: "Docs", icon: BookOpen },
      { id: "ai", label: "Mentor", icon: Sparkles },
      { id: "files", label: "Workspace", icon: FolderTree },
      { id: "tracker", label: "Time", icon: Timer },
      { id: "errors", label: "Errors", icon: Bug },
    ],
  },
]

const COPY: Record<PageId, { title: string; detail: string }> = {
  dashboard: { title: "Overview", detail: "Numbers on this page come from the local sidecar." },
  tracker: { title: "Time", detail: "Stop & log writes a row. The table reads that table back." },
  files: { title: "Workspace", detail: "Files are read and saved on disk through the sidecar." },
  docs: { title: "Docs", detail: "Installed DevDocs packages. Search stays on this machine." },
  errors: { title: "Errors", detail: "A paste is stored immediately. The doc link waits on your matcher." },
  ai: { title: "Mentor", detail: "Questions become tasks. The reply never includes the code." },
}

type ConsoleProps = {
  page: PageId
  onPage: (id: PageId) => void
  chatOpen: boolean
  setChatOpen: (open: boolean) => void
  sidecarLive: boolean
  stats: { hours: number; aiCalls: number }
  installedDocs: string[]
  activeDocSlug: string
  setActiveDocSlug: (slug: string) => void
  docSearchResults: Array<{ name: string; path: string; type?: string }>
  docTypes: Array<{ name: string; count?: number; slug?: string }>
  activeDocType: string
  docQuery: string
  downloadSlug: string
  setDownloadSlug: (value: string) => void
  docHtml: string
  currentDocTitle: string
  fileList: string[]
  currentFile: string
  fileContent: string
  setFileContent: (value: string) => void
  fileNote: string
  timerRunning: boolean
  setTimerRunning: (value: boolean) => void
  timerSeconds: number
  sessionNote: string
  sessions: any[]
  storedKeys: number
  liveKeys: number
  typingLogic: any
  rule: any
  tasks: any[]
  errorText: string
  setErrorText: (value: string) => void
  errorNote: string
  errorHistory: any[]
  auditLogs: any[]
  formatTimer: (seconds: number) => string
  refreshDocs: () => void
  refreshFiles: () => void
  handleDownloadDoc: () => void
  handleSearchDocs: (query: string, typeName?: string, slug?: string) => void
  handleOpenDocArticle: (path: string) => void
  handleOpenFile: (filename: string) => void
  handleSaveFile: () => void
  stopAndRecord: () => void
  markTask: (id: number, status: "open" | "done") => void
  analyzeError: () => void
  projects: any[]
  project: any
  chooseProject: (project: any) => void
  createProject: (name: string, tags: string) => Promise<any>
}

function NavButton({
  active,
  label,
  icon: Icon,
  badge,
  onClick,
}: {
  active: boolean
  label: string
  icon: typeof Timer
  badge?: number
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-left ${
        active ? "bg-[#ec3750] text-white font-medium" : "text-[#a1a1aa] hover:bg-[#18181b] hover:text-white"
      }`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className="flex-1">{label}</span>
      {badge ? <span className="text-[11px] font-mono text-white/80">{badge}</span> : null}
    </button>
  )
}

export function Console(props: ConsoleProps) {
  const {
    page, onPage, chatOpen, setChatOpen, sidecarLive, stats, installedDocs,
  } = props
  const copy = COPY[page]
  const openTasks = props.tasks.filter((task) => task.status !== "done").length
  const [tasksOpen, setTasksOpen] = useState(false)
  const [locked, setLocked] = useState(false)
  const [fullScreen, setFullScreen] = useState(false)
  const focus = page === "docs" && locked
  const hint = props.currentDocTitle || props.activeDocSlug || "the page you have open"
  const chatClass = focus
    ? "relative flex h-full min-h-0 w-[min(420px,40vw)] shrink-0 flex-col border-l border-white/10 bg-[#07111f]"
    : page === "ai"
    ? "relative flex min-h-0 flex-1 flex-col"
    : chatOpen
      ? "fixed bottom-6 right-6 z-40 flex h-[min(640px,80vh)] w-[min(420px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[28px] border border-white/15 bg-[#252526]/85 shadow-2xl backdrop-blur-2xl"
      : "hidden"
  const ruleNote = !props.rule
    ? "Waiting for the sidecar."
    : props.rule.decision?.logic === "pending"
      ? "Cap decision is still your function."
      : props.rule.decision?.result?.allowed
        ? "Your logic says help is inside one third."
        : "Your logic says the cap is used up."

  const auto = useAutoCoding()
  const pages = NAV.flatMap((group) => group.items)
  const toggleFull = async () => {
    const next = !fullScreen
    setFullScreen(next)
    if (document.fullscreenElement && !next) await document.exitFullscreen()
    else if (next && !document.fullscreenElement) await document.documentElement.requestFullscreen().catch(() => {})
    if (hasTauri) {
      void window.__TAURI__?.core?.invoke("plugin:window|set_fullscreen", { fullscreen: next })
    }
  }

  return (
    <div className="relative h-screen overflow-hidden bg-[#05070d] text-[#d4d4d4] bg-[radial-gradient(circle_at_top,#16325c_0%,#05070d_46%)]">
      <div className="relative flex h-full flex-col">
        <div data-tauri-drag-region className="flex h-9 shrink-0 items-center justify-between px-3 text-[11px] text-white/50">
          <span data-tauri-drag-region>The Rule of Thumb · Hack Club</span>
          <span data-tauri-drag-region className="text-white/70">{props.project?.name || "No project"}</span>
          <div className={`flex gap-1 ${hasTauri ? "" : "invisible"}`}>
            <button className="rounded-full px-2 py-0.5 hover:bg-white/10" onClick={() => { void window.__TAURI__?.core?.invoke("plugin:window|minimize") }}>−</button>
            <button className="rounded-full px-2 py-0.5 hover:bg-white/10" onClick={() => { void window.__TAURI__?.core?.invoke("plugin:window|toggle_maximize") }}>□</button>
            <button className="rounded-full px-2 py-0.5 hover:bg-[#ec3750]" onClick={() => { void window.__TAURI__?.core?.invoke("plugin:window|close") }}>×</button>
          </div>
        </div>
        <header className={`z-30 flex justify-center px-3 ${focus ? "hidden" : ""}`}>
          <nav className="flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-white/15 bg-white/10 px-1.5 py-1.5 shadow-lg backdrop-blur-xl">
            {pages.map((item) => (
              <button
                key={item.id}
                onClick={() => onPage(item.id)}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs ${
                  page === item.id ? "bg-[#ec3750] text-white" : "text-white/75 hover:bg-white/10 hover:text-white"
                }`}
              >
                {item.label}{item.id === "ai" && openTasks ? ` ${openTasks}` : ""}
              </button>
            ))}
            <button
              onClick={() => setChatOpen(!chatOpen)}
              className="rounded-full bg-white/15 px-3 py-1.5 text-xs text-white backdrop-blur"
            >
              {chatOpen && page !== "ai" ? "Close" : "Ask"}
            </button>
          </nav>
        </header>

        {focus && (
          <div className="flex items-center gap-2 px-3 py-2">
            <button onClick={() => setLocked(false)} className="rounded-full bg-white/10 px-3 py-1 text-xs text-white">Exit lock</button>
            <button onClick={() => { void toggleFull() }} className="rounded-full bg-[#8eb7ff] px-3 py-1 text-xs text-black">{fullScreen ? "Window" : "Full screen"}</button>
            <span className="text-xs text-white/50">{props.project?.name || "No project"} · {props.activeDocSlug || "pick a language"}</span>
          </div>
        )}
        <div className={`flex min-h-0 flex-1 ${focus ? "flex-row" : "flex-col"} ${focus ? "" : page === "ai" ? "pt-1" : "px-3 pb-3 pt-3"}`}>
          {page !== "ai" && (
            <div className={`min-h-0 min-w-0 flex-1 ${page === "docs" || page === "files" ? "overflow-hidden" : "overflow-y-auto"}`}>
              {page === "docs" && <Docs {...props} locked={focus} onLock={() => setLocked(true)} onAsk={() => setChatOpen(true)} />}
              {page === "dashboard" && <Overview {...props} ruleNote={ruleNote} />}
              {page === "tracker" && <Tracker {...props} autoSeconds={auto.seconds} codingNow={auto.coding} />}
              {page === "files" && <Workspace {...props} />}
              {page === "errors" && <Errors {...props} onAsk={() => { setChatOpen(true); onPage("ai") }} />}
            </div>
          )}
          {page === "ai" && !props.project && (
            <ProjectGate projects={props.projects} onCreate={props.createProject} onOpen={(item) => { props.chooseProject(item); onPage("ai") }} />
          )}
          {page === "ai" && props.project && (
            <div className="flex justify-center pt-1">
              <button onClick={() => setTasksOpen((open) => !open)} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/70">
                {tasksOpen ? "Back to chat" : `Tasks ${openTasks}`}
              </button>
            </div>
          )}
          {page === "ai" && tasksOpen && (
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
              <div className="mx-auto max-w-3xl">
                <MentorDesk {...props} />
              </div>
            </div>
          )}
          {!focus && (page === "docs" || page === "errors") && <ErrorDock {...props} />}
          <div className={page === "ai" && (tasksOpen || !props.project) ? "hidden" : chatClass}>
            <VercelV0Chat
              hint={focus ? `${props.activeDocSlug || "docs"} in ${props.project?.name || "this project"}` : props.project?.name || hint}
              projectName={props.project?.name || ""}
              onNavigate={page === "ai" ? onPage : undefined}
              variant={page === "ai" || focus ? "screen" : "ask"}
              onClose={() => setChatOpen(false)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function Card({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <div className="rounded-lg border border-[#262626] bg-[#121214] p-4">
      <div className="text-xs text-[#71717a]">{title}</div>
      <div className="mt-2 text-2xl font-mono text-white">{value}</div>
      <p className="mt-2 text-xs leading-relaxed text-[#a1a1aa]">{detail}</p>
    </div>
  )
}

type HackSlice = { name?: string; total_seconds?: number; percent?: number; text?: string }

function ProjectGate({ projects, onCreate, onOpen }: { projects: any[]; onCreate: (name: string, tags: string) => Promise<any>; onOpen: (project: any) => void }) {
  const [name, setName] = useState("")
  const [tags, setTags] = useState("python")
  const [note, setNote] = useState("")
  return (
    <div className="mx-auto flex min-h-0 w-full max-w-xl flex-1 flex-col justify-center px-6">
      <p className="text-sm text-[#8eb7ff]">Hack Club</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">Start a project</h1>
      <p className="mt-3 text-sm leading-6 text-white/60">The mentor opens after a project exists. The workspace and its git status follow that folder.</p>
      <form className="mt-6 space-y-3" onSubmit={(event) => {
        event.preventDefault()
        if (!name.trim()) return
        void onCreate(name.trim(), tags).then((res) => setNote(res?.error ? String(res.error) : ""))
      }}>
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Project name" className="w-full rounded-full border border-white/15 bg-white/10 px-4 py-3 text-sm text-white outline-none" />
        <input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="Languages, comma separated" className="w-full rounded-full border border-white/15 bg-white/10 px-4 py-3 text-sm text-white outline-none" />
        <button className="rounded-full bg-[#ec3750] px-5 py-2.5 text-sm text-white">Create project</button>
      </form>
      {note && <p className="mt-3 text-xs text-[#ec3750]">{note}</p>}
      <div className="mt-8 space-y-2">
        {projects.map((item) => (
          <button key={item.id} onClick={() => onOpen(item)} className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-white">
            <span>{item.name}</span>
            <span className="text-xs text-white/40">{item.folder}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function Overview(props: ConsoleProps & { ruleNote: string }) {
  const pct = Math.min(100, (props.stats.hours / 40) * 100)
  const [username, setUsername] = useState(() => localStorage.getItem("hackatime_user") || "")
  const [hack, setHack] = useState<any>(null)
  const [hackNote, setHackNote] = useState("Load a Hackatime username to fill these widgets.")

  const loadHackatime = async (name: string) => {
    const user = name.trim()
    if (!user) return
    localStorage.setItem("hackatime_user", user)
    setHackNote("Reading Hackatime…")
    try {
      const response = await fetch(
        `https://hackatime.hackclub.com/api/v1/users/${encodeURIComponent(user)}/stats?features=languages,projects`
      )
      if (!response.ok) {
        setHack(null)
        setHackNote(response.status === 403 ? "That user has not turned on public stats." : `Hackatime returned ${response.status}.`)
        return
      }
      const payload = await response.json()
      setHack(payload?.data ?? payload)
      setHackNote("")
    } catch {
      setHackNote("Could not reach Hackatime.")
    }
  }

  useEffect(() => {
    if (username) void loadHackatime(username)
  }, [])

  const seconds = typeof hack?.total_seconds === "number" ? hack.total_seconds : null
  const languages: HackSlice[] = Array.isArray(hack?.languages) ? hack.languages : []
  const projects: HackSlice[] = Array.isArray(hack?.projects) ? hack.projects : []

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); void loadHackatime(username) }}>
        <input
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="Hackatime username"
          className="w-64 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white outline-none"
        />
        <button className="rounded-full bg-[#ec3750] px-4 py-2 text-sm text-white">Load Hackatime</button>
      </form>
      {hackNote && <p className="text-xs text-white/50">{hackNote}</p>}
      <div className="grid gap-3 md:grid-cols-4">
        <StatWidget label="Hackatime" value={seconds == null ? "—" : `${(seconds / 3600).toFixed(1)}h`} detail={hack?.human_readable_total || "Public total"} />
        <StatWidget label="Daily average" value={hack?.human_readable_daily_average || (hack?.daily_average ? `${Math.round(hack.daily_average / 60)}m` : "—")} detail="From the stats API" />
        <StatWidget label="Streak" value={hack?.streak != null ? String(hack.streak) : "—"} detail="Days, when Hackatime sends it" />
        <StatWidget label="This app" value={`${props.stats.hours.toFixed(2)}h`} detail={`${pct.toFixed(1)}% of 40h · ${props.storedKeys} keys`} />
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <BarWidget title="Languages" rows={languages} />
        <BarWidget title="Projects" rows={projects} />
      </div>
      <div className="overflow-hidden rounded-3xl border border-white/10">
        <div className="border-b border-white/10 px-4 py-3 text-sm text-white">Latest sessions</div>
        <SessionTable sessions={props.sessions} />
      </div>
    </div>
  )
}

function StatWidget({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <div className="text-xs text-white/45">{label}</div>
      <div className="mt-2 font-mono text-2xl text-white">{value}</div>
      <p className="mt-1 text-xs text-white/50">{detail}</p>
    </div>
  )
}

function BarWidget({ title, rows }: { title: string; rows: HackSlice[] }) {
  const top = rows.slice(0, 6)
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <div className="text-sm text-white">{title}</div>
      {top.length === 0 && <p className="mt-3 text-xs text-white/40">Nothing in this section yet.</p>}
      <div className="mt-3 space-y-2">
        {top.map((row) => (
          <div key={row.name}>
            <div className="flex justify-between text-xs text-white/70">
              <span>{row.name}</span>
              <span>{row.text || (row.total_seconds != null ? `${Math.round(row.total_seconds / 60)}m` : "")}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-[#ec3750]" style={{ width: `${Math.min(100, row.percent || 0)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function useAutoCoding() {
  const [seconds, setSeconds] = useState(0)
  const [coding, setCoding] = useState(false)
  useEffect(() => {
    let last = 0
    let bucket = 0
    const onKey = () => { last = Date.now() }
    window.addEventListener("keydown", onKey)
    const id = window.setInterval(() => {
      const active = document.visibilityState === "visible" && Date.now() - last < 20000 && last > 0
      setCoding(active)
      if (!active) return
      setSeconds((value) => value + 1)
      bucket += 1
      if (bucket >= 60) {
        bucket = 0
        void callBackend("session_record", { durationSeconds: 60, projectName: "The Rule of Thumb" })
      }
    }, 1000)
    return () => {
      window.removeEventListener("keydown", onKey)
      window.clearInterval(id)
    }
  }, [])
  return { seconds, coding }
}

function Tracker(props: ConsoleProps & { autoSeconds: number; codingNow: boolean }) {
  const [username, setUsername] = useState(() => localStorage.getItem("hackatime_user") || "")
  const [hackHours, setHackHours] = useState<string>("")
  const [hackNote, setHackNote] = useState("Add your Hackatime username to read the public stats API.")

  const loadHackatime = async (name: string) => {
    if (!name.trim()) return
    localStorage.setItem("hackatime_user", name.trim())
    setHackNote("Reading Hackatime…")
    try {
      const response = await fetch(`https://hackatime.hackclub.com/api/v1/users/${encodeURIComponent(name.trim())}/stats`)
      if (!response.ok) {
        setHackNote(response.status === 403 ? "That user has not turned on public stats." : `Hackatime returned ${response.status}.`)
        return
      }
      const data = await response.json()
      const seconds = data?.data?.total_seconds ?? data?.total_seconds
      if (typeof seconds === "number") {
        setHackHours((seconds / 3600).toFixed(2))
        setHackNote("Official Hackatime total.")
      } else {
        setHackNote("Hackatime replied, but the total was not in the payload.")
      }
    } catch {
      setHackNote("Could not reach Hackatime.")
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-white/15 bg-white/10 p-6 backdrop-blur-xl">
        <div className="text-xs text-white/60">Hack Club time</div>
        <div className="mt-2 font-mono text-5xl text-white">{props.formatTimer(props.autoSeconds)}</div>
        <p className="mt-2 text-sm text-white/70">
          {props.codingNow ? "Counting. You are typing." : "Waiting for typing. There is no start button."}
        </p>
        <p className="mt-1 text-xs text-white/50">A minute of typing is written to the local session log. Stored keys: {props.storedKeys}.</p>
        <form className="mt-4 flex gap-2" onSubmit={(event) => { event.preventDefault(); void loadHackatime(username) }}>
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Hackatime username"
            className="flex-1 rounded-full border border-white/15 bg-black/30 px-4 py-2 text-sm text-white outline-none"
          />
          <button className="rounded-full bg-[#ec3750] px-4 py-2 text-sm text-white">Load</button>
        </form>
        <p className="mt-2 text-xs text-white/70">{hackHours ? `${hackHours} h on Hackatime. ` : ""}{hackNote}</p>
      </div>
      <div className="rounded-lg border border-[#262626] overflow-hidden">
        <SessionTable sessions={props.sessions} />
      </div>
    </div>
  )
}

function SessionTable({ sessions }: { sessions: any[] }) {
  return (
    <table className="w-full text-left text-xs">
      <thead className="text-[#71717a] bg-[#101012]">
        <tr>
          <th className="px-3 py-2 font-medium">Start</th>
          <th className="px-3 py-2 font-medium">End</th>
          <th className="px-3 py-2 font-medium">Seconds</th>
          <th className="px-3 py-2 font-medium">Project</th>
        </tr>
      </thead>
      <tbody>
        {sessions.length === 0 && (
          <tr><td colSpan={4} className="px-3 py-6 text-[#71717a]">No sessions in SQLite yet. Stop and log writes the first one.</td></tr>
        )}
        {sessions.map((session) => (
          <tr key={session.id} className="border-t border-[#262626]">
            <td className="px-3 py-2 font-mono">{session.start_time}</td>
            <td className="px-3 py-2 font-mono">{session.end_time}</td>
            <td className="px-3 py-2 font-mono text-white">{session.duration_seconds}</td>
            <td className="px-3 py-2">{session.project_name}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function editorLanguage(path: string) {
  if (path.endsWith(".py")) return "python"
  if (path.endsWith(".rs")) return "rust"
  if (path.endsWith(".tsx") || path.endsWith(".ts")) return "typescript"
  if (path.endsWith(".jsx") || path.endsWith(".js")) return "javascript"
  if (path.endsWith(".css")) return "css"
  if (path.endsWith(".json")) return "json"
  if (path.endsWith(".md")) return "markdown"
  if (path.endsWith(".html")) return "html"
  return "plaintext"
}

function fileFolder(path: string) {
  const parts = path.split(/[/\\]/)
  return parts.length > 1 ? parts[0] : "root"
}

function Workspace(props: ConsoleProps) {
  const [gitText, setGitText] = useState("No project loaded.")
  const [draft, setDraft] = useState("")
  useEffect(() => {
    if (!props.project?.folder) {
      setGitText("Create a project to see version control.")
      return
    }
    void callBackend("git_status", { folder: props.project.folder }).then((res) => {
      setGitText(res?.text || res?.error || "No git output.")
    })
  }, [props.project?.folder])
  const folders = new Map<string, string[]>()
  for (const file of props.fileList) {
    const folder = fileFolder(file)
    folders.set(folder, [...(folders.get(folder) ?? []), file])
  }
  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-white/50">{props.project ? props.project.name : "No project"}</span>
      {props.projects.map((item) => (
        <button key={item.id} onClick={() => props.chooseProject(item)} className={`rounded-full px-3 py-1 text-xs ${props.project?.id === item.id ? "bg-[#8eb7ff] text-black" : "bg-white/10 text-white"}`}>
          {item.name}
        </button>
      ))}
      <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); if (draft.trim()) { void props.createProject(draft.trim(), ""); setDraft("") } }}>
        <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="New project" className="w-40 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-white outline-none" />
        <button className="rounded-full bg-[#ec3750] px-3 py-1 text-xs text-white">Create</button>
      </form>
    </div>
    <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[240px_1fr_220px]">
      <aside className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
          <span className="text-xs text-white/50">{props.fileList.length} files</span>
          <button onClick={props.refreshFiles} className="text-white/50 hover:text-white"><RefreshCw className="h-3.5 w-3.5" /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto py-1">
          {[...folders.entries()].map(([folder, files]) => (
            <div key={folder} className="mb-1">
              <div className="px-3 py-1 text-[10px] uppercase tracking-wide text-white/35">{folder}</div>
              {files.map((file) => (
                <button
                  key={file}
                  onClick={() => props.handleOpenFile(file)}
                  className={`flex w-full items-center gap-2 truncate px-3 py-1 text-left font-mono text-[11px] ${
                    props.currentFile === file ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <FileCode className="h-3 w-3 shrink-0" />
                  <span className="truncate">{file.split(/[/\\]/).slice(1).join("/") || file}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </aside>
      <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#1e1e1e]">
        <div className="flex items-center gap-3 border-b border-white/10 px-3 py-2">
          <span className="flex-1 truncate font-mono text-xs text-white">{props.currentFile || "No file open"}</span>
          {props.fileNote && <span className="text-[11px] text-emerald-400">{props.fileNote}</span>}
          <button onClick={props.handleSaveFile} className="flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-black">
            <Save className="h-3 w-3" /> Save
          </button>
        </div>
        <div className="min-h-0 flex-1">
          <Editor
            height="100%"
            theme="vs-dark"
            language={editorLanguage(props.currentFile)}
            value={props.fileContent}
            onChange={(value) => props.setFileContent(value ?? "")}
            options={{ fontSize: 13, minimap: { enabled: false }, padding: { top: 12 } }}
          />
        </div>
      </div>
      <aside className="hidden min-h-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-3 lg:flex">
        <div className="text-xs text-white/50">Version control</div>
        <pre className="mt-2 overflow-auto whitespace-pre-wrap font-mono text-[11px] leading-5 text-[#d6e6ff]">{gitText}</pre>
      </aside>
    </div>
    </div>
  )
}

const DOC_LANGUAGES = ["sqlite", "python~3.13", "javascript", "typescript", "rust", "html", "css", "react"]

function Docs(props: ConsoleProps & { onAsk: () => void; locked?: boolean; onLock?: () => void }) {
  const [note, setNote] = useState("")
  const [width, setWidth] = useState(300)
  const [trail, setTrail] = useState<string[]>([])
  const [trailAt, setTrailAt] = useState(-1)
  const sheetRef = useRef<HTMLElement | null>(null)
  const projectSlugs: string[] = props.project?.slugs || []
  const languages = [...new Set([...projectSlugs, ...props.installedDocs, ...DOC_LANGUAGES])]

  useEffect(() => {
    const hash = props.currentDocTitle.split("#")[1]
    if (!hash || !sheetRef.current) return
    sheetRef.current.querySelector(`#${CSS.escape(hash)}`)?.scrollIntoView()
  }, [props.docHtml, props.currentDocTitle])

  const openArticle = (path: string, record = true) => {
    props.handleOpenDocArticle(path)
    if (!record) return
    setTrail((current) => {
      const next = current.slice(0, trailAt + 1)
      if (next[next.length - 1] === path) return current
      next.push(path)
      setTrailAt(next.length - 1)
      return next
    })
  }

  const addLanguage = async (slug: string) => {
    if (props.installedDocs.includes(slug)) {
      props.setActiveDocSlug(slug)
      props.handleSearchDocs("", "", slug)
      return
    }
    setNote(`Downloading ${slug}`)
    const res = await callBackend("docs_download", { slug })
    if (res && !res.error) {
      props.setActiveDocSlug(slug)
      props.refreshDocs()
      props.handleSearchDocs("", "", slug)
      setNote(`${slug} is ready`)
    } else {
      setNote(res?.error ? String(res.error) : "Download failed")
    }
  }

  return (
    <div className="flex h-full min-h-0 gap-3">
      <aside style={{ width }} className="flex shrink-0 flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 text-[#f6e9ed] backdrop-blur-xl">
        <div className="border-b border-white/10 px-3 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm font-semibold text-white">Docs</div>
            <div className="flex gap-1">
              {!props.locked && (
                <button onClick={props.onLock} className="rounded-full bg-[#8eb7ff] px-3 py-1 text-[11px] text-black">Lock in</button>
              )}
              {!props.locked && (
                <button onClick={props.onAsk} className="rounded-full border border-white/20 bg-white/15 px-3 py-1 text-[11px] text-white backdrop-blur">Ask</button>
              )}
            </div>
          </div>
          <div className="mt-2 text-[10px] text-white/40">{props.project ? `${props.project.name} languages` : "Languages"}</div>
          <div className="mt-1 flex flex-wrap gap-1">
            {languages.map((slug) => (
              <button
                key={slug}
                onClick={() => { void addLanguage(slug) }}
                className={`rounded-full px-2 py-1 text-[11px] ${
                  props.activeDocSlug === slug ? "bg-[#ec3750] text-white" : projectSlugs.includes(slug) ? "bg-[#8eb7ff]/20 text-[#d6e6ff]" : "bg-white/10 text-[#f6e9ed]"
                }`}
              >
                {slug}{props.installedDocs.includes(slug) ? "" : " ↓"}
              </button>
            ))}
          </div>
          <div className="relative mt-2">
            <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-[#8d6b76]" />
            <input
              value={props.docQuery}
              onChange={(event) => props.handleSearchDocs(event.target.value)}
              placeholder="Search the open set"
              className="w-full rounded-full border border-white/10 bg-black/30 py-1.5 pl-7 pr-2 text-xs text-white outline-none"
            />
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto border-b border-white/10 px-2 py-2">
          {props.docTypes.map((type) => (
            <button
              key={type.name}
              onClick={() => props.handleSearchDocs("", type.name, props.activeDocSlug)}
              className={`shrink-0 rounded-full px-2 py-1 text-[10px] ${
                props.activeDocType === type.name ? "bg-white text-black" : "bg-white/10 text-white/70"
              }`}
            >
              {type.name}
            </button>
          ))}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {props.docSearchResults.length === 0 && (
            <p className="px-3 py-4 text-xs leading-relaxed text-[#c7a8b1]">
              No pages loaded. Add a language and the index fills this column.
            </p>
          )}
          {props.docSearchResults.map((entry, index) => (
            <button
              key={`${entry.path}-${index}`}
              onClick={() => openArticle(entry.path)}
              className={`block w-full border-b border-[#2a1c22] px-3 py-2 text-left text-xs hover:bg-[#2a1c22] ${
                props.currentDocTitle === entry.path ? "bg-[#2a1c22] text-white" : "text-[#f6e9ed]"
              }`}
            >
              <span className="block truncate">{entry.name}</span>
              {entry.type && <span className="text-[10px] text-[#e7b7c2]">{entry.type}</span>}
            </button>
          ))}
        </div>
        <div className="border-t border-white/10 p-3">
          {note && <p className="text-[11px] text-[#9ec5ff]">{note}</p>}
          {!note && <p className="text-[11px] text-white/40">A language with ↓ downloads, then opens.</p>}
        </div>
      </aside>
      <div
        role="separator"
        aria-orientation="vertical"
        className="w-1.5 shrink-0 cursor-col-resize rounded-full bg-white/10 hover:bg-[#ec3750]"
        onMouseDown={(event) => {
          event.preventDefault()
          const startX = event.clientX
          const startW = width
          const move = (ev: MouseEvent) => setWidth(Math.min(560, Math.max(220, startW + ev.clientX - startX)))
          const up = () => {
            window.removeEventListener("mousemove", move)
            window.removeEventListener("mouseup", up)
          }
          window.addEventListener("mousemove", move)
          window.addEventListener("mouseup", up)
        }}
      />
      <article
        ref={sheetRef}
        className="doc-sheet min-w-0 flex-1 overflow-y-auto rounded-3xl border border-[#8eb7ff]/20 bg-[#07111f] px-10 py-8 pb-40 text-[#dbe7f5]"
        onClick={(event) => {
          const link = (event.target as HTMLElement).closest("a")
          if (!link) return
          const href = link.getAttribute("href") || ""
          if (!href || href.startsWith("http") || href.startsWith("mailto") || href.startsWith("#")) {
            if (href.startsWith("#")) {
              event.preventDefault()
              document.getElementById(href.slice(1))?.scrollIntoView()
            }
            return
          }
          event.preventDefault()
          openArticle(href.replace(/^\.\//, ""))
        }}
      >
        {props.docHtml ? (
          <div>
            <div className="mb-4 flex items-center gap-2 font-mono text-xs text-[#8eb7ff]">
              <button
                type="button"
                disabled={trailAt <= 0}
                onClick={() => { const path = trail[trailAt - 1]; setTrailAt(trailAt - 1); openArticle(path, false) }}
                className="rounded-full bg-white/10 px-2 py-1 text-white disabled:opacity-30"
              >Back</button>
              <button
                type="button"
                disabled={trailAt >= trail.length - 1}
                onClick={() => { const path = trail[trailAt + 1]; setTrailAt(trailAt + 1); openArticle(path, false) }}
                className="rounded-full bg-white/10 px-2 py-1 text-white disabled:opacity-30"
              >Forward</button>
              <span className="truncate">{props.currentDocTitle}</span>
            </div>
            <div dangerouslySetInnerHTML={{ __html: props.docHtml }} />
          </div>
        ) : (
          <div className="mx-auto max-w-lg pt-16">
            <h1 className="text-3xl font-semibold text-white">Read the docs. Ask beside them.</h1>
            <p className="mt-3 text-sm leading-relaxed text-[#9eb6d4]">
              {props.locked
                ? "Pick a language. Search, open a page, and ask the mentor on the right about this project."
                : "Pick a language. Lock in when you want only this reader and the mentor."}
            </p>
          </div>
        )}
      </article>
    </div>
  )
}

function ErrorDock(props: ConsoleProps) {
  return (
    <form
      className="fixed bottom-4 right-4 z-40 w-[min(640px,calc(100%-22rem))] rounded-3xl border border-white/15 bg-[#252526]/95 p-3 shadow-2xl backdrop-blur-xl"
      onSubmit={(event) => {
        event.preventDefault()
        if (!props.errorText.trim()) return
        void props.analyzeError()
      }}
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="text-xs text-white/70">Paste an error. The matching doc opens above.</div>
        {props.errorNote && <div className="truncate text-xs text-[#ec3750]">{props.errorNote}</div>}
      </div>
      <div className="flex items-end gap-2">
        <textarea
          value={props.errorText}
          onChange={(event) => props.setErrorText(event.target.value)}
          placeholder="Traceback or compiler error"
          rows={2}
          className="max-h-40 min-h-[52px] flex-1 resize-y rounded-2xl border border-white/10 bg-[#1e1e1e] px-3 py-2 font-mono text-xs text-white outline-none"
        />
        <button className="rounded-full bg-[#ec3750] px-4 py-2 text-sm text-white">Open doc</button>
      </div>
    </form>
  )
}

function Errors(props: ConsoleProps & { onAsk: () => void }) {
  return (
    <div className="mx-auto max-w-3xl space-y-2 pb-40">
      <section className="space-y-2">
        {props.errorHistory.length === 0 && (
          <p className="rounded-3xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-white/50">No errors stored yet.</p>
        )}
        {props.errorHistory.map((item) => (
          <article key={item.id} className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
            <div className="font-mono text-[11px] text-white/40">{item.timestamp}</div>
            <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap font-mono text-xs leading-5 text-[#e6e6e6]">{item.raw_text}</pre>
            <p className="mt-2 text-xs text-white/50">
              {item.match?.result?.title
                ? `${item.match.result.title} · ${item.match.result.slug}`
                : item.match?.result?.reason || "No page matched."}
            </p>
          </article>
        ))}
      </section>
    </div>
  )
}

function MentorDesk(props: ConsoleProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-[#262626]">
        <div className="px-3 py-2 border-b border-[#262626] text-sm text-white">Tasks you still have to type</div>
        <div className="divide-y divide-[#262626]">
          {props.tasks.length === 0 && <p className="px-3 py-4 text-xs text-[#71717a]">Ask in the panel. A task lands here.</p>}
          {props.tasks.map((task) => (
            <div key={task.id} className="px-3 py-3 flex gap-3 items-start">
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${task.status === "done" ? "line-through text-[#71717a]" : "text-white"}`}>{task.title}</p>
                <p className="text-xs text-[#71717a] mt-1">{task.detail}</p>
              </div>
              <button
                onClick={() => props.markTask(task.id, task.status === "done" ? "open" : "done")}
                className="px-2 py-1 rounded-md text-[11px] border border-[#262626] text-white"
              >
                {task.status === "done" ? "Reopen" : "I typed it"}
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-[#262626] overflow-hidden">
        <div className="px-3 py-2 border-b border-[#262626] text-sm text-white">Audit log</div>
        <AuditTable logs={props.auditLogs} />
      </div>
    </div>
  )
}

function AuditTable({ logs }: { logs: any[] }) {
  return (
    <table className="w-full text-left text-xs">
      <thead className="text-[#71717a] bg-[#101012]">
        <tr>
          <th className="px-3 py-2 font-medium">When</th>
          <th className="px-3 py-2 font-medium">Tool</th>
          <th className="px-3 py-2 font-medium">Action</th>
          <th className="px-3 py-2 font-medium">Notes</th>
        </tr>
      </thead>
      <tbody>
        {logs.length === 0 && (
          <tr><td colSpan={4} className="px-3 py-6 text-[#71717a]">No audit rows yet.</td></tr>
        )}
        {logs.map((log) => (
          <tr key={log.id} className="border-t border-[#262626]">
            <td className="px-3 py-2 font-mono text-[#a1a1aa]">{log.timestamp}</td>
            <td className="px-3 py-2">{log.tool_name}</td>
            <td className="px-3 py-2 text-white">{log.action}</td>
            <td className="px-3 py-2 text-[#a1a1aa]">{log.notes}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

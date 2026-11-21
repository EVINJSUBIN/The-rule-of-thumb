import React, { useState, useEffect, useRef } from "react"
import { callBackend } from "@/src/bridge"
import { Console, type PageId } from "@/src/console"

export default function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "docs" | "files" | "ai" | "tracker" | "errors">("dashboard")
  const [chatOpen, setChatOpen] = useState(false)
  
  // Dashboard stats
  const [stats, setStats] = useState({
    hours: 0,
    aiCalls: 0,
    installedDocs: 0,
  })

  // Docs state
  const [installedDocs, setInstalledDocs] = useState<string[]>([])
  const [sidecarLive, setSidecarLive] = useState(false)
  const [fileNote, setFileNote] = useState("")
  const [activeDocSlug, setActiveDocSlug] = useState("sqlite")
  const [docSearchResults, setDocSearchResults] = useState<Array<{ name: string; path: string; type?: string }>>([])
  const [docTypes, setDocTypes] = useState<Array<{ name: string; count?: number; slug?: string }>>([])
  const [activeDocType, setActiveDocType] = useState("")
  const [docQuery, setDocQuery] = useState("")
  const [downloadSlug, setDownloadSlug] = useState("")
  const [docHtml, setDocHtml] = useState("")
  const [currentDocTitle, setCurrentDocTitle] = useState("")

  // Files state
  const [fileList, setFileList] = useState<string[]>([])
  const [currentFile, setCurrentFile] = useState("")
  const [fileContent, setFileContent] = useState("")

  // Timer state
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [sessionNote, setSessionNote] = useState("")
  const [sessions, setSessions] = useState<any[]>([])
  const [storedKeys, setStoredKeys] = useState(0)
  const [liveKeys, setLiveKeys] = useState(0)
  const [typingLogic, setTypingLogic] = useState<any>(null)
  const [rule, setRule] = useState<any>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [errorText, setErrorText] = useState("")
  const [errorNote, setErrorNote] = useState("")
  const [errorHistory, setErrorHistory] = useState<any[]>([])
  const keyBuffer = useRef(0)

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [project, setProject] = useState<any>(() => {
    try {
      const saved = localStorage.getItem("rot_project")
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  // Load initial stats
  useEffect(() => {
    refreshStats()
    refreshDocs()
    refreshFiles()
    refreshSessions()
    refreshTelemetry()
    refreshRule()
    refreshTasks()
    refreshErrors()
    void refreshProjects()
    void handleSearchDocs("")
    const pulse = window.setInterval(() => {
      void refreshRule()
      void refreshTelemetry()
      void refreshStats()
    }, 8000)
    return () => window.clearInterval(pulse)
  }, [])

  useEffect(() => {
    const onTasks = () => {
      void refreshTasks()
      void refreshStats()
      void refreshRule()
    }
    window.addEventListener("rule-of-thumb-tasks", onTasks)
    return () => window.removeEventListener("rule-of-thumb-tasks", onTasks)
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (event.key.length !== 1 && event.key !== "Backspace" && event.key !== "Enter") return
      const tag = (event.target as HTMLElement | null)?.tagName
      if (tag !== "TEXTAREA" && tag !== "INPUT") return
      keyBuffer.current += 1
      setLiveKeys((count) => count + 1)
    }
    window.addEventListener("keydown", onKey)
    const flush = window.setInterval(() => {
      const count = keyBuffer.current
      if (count <= 0) return
      keyBuffer.current = 0
      void callBackend("telemetry_record", { keyCount: count, source: "typing" }).then((res) => {
        if (res && !res.error && typeof res.total_keystrokes === "number") {
          setStoredKeys(res.total_keystrokes)
        }
      })
    }, 1500)
    return () => {
      window.removeEventListener("keydown", onKey)
      window.clearInterval(flush)
    }
  }, [])

  // Timer interval
  useEffect(() => {
    let interval: any = null
    if (timerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(s => s + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [timerRunning])

  const refreshStats = async () => {
    const res = await callBackend("audit_stats")
    if (res && !res.error) {
      setStats({
        hours: typeof res.total_coding_hours === "number" ? res.total_coding_hours : 0,
        aiCalls: res.total_ai_requests || 0,
        installedDocs: res.recent_logs?.length || 1,
      })
      if (res.recent_logs) setAuditLogs(res.recent_logs)
    }
  }

  const refreshSessions = async () => {
    const res = await callBackend("sessions_list")
    if (res && res.sessions) setSessions(res.sessions)
  }

  const refreshTelemetry = async () => {
    const res = await callBackend("telemetry_stats")
    if (res && !res.error) {
      setStoredKeys(res.total_keystrokes || 0)
      setTypingLogic(res.typing_time || null)
    }
  }

  const refreshRule = async () => {
    const res = await callBackend("rule_status")
    setSidecarLive(!!res && !res.error)
    if (res && !res.error) setRule(res)
  }

  const refreshTasks = async () => {
    const res = await callBackend("tasks_list")
    if (res && res.tasks) setTasks(res.tasks)
  }

  const refreshErrors = async () => {
    const res = await callBackend("errors_list")
    if (res && res.errors) setErrorHistory(res.errors)
  }

  const markTask = async (taskId: number, status: "open" | "done") => {
    await callBackend("tasks_update", { taskId, status })
    refreshTasks()
  }

  const openDocPage = async (slug: string, path: string) => {
    if (!slug || !path) return
    setActiveDocSlug(slug)
    setActiveTab("docs")
    setCurrentDocTitle(path)
    const article = await callBackend("docs_get", { slug, doc_path: path })
    if (article && article.html) setDocHtml(article.html)
    else setDocHtml("")
    void handleSearchDocs("", "", slug)
  }

  const analyzeError = async () => {
    if (!errorText.trim()) return
    const res = await callBackend("errors_analyze", { errorText })
    if (res && !res.error) {
      const match = res.match?.logic === "ready" ? res.match.result : null
      if (match?.slug && match?.doc_path) {
        setErrorNote(match.title ? `${match.title} · ${match.slug}` : "Opened the matching page.")
        await openDocPage(match.slug, match.doc_path)
      } else {
        setErrorNote(match?.reason || "Saved. No installed page matched.")
      }
      refreshErrors()
    } else {
      setErrorNote(res?.error ? String(res.error) : "Could not save the error")
    }
  }

  const refreshDocs = async () => {
    const res = await callBackend("docs_installed")
    if (res && res.installed) {
      setInstalledDocs(res.installed)
      if (res.installed.length > 0 && !res.installed.includes(activeDocSlug)) {
        setActiveDocSlug(res.installed[0])
      }
    }
  }

  const refreshProjects = async () => {
    const res = await callBackend("projects_list")
    if (res && res.projects) setProjects(res.projects)
  }

  const refreshFiles = async (folder = project?.folder || "") => {
    const res = await callBackend("list_files", { subpath: folder })
    if (res && res.filepaths) {
      setFileList(res.filepaths)
    }
  }

  const chooseProject = (next: any) => {
    setProject(next)
    if (next) localStorage.setItem("rot_project", JSON.stringify(next))
    else localStorage.removeItem("rot_project")
    void refreshFiles(next?.folder || "")
  }

  const createProject = async (name: string, tags: string) => {
    const res = await callBackend("projects_add", { name, tags })
    if (res && !res.error) {
      chooseProject(res)
      void refreshProjects()
      setActiveTab("files")
    }
    return res
  }

  const handleDownloadDoc = async () => {
    if (!downloadSlug.trim()) return
    await callBackend("docs_download", { slug: downloadSlug.trim() })
    setDownloadSlug("")
    refreshDocs()
  }

  const handleSearchDocs = async (query: string, typeName = "", slug = activeDocSlug) => {
    setDocQuery(query)
    if (typeName) setActiveDocType(typeName)
    if (!slug) return
    const res = await callBackend("docs_search", { slug, query, typeName })
    if (res && res.results) setDocSearchResults(res.results)
    if (res && res.types) setDocTypes(res.types)
    if (res && typeof res.active_type === "string") setActiveDocType(res.active_type)
  }

  const handleOpenDocArticle = async (path: string) => {
    setCurrentDocTitle(path)
    const res = await callBackend("docs_get", { slug: activeDocSlug, doc_path: path })
    if (res && res.html) {
      setDocHtml(res.html)
    }
  }

  const handleOpenFile = async (filename: string) => {
    setCurrentFile(filename)
    const res = await callBackend("read_file", { filename })
    if (res && res.content !== undefined) {
      setFileContent(res.content)
    }
  }

  const handleSaveFile = async () => {
    if (!currentFile) return
    const res = await callBackend("write_file", { file_path: currentFile, content: fileContent })
    setFileNote(res && !res.error ? "Saved to disk" : "Save failed")
  }

  const stopAndRecord = async () => {
    const elapsed = timerSeconds
    setTimerRunning(false)
    setTimerSeconds(0)
    if (elapsed <= 0) {
      setSessionNote("")
      return
    }
    const res = await callBackend("session_record", {
      durationSeconds: elapsed,
      projectName: "The Rule of Thumb",
    })
    if (res && !res.error) {
      setSessionNote(`Logged ${res.duration_seconds ?? elapsed}s to coding_sessions`)
      refreshStats()
      refreshSessions()
      refreshRule()
    } else {
      setSessionNote(res?.error ? String(res.error) : "Could not log session")
    }
  }

  const formatTimer = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600).toString().padStart(2, "0")
    const mins = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, "0")
    const secs = (totalSeconds % 60).toString().padStart(2, "0")
    return `${hrs}:${mins}:${secs}`
  }

  const openPage = (id: PageId) => {
    setActiveTab(id)
    if (id === "dashboard") {
      void refreshStats()
      void refreshRule()
      void refreshSessions()
    }
    if (id === "docs") {
      void refreshDocs()
      void handleSearchDocs("")
    }
    if (id === "files") void refreshFiles()
    if (id === "tracker") {
      void refreshSessions()
      void refreshTelemetry()
    }
    if (id === "errors") void refreshErrors()
    if (id === "ai") {
      void refreshTasks()
      void refreshStats()
    }
  }

  return (
    <Console
      page={activeTab}
      onPage={openPage}
      chatOpen={chatOpen}
      setChatOpen={setChatOpen}
      sidecarLive={sidecarLive}
      stats={stats}
      installedDocs={installedDocs}
      activeDocSlug={activeDocSlug}
      setActiveDocSlug={setActiveDocSlug}
      docSearchResults={docSearchResults}
      docTypes={docTypes}
      activeDocType={activeDocType}
      docQuery={docQuery}
      downloadSlug={downloadSlug}
      setDownloadSlug={setDownloadSlug}
      docHtml={docHtml}
      currentDocTitle={currentDocTitle}
      fileList={fileList}
      currentFile={currentFile}
      fileContent={fileContent}
      setFileContent={setFileContent}
      fileNote={fileNote}
      timerRunning={timerRunning}
      setTimerRunning={setTimerRunning}
      timerSeconds={timerSeconds}
      sessionNote={sessionNote}
      sessions={sessions}
      storedKeys={storedKeys}
      liveKeys={liveKeys}
      typingLogic={typingLogic}
      rule={rule}
      tasks={tasks}
      errorText={errorText}
      setErrorText={setErrorText}
      errorNote={errorNote}
      errorHistory={errorHistory}
      auditLogs={auditLogs}
      formatTimer={formatTimer}
      refreshDocs={refreshDocs}
      refreshFiles={refreshFiles}
      handleDownloadDoc={handleDownloadDoc}
      handleSearchDocs={handleSearchDocs}
      handleOpenDocArticle={handleOpenDocArticle}
      handleOpenFile={handleOpenFile}
      handleSaveFile={handleSaveFile}
      stopAndRecord={() => { void stopAndRecord() }}
      markTask={(id, status) => { void markTask(id, status) }}
      analyzeError={() => { void analyzeError() }}
      projects={projects}
      project={project}
      chooseProject={chooseProject}
      createProject={createProject}
    />
  )
}

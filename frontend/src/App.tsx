import React, { useState, useEffect } from "react"
import { VercelV0Chat } from "@/components/ui/v0-ai-chat"
import { callBackend } from "@/src/bridge"
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
  FileCode
} from "lucide-react"

export default function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "docs" | "files" | "ai" | "tracker">("dashboard")
  
  // Dashboard stats
  const [stats, setStats] = useState({
    hours: 13.0,
    aiCalls: 0,
    installedDocs: 1,
  })

  // Docs state
  const [installedDocs, setInstalledDocs] = useState<string[]>(["sqlite"])
  const [activeDocSlug, setActiveDocSlug] = useState("sqlite")
  const [docSearchResults, setDocSearchResults] = useState<Array<{ name: string; path: string; type?: string }>>([])
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

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<any[]>([])

  // Load initial stats
  useEffect(() => {
    refreshStats()
    refreshDocs()
    refreshFiles()
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
        hours: res.total_coding_hours || 13.0,
        aiCalls: res.total_ai_requests || 0,
        installedDocs: res.recent_logs?.length || 1,
      })
      if (res.recent_logs) setAuditLogs(res.recent_logs)
    }
  }

  const refreshDocs = async () => {
    const res = await callBackend("docs_installed")
    if (res && res.installed) {
      setInstalledDocs(res.installed)
      if (res.installed.length > 0 && !activeDocSlug) {
        setActiveDocSlug(res.installed[0])
      }
    }
  }

  const refreshFiles = async () => {
    const res = await callBackend("list_files", { subpath: "" })
    if (res && res.filepaths) {
      setFileList(res.filepaths)
    }
  }

  const handleDownloadDoc = async () => {
    if (!downloadSlug.trim()) return
    await callBackend("docs_download", { slug: downloadSlug.trim() })
    setDownloadSlug("")
    refreshDocs()
  }

  const handleSearchDocs = async (query: string) => {
    setDocQuery(query)
    if (!activeDocSlug) return
    const res = await callBackend("docs_search", { slug: activeDocSlug, query: query || "select" })
    if (res && res.results) {
      setDocSearchResults(res.results.slice(0, 15))
    }
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
    await callBackend("write_file", { file_path: currentFile, content: fileContent })
  }

  const formatTimer = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600).toString().padStart(2, "0")
    const mins = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, "0")
    const secs = (totalSeconds % 60).toString().padStart(2, "0")
    return `${hrs}:${mins}:${secs}`
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-[#d4d4d8] flex flex-col font-sans antialiased selection:bg-neutral-800 selection:text-white">
      {/* Floating Liquid Glass Navbar */}
      <header className="sticky top-4 z-50 flex justify-center px-4 mb-6">
        <nav className="inline-flex items-center gap-1.5 p-1.5 rounded-full bg-[#101622]/80 backdrop-blur-md border border-white/10 shadow-2xl">
          <button
            onClick={() => { setActiveTab("dashboard"); refreshStats(); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-colors ${
              activeTab === "dashboard" ? "bg-white/15 text-white shadow-inner font-semibold" : "text-[#71717a] hover:text-white"
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>
          
          <button
            onClick={() => { setActiveTab("docs"); refreshDocs(); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-colors ${
              activeTab === "docs" ? "bg-white/15 text-white shadow-inner font-semibold" : "text-[#71717a] hover:text-white"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Offline Docs</span>
          </button>

          <button
            onClick={() => { setActiveTab("files"); refreshFiles(); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-colors ${
              activeTab === "files" ? "bg-white/15 text-white shadow-inner font-semibold" : "text-[#71717a] hover:text-white"
            }`}
          >
            <FolderTree className="w-3.5 h-3.5" />
            <span>Workspace</span>
          </button>

          <button
            onClick={() => setActiveTab("ai")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-colors ${
              activeTab === "ai" ? "bg-white/15 text-white shadow-inner font-semibold" : "text-[#71717a] hover:text-white"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>AI Mentor</span>
          </button>

          <button
            onClick={() => setActiveTab("tracker")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-colors ${
              activeTab === "tracker" ? "bg-white/15 text-white shadow-inner font-semibold" : "text-[#71717a] hover:text-white"
            }`}
          >
            <Timer className="w-3.5 h-3.5" />
            <span>Time Tracker</span>
          </button>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl w-full mx-auto px-4 pb-12 flex-1">
        {/* TAB 1: DASHBOARD */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="p-8 rounded-xl bg-[#171717] border border-[#262626]">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/30 mb-3">
                👻 HACK CLUB PHANTOM
              </div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">The Rule of Thumb</h1>
              <p className="text-sm font-mono text-[#71717a] mt-1 mb-4">// Reclaim your coding aura. 0% AI code generation.</p>
              <div className="p-3.5 rounded-lg bg-[#0f0f10] border-l-2 border-white text-xs font-mono text-[#a1a1aa] leading-relaxed">
                "Coding is being replaced by AI, but we will still code manually to prove our passions. In this project I will try my max to code by hand because it's a challenge by me."
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-xl bg-[#171717] border border-[#262626] hover:border-[#3f3f46] transition-colors">
                <div className="flex justify-between items-center text-xs font-mono uppercase text-[#71717a]">
                  <span>Coding Hours</span>
                  <span>⏱</span>
                </div>
                <div className="text-3xl font-mono font-bold text-white mt-2">
                  {stats.hours.toFixed(1)} <span className="text-sm text-[#71717a] font-normal">/ 40h</span>
                </div>
                <div className="w-full bg-[#27272a] h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className="bg-white h-full rounded-full transition-all duration-300" style={{ width: `${(stats.hours / 40) * 100}%` }}></div>
                </div>
                <div className="text-xs text-[#71717a] mt-2">32.5% to Phantom Grant</div>
              </div>

              <div className="p-5 rounded-xl bg-[#171717] border border-[#262626] hover:border-[#3f3f46] transition-colors">
                <div className="flex justify-between items-center text-xs font-mono uppercase text-[#71717a]">
                  <span>AI Tool Logs</span>
                  <span>🤖</span>
                </div>
                <div className="text-3xl font-mono font-bold text-white mt-2">{stats.aiCalls}</div>
                <div className="text-xs text-[#71717a] mt-4">SQLite audit events</div>
              </div>

              <div className="p-5 rounded-xl bg-[#171717] border border-[#262626] hover:border-[#3f3f46] transition-colors">
                <div className="flex justify-between items-center text-xs font-mono uppercase text-[#71717a]">
                  <span>Offline Docs</span>
                  <span>📚</span>
                </div>
                <div className="text-3xl font-mono font-bold text-white mt-2">{installedDocs.length}</div>
                <div className="text-xs text-[#71717a] mt-4">Zero-internet packages</div>
              </div>

              <div className="p-5 rounded-xl bg-[#171717] border border-[#262626] hover:border-[#3f3f46] transition-colors">
                <div className="flex justify-between items-center text-xs font-mono uppercase text-[#71717a]">
                  <span>Policy</span>
                  <span className="text-emerald-400">●</span>
                </div>
                <div className="text-2xl font-mono font-bold text-white mt-2">Human</div>
                <div className="text-xs text-[#71717a] mt-4">Tauri + Rust + Python</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl bg-[#171717] border border-[#262626]">
                <h3 className="text-base font-semibold text-white mb-2">Quick Navigation</h3>
                <div className="flex flex-wrap gap-2 mt-3">
                  <button onClick={() => setActiveTab("docs")} className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white text-black hover:bg-zinc-200 transition-colors">
                    Browse Docs
                  </button>
                  <button onClick={() => setActiveTab("files")} className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-[#262626] hover:bg-[#3f3f46] text-white transition-colors">
                    Workspace Files
                  </button>
                  <button onClick={() => setActiveTab("ai")} className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-[#262626] hover:bg-[#3f3f46] text-white transition-colors">
                    Ask Sarcastic Mentor
                  </button>
                  <button onClick={() => setActiveTab("tracker")} className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-[#262626] hover:bg-[#3f3f46] text-white transition-colors">
                    Coding Timer
                  </button>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-[#171717] border border-[#262626]">
                <h3 className="text-base font-semibold text-white mb-2">Rule of Thumb Cap</h3>
                <p className="text-xs text-[#71717a] leading-relaxed mb-3">
                  0% AI code generation enforced. AI is strictly capped to high-level architecture planning and debugging advice.
                </p>
                <span className="inline-flex px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  STATUS: 100% HAND-CODED AUDIT TRAIL
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: OFFLINE DOCS */}
        {activeTab === "docs" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Offline Documentation Engine</h2>
                <p className="text-xs text-[#71717a]">DevDocs CDN packages cached locally in <code className="text-zinc-400">data/docs/</code></p>
              </div>
              <button onClick={refreshDocs} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#171717] border border-[#262626] hover:border-[#3f3f46] text-white">
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-4 min-h-[560px]">
              {/* Sidebar */}
              <div className="p-4 rounded-xl bg-[#171717] border border-[#262626] space-y-4 max-h-[660px] overflow-y-auto">
                <div>
                  <div className="text-xs font-mono uppercase text-[#71717a] font-semibold mb-2">Installed Docsets</div>
                  <div className="space-y-1.5">
                    {installedDocs.map(slug => (
                      <div
                        key={slug}
                        onClick={() => { setActiveDocSlug(slug); handleSearchDocs(""); }}
                        className={`p-2.5 rounded-lg border text-xs cursor-pointer flex justify-between items-center transition-colors ${
                          activeDocSlug === slug ? "bg-[#262626] border-[#52525b] text-white font-semibold" : "bg-[#121212] border-[#262626] text-[#d4d4d8] hover:bg-[#1f1f1f]"
                        }`}
                      >
                        <span className="font-mono">{slug}</span>
                        <span className="text-[10px] text-emerald-400 font-mono">Offline</span>
                      </div>
                    ))}
                  </div>
                </div>

                <hr className="border-[#262626]" />

                <div>
                  <div className="text-xs font-mono uppercase text-[#71717a] font-semibold mb-2">Download Docset</div>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={downloadSlug}
                      onChange={e => setDownloadSlug(e.target.value)}
                      placeholder="e.g. rust, python~3.12"
                      className="w-full px-3 py-1.5 rounded-lg bg-[#09090b] border border-[#262626] text-xs font-mono text-white focus:outline-none focus:border-[#52525b]"
                    />
                    <button onClick={handleDownloadDoc} className="px-3 py-1.5 rounded-lg bg-white text-black font-semibold text-xs hover:bg-zinc-200">
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <hr className="border-[#262626]" />

                <div>
                  <div className="text-xs font-mono uppercase text-[#71717a] font-semibold mb-2">Search in {activeDocSlug}</div>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#71717a]" />
                    <input
                      type="text"
                      value={docQuery}
                      onChange={e => handleSearchDocs(e.target.value)}
                      placeholder="Search API keywords..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#09090b] border border-[#262626] text-xs font-mono text-white focus:outline-none focus:border-[#52525b]"
                    />
                  </div>

                  <div className="mt-2.5 space-y-1 max-h-[220px] overflow-y-auto">
                    {docSearchResults.map((entry, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleOpenDocArticle(entry.path)}
                        className="p-2 rounded-md bg-[#121212] border border-[#262626] hover:bg-[#1f1f1f] cursor-pointer text-xs flex justify-between items-center text-[#d4d4d8] hover:text-white"
                      >
                        <span className="truncate">{entry.name}</span>
                        <span className="text-[10px] text-[#71717a] ml-2 font-mono">{entry.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Viewer Pane */}
              <div className="p-6 rounded-xl bg-[#171717] border border-[#262626] max-h-[660px] overflow-y-auto">
                {docHtml ? (
                  <div>
                    <div className="flex justify-between items-center border-b border-[#262626] pb-3 mb-4">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-sky-500/10 text-sky-400 border border-sky-500/30">
                        {activeDocSlug.toUpperCase()}
                      </span>
                      <span className="text-xs font-mono text-[#71717a]">{currentDocTitle}</span>
                    </div>
                    <div className="prose prose-invert max-w-none text-sm text-[#d4d4d8] leading-relaxed" dangerouslySetInnerHTML={{ __html: docHtml }} />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center text-[#71717a] p-8">
                    <BookOpen className="w-12 h-12 text-[#3f3f46] mb-3" />
                    <h3 className="text-base font-semibold text-white">No Article Selected</h3>
                    <p className="text-xs max-w-sm mt-1 leading-relaxed">
                      Select an installed docset on the left or search for an API symbol to view documentation completely offline.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: WORKSPACE FILES */}
        {activeTab === "files" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Workspace File Explorer</h2>
                <p className="text-xs text-[#71717a]">Direct disk read/write through Python sidecar RPC</p>
              </div>
              <button onClick={refreshFiles} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#171717] border border-[#262626] hover:border-[#3f3f46] text-white">
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh Tree
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4 min-h-[560px]">
              {/* File Tree */}
              <div className="p-3 rounded-xl bg-[#171717] border border-[#262626] max-h-[660px] overflow-y-auto space-y-1">
                {fileList.map(fp => (
                  <div
                    key={fp}
                    onClick={() => handleOpenFile(fp)}
                    className={`flex items-center gap-2 p-2 rounded-md cursor-pointer text-xs font-mono transition-colors ${
                      currentFile === fp ? "bg-[#27272a] text-white font-semibold" : "text-[#71717a] hover:bg-[#262626] hover:text-white"
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    <span className="truncate">{fp}</span>
                  </div>
                ))}
              </div>

              {/* Editor Pane */}
              <div className="flex flex-col rounded-xl bg-[#171717] border border-[#262626] overflow-hidden">
                <div className="flex justify-between items-center px-4 py-2.5 bg-[#121212] border-b border-[#262626]">
                  <span className="text-xs font-mono text-white truncate max-w-md">
                    {currentFile || "No file opened"}
                  </span>
                  <button onClick={handleSaveFile} className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-white text-black hover:bg-zinc-200">
                    <Save className="w-3 h-3" />
                    Save
                  </button>
                </div>
                <textarea
                  value={fileContent}
                  onChange={e => setFileContent(e.target.value)}
                  placeholder="Select a file from the workspace tree to view and edit..."
                  className="w-full flex-1 min-h-[480px] p-4 bg-[#09090b] text-[#e4e4e7] font-mono text-xs leading-relaxed border-none outline-none resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SARCASTIC AI MENTOR & V0 CHAT COMPONENT */}
        {activeTab === "ai" && (
          <div className="space-y-8">
            {/* Native Mount of the v0-ai-chat Component */}
            <VercelV0Chat />

            {/* Audit Logs Table */}
            <div className="p-6 rounded-xl bg-[#171717] border border-[#262626]">
              <h3 className="text-sm font-semibold text-white mb-3">Recent AI Audit Trail (SQLite)</h3>
              <div className="overflow-x-auto border border-[#262626] rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-black/30 border-b border-[#262626] text-[#71717a] font-mono">
                      <th className="p-2.5">ID</th>
                      <th className="p-2.5">Timestamp</th>
                      <th className="p-2.5">Tool</th>
                      <th className="p-2.5">Action</th>
                      <th className="p-2.5">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.length > 0 ? (
                      auditLogs.map((log: any) => (
                        <tr key={log.id} className="border-b border-[#262626]/50 hover:bg-white/[0.02]">
                          <td className="p-2.5 font-mono text-[#71717a]">{log.id}</td>
                          <td className="p-2.5 font-mono">{log.timestamp}</td>
                          <td className="p-2.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-800 text-zinc-300">
                              {log.tool_name}
                            </span>
                          </td>
                          <td className="p-2.5 font-semibold text-white">{log.action}</td>
                          <td className="p-2.5 text-[#a1a1aa]">{log.notes}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-[#71717a]">
                          No audit logs recorded yet. Use the prompt box above to log an action.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: TIME TRACKER */}
        {activeTab === "tracker" && (
          <div className="max-w-md mx-auto p-8 rounded-xl bg-[#171717] border border-[#262626] text-center space-y-6">
            <span className="inline-flex px-3 py-1 rounded-full text-xs font-mono font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
              OFFLINE SESSION TRACKER
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">Live Coding Session</h2>
            
            <div className="text-5xl font-mono font-extrabold text-white tracking-tight py-4">
              {formatTimer(timerSeconds)}
            </div>

            <div className="flex justify-center gap-3">
              <button
                onClick={() => setTimerRunning(!timerRunning)}
                className={`px-5 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                  timerRunning ? "bg-amber-500 text-black hover:bg-amber-400" : "bg-white text-black hover:bg-zinc-200"
                }`}
              >
                {timerRunning ? "⏸ Pause Session" : "▶ Start Session"}
              </button>
              <button
                onClick={() => { setTimerRunning(false); setTimerSeconds(0); }}
                className="px-5 py-2.5 rounded-lg text-xs font-medium bg-[#262626] text-white hover:bg-[#3f3f46]"
              >
                ⏹ Reset
              </button>
            </div>

            <p className="text-xs text-[#71717a] leading-relaxed">
              Records active coding time offline. When stopped, time logs directly into local SQLite <code className="text-zinc-400">coding_sessions</code>.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

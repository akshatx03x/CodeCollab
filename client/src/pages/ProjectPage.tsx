"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { io } from "socket.io-client"
import toast from "react-hot-toast"
import { Save, Users, Trash2, Plus, Code2, Menu, X, FileText, Terminal, Radio, ShieldAlert, Cpu } from "lucide-react"
import { API_BASE_URL } from "../config/api"

interface File {
  name: string
  content: string
}

interface Project {
  _id: string
  name: string
  files: File[]
  language: string
}

export default function ProjectPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const [selectedFile, setSelectedFile] = useState<string>("")
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(true)
  const [activeUsers, setActiveUsers] = useState<string[]>([])
  const [showLeftSidebar, setShowLeftSidebar] = useState(false)
  const [showRightSidebar, setShowRightSidebar] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const socketRef = useRef<any>(null)
  const { token, user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchProject()
    initSocket()

    return () => {
      if (socketRef.current) {
        socketRef.current.emit("leave-project", projectId, user?.name)
        socketRef.current.disconnect()
      }
    }
  }, [projectId, user?.name])

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY })
  }

  const fetchProject = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        if (res.status === 401) {
          toast.error("Session expired. Please log in again.")
          navigate("/login")
          return
        }
        throw new Error("Failed to fetch project")
      }
      const data = await res.json()
      setProject(data)
      const validFiles = (data.files || []).filter((f: any) => f && typeof f === "object" && f.name)
      setFiles(validFiles)
      if (validFiles.length > 0) {
        setSelectedFile(validFiles[0].name)
        setCode(validFiles[0].content)
      }
    } catch (error) {
      toast.error("Failed to load project files.")
    } finally {
      setLoading(false)
    }
  }

  const initSocket = () => {
    socketRef.current = io(API_BASE_URL)
    socketRef.current.on("connect", () => socketRef.current.emit("join-project", projectId, user?.name))

    socketRef.current.on("file-updated", (fileName: string, content: string) => {
      if (fileName === selectedFile) setCode(content)
      setFiles((prev) => prev.map((f) => (f.name === fileName ? { ...f, content } : f)))
    })

    socketRef.current.on("active-users", (users: string[]) => setActiveUsers(users))
    socketRef.current.on("user-joined", (name: string) => toast.success(`${name} joined the project`))
    socketRef.current.on("user-left", (name: string) => {
      setActiveUsers((prev) => prev.filter((u) => u !== name))
      toast(`${name} left the project`)
    })
  }

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value
    setCode(newCode)
    setFiles((prev) => prev.map((f) => (f.name === selectedFile ? { ...f, content: newCode } : f)))
    socketRef.current?.emit("file-updated", projectId, selectedFile, newCode)
  }

  const saveCode = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/code/projects/${projectId}/files/${encodeURIComponent(selectedFile)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: code }),
      })
      toast.success("Saved!")
    } catch {
      toast.error("Save failed")
    }
  }

  const selectFile = (name: string) => {
    setSelectedFile(name)
    const file = files.find((f) => f.name === name)
    if (file) setCode(file.content)
    setShowLeftSidebar(false)
  }

  const addNewFile = () => fileInputRef.current?.click()

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const content = await file.text()
    try {
      const res = await fetch(`${API_BASE_URL}/api/code/projects/${projectId}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: file.name, content }),
      })
      const { file: newFile } = await res.json()
      setFiles((prev) => [...prev, newFile])
      setSelectedFile(file.name)
      setCode(content)
      toast.success("File added successfully.")
    } catch {
      toast.error("Failed to add file.")
    }
  }

  const deleteFile = async (name: string) => {
    if (files.length <= 1) return toast.error("Cannot delete the only file in the project.")
    try {
      await fetch(`${API_BASE_URL}/api/code/projects/${projectId}/files/${encodeURIComponent(name)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      const remaining = files.filter((f) => f.name !== name)
      setFiles(remaining)
      if (selectedFile === name && remaining.length > 0) {
        setSelectedFile(remaining[0].name)
        setCode(remaining[0].content)
      }
      toast.success("File deleted successfully.")
    } catch {
      toast.error("Failed to delete file.")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050505] font-mono text-xs text-[#00e87a]">
        <span className="animate-pulse mr-2">▋</span> Connecting to live editor...
      </div>
    )
  }

  return (
    <div
      onMouseMove={handleMouseMove}
      className="h-screen bg-[#050505] text-[#d4d4d4] relative overflow-hidden font-sans select-none flex flex-col"
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');
        @keyframes blink { 0%, 100% { opacity: 1 } 50% { opacity: 0 } }
        .editor-area::placeholder { color: #222 !important; }
      `}</style>

      {/* Background Matrix Sync Grid */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.005) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.005) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          backgroundPosition: "center",
          WebkitMaskImage: `radial-gradient(500px circle at ${mousePos.x}px ${mousePos.y}px, black 20%, transparent 100%)`,
          maskImage: `radial-gradient(500px circle at ${mousePos.x}px ${mousePos.y}px, black 20%, transparent 100%)`,
          transition: "mask-image 0.1s ease",
        }}
      />

      {/* MOBILE APPLICATION HEADER DISPLAY */}
      <div className="lg:hidden bg-[#060606] border-b border-[#121212] px-4 py-3 flex items-center justify-between relative z-50 backdrop-blur-xl">
        <button
          onClick={() => setShowLeftSidebar(!showLeftSidebar)}
          className="p-1.5 text-[#555] hover:text-[#00e87a] bg-[#0b0b0b] border border-[#141414] rounded-md transition-all"
        >
          {showLeftSidebar ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>

        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 bg-[#0f0f0f] border border-[#1c1c1c] rounded-md flex items-center justify-center cursor-pointer"
            onClick={() => navigate("/")}
          >
            <Code2 className="w-3.5 h-3.5 text-[#00e87a]" />
          </div>
          <h1 className="font-mono text-sm font-bold text-white max-w-[140px] truncate">
            {project?.name}
          </h1>
        </div>

        <button
          onClick={() => setShowRightSidebar(!showRightSidebar)}
          className="p-1.5 text-[#555] hover:text-[#00e87a] bg-[#0b0b0b] border border-[#141414] rounded-md transition-all relative"
        >
          <Users className="w-4 h-4" />
          {activeUsers.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#00e87a] rounded-full font-mono text-[9px] font-bold text-[#050505] flex items-center justify-center shadow-[0_0_8px_#00e87a]">
              {activeUsers.length}
            </span>
          )}
        </button>
      </div>

      {/* MAIN WORKSPACE WRAPPER SECTION FRAME */}
      <div className="relative flex flex-1 h-full z-10 overflow-hidden">
        
        {/* LEFT FILE MANAGER DIRECTORY VIEW */}
        <div
          className={`
          fixed lg:relative inset-y-0 left-0 z-40
          w-64 bg-[#070707] border-r border-[#121212] flex flex-col
          transform transition-transform duration-200 cubic-bezier(0.16, 1, 0.3, 1)
          ${showLeftSidebar ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
        >
          {/* Desktop Branding Title Box Header */}
          <div className="hidden lg:block p-4 border-b border-[#121212] bg-[#050505]">
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-7 h-7 bg-[#0d0d0d] border border-[#161616] rounded-md flex items-center justify-center cursor-pointer hover:border-[rgba(0,232,122,0.3)] transition-all"
                onClick={() => navigate("/")}
              >
                <Code2 className="w-3.5 h-3.5 text-[#00e87a]" />
              </div>
              <h1 className="font-mono text-sm font-bold text-white truncate tracking-tight">
                {project?.name}
              </h1>
            </div>
            
            <button
              onClick={addNewFile}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-[#00e87a] hover:bg-[#1affaa] text-[#050505] font-mono text-xs font-semibold rounded-md transition-all shadow-[0_4px_12px_rgba(0,232,122,0.1)]"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2.5} /> Add File
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
          </div>

          {/* Mobile Append File Header Block */}
          <div className="lg:hidden p-4 border-b border-[#121212] bg-[#050505]">
            <button
              onClick={addNewFile}
              className="w-full flex items-center justify-center gap-1.5 py-2 bg-[#00e87a] text-[#050505] font-mono text-xs font-semibold rounded-md"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2.5} /> Add File
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
          </div>

          {/* Nav Directory File Index Render Tree */}
          <div className="flex-1 overflow-y-auto px-2 py-3 bg-[#070707]">
            <div className="font-mono text-[9px] text-[#444] px-3 mb-2 tracking-widest uppercase">Project Files</div>
            {files.map((file) => (
              <div
                key={file.name}
                onClick={() => selectFile(file.name)}
                className={`group flex items-center justify-between px-3 py-2 my-1 rounded-md cursor-pointer border transition-all duration-150 ${
                  selectedFile === file.name
                    ? "bg-[rgba(0,232,122,0.03)] border-[rgba(0,232,122,0.15)] text-white"
                    : "bg-transparent border-transparent text-[#737373] hover:text-[#d4d4d4] hover:bg-[#0b0b0b]"
                }`}
              >
                <span className="font-mono text-xs truncate flex items-center gap-2">
                  <FileText className={`w-3.5 h-3.5 flex-shrink-0 ${selectedFile === file.name ? "text-[#00e87a]" : "text-[#444]"}`} />
                  {file.name}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteFile(file.name)
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[rgba(244,63,94,0.08)] transition-all flex-shrink-0"
                >
                  <Trash2 className="w-3 h-3 text-[#f43f5e]" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Backdrop overlay curtain layer for tablet view layouts */}
        {(showLeftSidebar || showRightSidebar) && (
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => {
              setShowLeftSidebar(false)
              setShowRightSidebar(false)
            }}
          />
        )}

        {/* CENTRAL LIVE CONSOLE AND CODE TEXT EDITOR PANEL */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#050505]">
          
          {/* Top Bar Navigation Tabs Container Layout */}
          <div className="hidden lg:flex bg-[#060606] border-b border-[#121212] px-4 h-12 items-center justify-between overflow-hidden">
            <div className="flex h-full items-end gap-1 overflow-x-auto scrollbar-none">
              {files.map((f) => (
                <div
                  key={f.name}
                  onClick={() => selectFile(f.name)}
                  className={`px-4 h-9 flex items-center font-mono text-xs border-t border-x rounded-t-md cursor-pointer transition-all duration-150 whitespace-nowrap ${
                    selectedFile === f.name
                      ? "bg-[#090909] border-[#141414] text-white border-b-[#090909]"
                      : "bg-[#050505]/40 border-transparent text-[#444] hover:text-[#888] hover:bg-[#070707]"
                  }`}
                  style={{ marginBottom: "-1px" }}
                >
                  <span className={`w-1.5 h-1.5 rounded-full mr-2 ${selectedFile === f.name ? "bg-[#00e87a]" : "bg-transparent"}`} />
                  {f.name}
                </div>
              ))}
            </div>

            <button
              onClick={saveCode}
              className="h-7 px-4 bg-[#0d0d0d] border border-[#1a1a1a] hover:border-[rgba(0,232,122,0.25)] hover:bg-[rgba(0,232,122,0.03)] rounded-md font-mono text-xs text-[#666] hover:text-[#00e87a] flex items-center gap-1.5 transition-all duration-200"
            >
              <Save className="w-3 h-3" />
              <span>Save Code</span>
            </button>
          </div>

          {/* Desktop Sub-Header Interface Data Line Bar */}
          <div className="hidden lg:flex bg-[#080808] border-b border-[#111] h-8 px-4 items-center justify-between font-mono text-[10px] text-[#444]">
            <div className="flex items-center gap-2">
              <Terminal className="w-3 h-3 text-[#222]" />
              <span>FILE: {selectedFile}</span>
            </div>
            <div className="flex items-center gap-3">
              <span>Status: Connected</span>
              <span>UTF-8</span>
            </div>
          </div>

          {/* Mobile Tab Alternator Slider Menu */}
          <div className="lg:hidden bg-[#070707] border-b border-[#121212] px-4 py-2 overflow-x-auto flex gap-1.5 scrollbar-none">
            {files.map((f) => (
              <button
                key={f.name}
                onClick={() => selectFile(f.name)}
                className={`px-3 py-1 rounded font-mono text-xs border transition-all ${
                  selectedFile === f.name
                    ? "bg-[rgba(0,232,122,0.04)] border-[rgba(0,232,122,0.15)] text-[#00e87a]"
                    : "bg-[#050505] border-[#141414] text-[#555]"
                }`}
              >
                {f.name}
              </button>
            ))}
          </div>

          {/* CORE CODE COMPILATION TERMINAL FIELD EDITOR */}
          <div className="flex-1 bg-[#090909] flex relative overflow-hidden">
            {/* Structural Column Layout Line Numbers Simulation */}
            <div className="w-11 bg-[#070707] border-r border-[#121212] pt-5 flex flex-col items-center select-none font-mono text-[11px] text-[#222] leading-relaxed text-right pr-2">
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="h-6 w-full">{i + 1}</div>
              ))}
            </div>

            <textarea
              value={code}
              onChange={handleCodeChange}
              className="editor-area flex-1 p-5 text-[#d4d4d4] bg-transparent font-mono text-xs sm:text-sm leading-6 resize-none focus:outline-none overflow-y-auto"
              style={{ tabSize: 4 }}
              spellCheck={false}
              placeholder="// Start writing your code here... Changes are saved automatically."
            />
          </div>

          {/* Mobile Bottom Float Save Button Interface */}
          <div className="lg:hidden bg-[#060606] border-t border-[#121212] px-4 py-2.5">
            <button
              onClick={saveCode}
              className="w-full flex items-center justify-center gap-1.5 py-2 bg-[#00e87a] text-[#050505] font-mono text-xs font-semibold rounded-md shadow-md"
            >
              <Save className="w-4 h-4" />
              <span>Save Code</span>
            </button>
          </div>
        </div>

        {/* RIGHT TEAM ACTIVITY REAL-TIME CHANNEL RADAR SIDEBAR */}
        <div
          className={`
          fixed lg:relative inset-y-0 right-0 z-40
          w-64 bg-[#070707] border-l border-[#121212] flex flex-col
          transform transition-transform duration-200 cubic-bezier(0.16, 1, 0.3, 1)
          ${showRightSidebar ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
          mt-[53px] lg:mt-0
        `}
        >
          <div className="p-4 border-b border-[#121212] bg-[#050505]">
            <h3 className="font-mono text-xs font-semibold text-white tracking-tight flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-[#00e87a] animate-pulse" />
              Collaborators ({activeUsers.length})
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto px-2 py-3 bg-[#070707] space-y-1">
            {activeUsers.length > 0 ? (
              activeUsers.map((name, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2 bg-[#0a0a0a] border border-[#141414] rounded-md transition-all">
                  <div className="w-6 h-6 rounded bg-[#111] border border-[#222] font-mono text-[10px] font-bold text-[#00e87a] flex items-center justify-center flex-shrink-0">
                    {name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="font-mono text-xs text-[#888] truncate flex-1">{name}</span>
                  <div className="w-1.5 h-1.5 bg-[#00e87a] rounded-full animate-pulse shadow-[0_0_6px_#00e87a] flex-shrink-0" />
                </div>
              ))
            ) : (
              <div className="text-center py-12 font-mono text-xs text-[#333] flex flex-col items-center gap-2">
                <Cpu className="w-5 h-5 text-[#222]" />
                <span>No other users connected</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* FOOTER LOW-LEVEL RUNTIME ENVIRONMENT STATUS COMPONENT LINE BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#030303] border-t border-[#111] h-7 flex items-center px-5 gap-6 font-mono text-[10px] text-[#444] font-medium select-none">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#00e87a] shadow-[0_0_6px_#00e87a]" />
          <span className="truncate">Connected • Editing {selectedFile || "N/A"}</span>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-[#333]">
          <Users className="w-3 h-3 text-[#222]" />
          <span>{activeUsers.length} COLLABORATING</span>
        </div>
      </div>
    </div>
  )
}
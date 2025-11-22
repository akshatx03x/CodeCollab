"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { io } from "socket.io-client"
import toast from "react-hot-toast"
import { Save, Users, Trash2, Plus, Code2, Menu, X, FileText } from "lucide-react"
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

  const fetchProject = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        if (res.status === 401) {
          toast.error("Unauthorized, please login again")
          navigate("/login")
          return
        }
        throw new Error('Failed to fetch project')
      }
      const data = await res.json()
      setProject(data)
      const validFiles = (data.files || []).filter(f => f && typeof f === 'object' && f.name)
      setFiles(validFiles)
      if (validFiles.length > 0) {
        setSelectedFile(validFiles[0].name)
        setCode(validFiles[0].content)
      }
    } catch (error) {
      toast.error("Failed to load project")
    } finally {
      setLoading(false)
    }
  }

  const initSocket = () => {
    socketRef.current = io(API_BASE_URL)
    socketRef.current.on("connect", () => socketRef.current.emit("join-project", projectId, user?.name))

    socketRef.current.on("file-updated", (fileName: string, content: string) => {
      if (fileName === selectedFile) setCode(content)
      setFiles(prev => prev.map(f => f.name === fileName ? { ...f, content } : f))
    })

    socketRef.current.on("active-users", (users: string[]) => setActiveUsers(users))
    socketRef.current.on("user-joined", (name: string) => toast.success(`${name} joined`))
    socketRef.current.on("user-left", (name: string) => {
      setActiveUsers(prev => prev.filter(u => u !== name))
      toast(`${name} left`)
    })
  }

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value
    setCode(newCode)
    setFiles(prev => prev.map(f => f.name === selectedFile ? { ...f, content: newCode } : f))
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
    const file = files.find(f => f.name === name)
    if (file) setCode(file.content)
    setShowLeftSidebar(false) // Close sidebar on mobile after selecting
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
      setFiles(prev => [...prev, newFile])
      setSelectedFile(file.name)
      setCode(content)
      toast.success("File added")
    } catch {
      toast.error("Failed to add file")
    }
  }

  const deleteFile = async (name: string) => {
    if (files.length <= 1) return toast.error("Can't delete last file")
    try {
      await fetch(`${API_BASE_URL}/api/code/projects/${projectId}/files/${encodeURIComponent(name)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      const remaining = files.filter(f => f.name !== name)
      setFiles(remaining)
      if (selectedFile === name && remaining.length > 0) {
        setSelectedFile(remaining[0].name)
        setCode(remaining[0].content)
      }
      toast.success("File deleted")
    } catch {
      toast.error("Delete failed")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <div className="text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-sm sm:text-base">Loading project...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 bg-black" />
      <div 
        className="fixed inset-0 opacity-30"
        style={{
          backgroundImage: `linear-gradient(rgba(139, 92, 246, 0.05) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(139, 92, 246, 0.05) 1px, transparent 1px)`,
          backgroundSize: "50px 50px"
        }}
      />

      <div className="relative flex flex-col lg:flex-row h-screen">
        {/* Mobile Header */}
        <div className="lg:hidden bg-gradient-to-r from-gray-900/90 to-black/95 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex items-center justify-between relative z-50">
          <button
            onClick={() => setShowLeftSidebar(!showLeftSidebar)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            {showLeftSidebar ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center cursor-pointer"
              onClick={() => navigate("/")}
            >
              <Code2 className="w-4 h-4" />
            </div>
            <h1 className="text-base sm:text-lg font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent truncate max-w-[120px] sm:max-w-[180px]">
              {project?.name}
            </h1>
          </div>

          <button
            onClick={() => setShowRightSidebar(!showRightSidebar)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors relative"
          >
            <Users className="w-5 h-5" />
            {activeUsers.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-purple-600 rounded-full text-xs flex items-center justify-center">
                {activeUsers.length}
              </span>
            )}
          </button>
        </div>

        {/* LEFT SIDEBAR - Responsive */}
        <div className={`
          fixed lg:relative inset-y-0 left-0 z-40
          w-72 sm:w-80 lg:w-80
          bg-gradient-to-b from-gray-900/95 to-black/95 backdrop-blur-xl 
          border-r border-white/10 flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${showLeftSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          {/* Desktop Header */}
          <div className="hidden lg:block p-4 sm:p-6 border-b border-white/10">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div
                className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
                onClick={() => navigate("/")}
              >
                <Code2 className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent truncate">
                {project?.name}
              </h1>
            </div>
            <button
              onClick={addNewFile}
              className="w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-xl hover:scale-105 transition-all duration-300 shadow-lg shadow-purple-500/20 text-sm sm:text-base"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              Add File
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
          </div>

          {/* Mobile Header in Sidebar */}
          <div className="lg:hidden p-4 border-b border-white/10">
            <button
              onClick={addNewFile}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-xl hover:scale-105 transition-all duration-300 shadow-lg shadow-purple-500/20 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add File
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
          </div>

          {/* File List */}
          <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-2">
            {files.map((file) => (
              <div
                key={file.name}
                onClick={() => selectFile(file.name)}
                className={`group flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 my-1.5 sm:my-2 rounded-xl cursor-pointer transition-all duration-300 ${
                  selectedFile === file.name
                    ? "bg-gradient-to-r from-purple-600/30 to-cyan-600/30 border border-purple-500/50"
                    : "hover:bg-white/5"
                }`}
              >
                <span className="text-xs sm:text-sm font-medium truncate flex items-center gap-2">
                  <FileText className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  {file.name}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteFile(file.name)
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 sm:p-2 rounded-lg hover:bg-red-500/20 transition-opacity flex-shrink-0"
                >
                  <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 text-red-400" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Overlay for mobile sidebars */}
        {(showLeftSidebar || showRightSidebar) && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => {
              setShowLeftSidebar(false)
              setShowRightSidebar(false)
            }}
          />
        )}

        {/* MAIN EDITOR */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar - Desktop Only */}
          <div className="hidden lg:flex bg-gradient-to-r from-purple-900/20 to-cyan-900/20 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 py-3 sm:py-4 items-center justify-between overflow-x-auto">
            <div className="flex gap-1 overflow-x-auto scrollbar-hide">
              {files.map((f) => (
                <div
                  key={f.name}
                  onClick={() => selectFile(f.name)}
                  className={`px-3 sm:px-6 py-2 sm:py-3 rounded-t-xl cursor-pointer transition-all duration-300 border-x border-t border-white/10 whitespace-nowrap text-xs sm:text-base ${
                    selectedFile === f.name
                      ? "bg-gradient-to-b from-gray-900 to-black text-white border-b-0"
                      : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {f.name}
                </div>
              ))}
            </div>

            <button
              onClick={saveCode}
              className="group relative px-4 sm:px-8 py-2 sm:py-3 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-xl overflow-hidden shadow-lg shadow-purple-500/30 hover:scale-105 transition-all duration-300 ml-4 flex-shrink-0"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex items-center gap-2 font-medium text-sm sm:text-base">
                <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Save Code</span>
                <span className="sm:hidden">Save</span>
              </div>
            </button>
          </div>

          {/* Mobile File Selector */}
          <div className="lg:hidden bg-gradient-to-r from-purple-900/20 to-cyan-900/20 backdrop-blur-xl border-b border-white/10 px-4 py-2 overflow-x-auto flex gap-2 scrollbar-hide">
            {files.map((f) => (
              <button
                key={f.name}
                onClick={() => selectFile(f.name)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg whitespace-nowrap text-xs transition-all flex-shrink-0 ${
                  selectedFile === f.name
                    ? "bg-gradient-to-r from-purple-600 to-cyan-600 text-white"
                    : "bg-white/5 text-gray-400"
                }`}
              >
                {f.name}
              </button>
            ))}
          </div>

          {/* Code Editor */}
          <div className="flex-1 bg-gradient-to-br from-gray-900/50 to-black/80 backdrop-blur-xl overflow-hidden">
            <textarea
              value={code}
              onChange={handleCodeChange}
              className="w-full h-full p-4 sm:p-6 lg:p-8 text-gray-100 bg-transparent font-mono text-xs sm:text-sm lg:text-base leading-relaxed resize-none focus:outline-none"
              spellCheck={false}
              placeholder="// Start coding... Changes are live!"
            />
          </div>

          {/* Mobile Save Button */}
          <div className="lg:hidden bg-gradient-to-r from-purple-900/20 to-cyan-900/20 backdrop-blur-xl border-t border-white/10 px-4 py-3">
            <button
              onClick={saveCode}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-xl font-medium shadow-lg shadow-purple-500/30"
            >
              <Save className="w-5 h-5" />
              Save Code
            </button>
          </div>

          {/* Status Bar */}
          <div className="hidden sm:flex bg-gradient-to-r from-purple-600/20 to-cyan-600/20 backdrop-blur-xl border-t border-white/10 px-4 sm:px-8 py-2 sm:py-3 items-center justify-between text-xs sm:text-sm">
            <span className="truncate">Live Collaboration • {selectedFile}</span>
            <span className="flex-shrink-0">{activeUsers.length} Online</span>
          </div>
        </div>

        {/* RIGHT SIDEBAR - Responsive */}
        <div className={`
          fixed lg:relative inset-y-0 right-0 z-40
          w-72 sm:w-80 lg:w-80
          bg-gradient-to-b from-gray-900/95 to-black/95 backdrop-blur-xl 
          border-l border-white/10 flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${showRightSidebar ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
          mt-[57px] lg:mt-0
        `}>
          {/* Active Contributors */}
          <div className="p-4 sm:p-6 border-b border-white/10">
            <h3 className="text-xs sm:text-sm font-semibold text-purple-300 mb-3 sm:mb-4 flex items-center gap-2">
              <Users className="w-3 h-3 sm:w-4 sm:h-4" /> 
              Active Contributors ({activeUsers.length})
            </h3>
            <div className="space-y-2">
              {activeUsers.length > 0 ? (
                activeUsers.map((name, i) => (
                  <div key={i} className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 bg-white/5 rounded-lg">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {name[0].toUpperCase()}
                    </div>
                    <span className="text-xs sm:text-sm truncate flex-1">{name}</span>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse flex-shrink-0" />
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 text-xs sm:text-sm">
                  No active users
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
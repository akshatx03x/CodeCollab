"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { io } from "socket.io-client"
import toast from "react-hot-toast"
import { Save, Users, Trash2, Plus, Code2 } from "lucide-react"

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
      const res = await fetch(`http://localhost:5000/api/projects/${projectId}`, {
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
    socketRef.current = io("http://localhost:5000")
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
      await fetch(`http://localhost:5000/api/code/projects/${projectId}/files/${encodeURIComponent(selectedFile)}`, {
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
  }

  const addNewFile = () => fileInputRef.current?.click()

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const content = await file.text()
    try {
      const res = await fetch(`http://localhost:5000/api/code/projects/${projectId}/files`, {
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
      await fetch(`http://localhost:5000/api/code/projects/${projectId}/files/${encodeURIComponent(name)}`, {
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
        Loading project...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Simple Clean Background */}
      <div className="fixed inset-0 bg-black" />
      <div 
        className="fixed inset-0 opacity-30"
        style={{
          backgroundImage: `linear-gradient(rgba(139, 92, 246, 0.05) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(139, 92, 246, 0.05) 1px, transparent 1px)`,
          backgroundSize: "50px 50px"
        }}
      />

      <div className="relative flex h-screen">
        {/* LEFT SIDEBAR */}
        <div className="w-80 bg-gradient-to-b from-gray-900/90 to-black/95 backdrop-blur-xl border-r border-white/10 flex flex-col">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-10 h-10 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
                onClick={() => navigate("/")}
              >
                <Code2 className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                {project?.name}
              </h1>
            </div>
            <button
              onClick={addNewFile}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-xl hover:scale-105 transition-all duration-300 shadow-lg shadow-purple-500/20"
            >
              <Plus className="w-5 h-5" />
              Add File
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
          </div>

          <div className="flex-1 overflow-y-auto px-4">
            {files.map((file) => (
              <div
                key={file.name}
                onClick={() => selectFile(file.name)}
                className={`group flex items-center justify-between px-4 py-3 my-2 rounded-xl cursor-pointer transition-all duration-300 ${
                  selectedFile === file.name
                    ? "bg-gradient-to-r from-purple-600/30 to-cyan-600/30 border border-purple-500/50"
                    : "hover:bg-white/5"
                }`}
              >
                <span className="text-sm font-medium truncate">{file.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteFile(file.name)
                  }}
                  className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-red-500/20 transition-opacity"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* MAIN EDITOR */}
        <div className="flex-1 flex flex-col">
          {/* Top Bar */}
          <div className="bg-gradient-to-r from-purple-900/20 to-cyan-900/20 backdrop-blur-xl border-b border-white/10 px-8 py-4 flex items-center justify-between">
            <div className="flex -space-x-1">
              {files.map((f) => (
                <div
                  key={f.name}
                  onClick={() => selectFile(f.name)}
                  className={`px-6 py-3 rounded-t-xl cursor-pointer transition-all duration-300 border-x border-t border-white/10 ${
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
              className="group relative px-8 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-xl overflow-hidden shadow-lg shadow-purple-500/30 hover:scale-105 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex items-center gap-2 font-medium">
                <Save className="w-5 h-5" />
                Save Code
              </div>
            </button>
          </div>

          {/* Code Editor */}
          <div className="flex-1 bg-gradient-to-br from-gray-900/50 to-black/80 backdrop-blur-xl">
            <textarea
              value={code}
              onChange={handleCodeChange}
              className="w-full h-full p-8 text-gray-100 bg-transparent font-mono text-lg leading-relaxed resize-none focus:outline-none"
              spellCheck={false}
              placeholder="// Start coding... Changes are live!"
            />
          </div>

          {/* Status Bar */}
          <div className="bg-gradient-to-r from-purple-600/20 to-cyan-600/20 backdrop-blur-xl border-t border-white/10 px-8 py-3 flex items-center justify-between text-sm">
            <span>Live Collaboration • {selectedFile}</span>
            <span>{activeUsers.length} Online</span>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="w-80 bg-gradient-to-b from-gray-900/90 to-black/95 backdrop-blur-xl border-l border-white/10 flex flex-col">
          {/* Active Contributors */}
          <div className="p-6 border-b border-white/10">
            <h3 className="text-sm font-semibold text-purple-300 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4" /> Active Contributors ({activeUsers.length})
            </h3>
            <div className="space-y-2">
              {activeUsers.map((name, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2 bg-white/5 rounded-lg">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-full flex items-center justify-center text-xs font-bold">
                    {name[0].toUpperCase()}
                  </div>
                  <span className="text-sm">{name}</span>
                  <div className="ml-auto w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
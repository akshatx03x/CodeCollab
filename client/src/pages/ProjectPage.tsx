"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useParams } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { io } from "socket.io-client"
import toast from "react-hot-toast"
import { Save, Users, AlertCircle } from "lucide-react"

interface Project {
  _id: string
  name: string
  code: string
  language: string
  members: Array<{ _id: string; name: string }>
}

export default function ProjectPage() {
  const { projectId } = useParams()
  const [project, setProject] = useState<Project | null>(null)
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(true)
  const [activeUsers, setActiveUsers] = useState<string[]>([])
  const socketRef = useRef<any>(null)
  const { token, user } = useAuth()

  /* ---------------------------------------------------------
     Fetch Project
  --------------------------------------------------------- */
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
      const response = await fetch(
        `http://localhost:5000/api/projects/${projectId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      const data = await response.json()
      setProject(data)
      setCode(data.code)
      setLoading(false)
    } catch (error) {
      toast.error("Failed to load project")
      setLoading(false)
    }
  }

  /* ---------------------------------------------------------
     Initialize Socket
  --------------------------------------------------------- */
  const initSocket = () => {
    socketRef.current = io("http://localhost:5000")

    socketRef.current.on("connect", () => {
      socketRef.current.emit("join-project", projectId, user?.name)
    })

    socketRef.current.on("code-updated", (newCode: string) => {
      setCode(newCode)
    })

    socketRef.current.on("active-users", (users: string[]) => {
      setActiveUsers(users)
    })

    socketRef.current.on("user-joined", (userName: string) => {
      toast.success(`${userName} joined the project`)
    })

    socketRef.current.on("user-left", (userName: string) => {
      setActiveUsers(prev => prev.filter(u => u !== userName))
      toast(`${userName} left the project`)
    })
  }

  /* ---------------------------------------------------------
     Handlers
  --------------------------------------------------------- */
  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value
    setCode(newCode)
    socketRef.current?.emit("code-change", projectId, newCode)
  }

  const saveCode = async () => {
    try {
      await fetch(
        `http://localhost:5000/api/projects/${projectId}/code`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ code }),
        }
      )
      toast.success("Code saved successfully")
    } catch (error) {
      toast.error("Failed to save code")
    }
  }

  /* ---------------------------------------------------------
     Loading Screen
  --------------------------------------------------------- */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#1e1e1e] text-gray-300">
        Loading project...
      </div>
    )
  }

  /* ---------------------------------------------------------
     VS CODE UI
  --------------------------------------------------------- */
  return (
    <div className="flex min-h-screen bg-[#1e1e1e] text-gray-200">

      {/* -----------------------------------------------------
         LEFT SIDEBAR (VS CODE STYLE)
      ------------------------------------------------------- */}
      <div className="w-14 bg-[#252526] flex flex-col items-center py-4 space-y-6 border-r border-[#333]">
        <div className="w-8 h-8 bg-[#3c3c3c] rounded-md flex items-center justify-center cursor-pointer">
          <Users className="w-5 h-5 text-gray-300" />
        </div>

        <button
          onClick={saveCode}
          className="w-8 h-8 bg-[#3c3c3c] rounded-md flex items-center justify-center cursor-pointer"
        >
          <Save className="w-5 h-5 text-gray-300" />
        </button>

        <a
          href={`/project/${projectId}/issues`}
          className="w-8 h-8 bg-[#3c3c3c] rounded-md flex items-center justify-center cursor-pointer"
        >
          <AlertCircle className="w-5 h-5 text-gray-300" />
        </a>
      </div>

      {/* -----------------------------------------------------
         MAIN CONTENT AREA
      ------------------------------------------------------- */}
      <div className="flex-1 flex flex-col">

        {/* TOP BAR */}
        <div className="flex items-center justify-between bg-[#2d2d2d] px-4 py-2 border-b border-[#3b3b3b]">
          <div className="flex items-center space-x-4">
            <span className="text-lg text-white font-semibold">{project?.name}</span>
            <span className="text-xs bg-blue-600 px-2 py-0.5 rounded">JavaScript</span>
            <span className="text-xs text-gray-400">Collaboration Active</span>
          </div>

          <button
            onClick={saveCode}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Save
          </button>
        </div>

        {/* FILE TABS */}
        <div className="flex bg-[#1e1e1e] border-b border-[#3b3b3b]">
          <div className="px-4 py-2 bg-[#252526] text-white border-r border-[#3b3b3b]">
            main.js
          </div>
        </div>

        {/* -----------------------------------------------------
           EDITOR + ACTIVE USER PANEL
        ------------------------------------------------------- */}
        <div className="flex-1 flex">

          {/* TEXT EDITOR */}
          <textarea
            value={code}
            onChange={handleCodeChange}
            className="flex-1 bg-[#1e1e1e] text-gray-200 font-mono text-sm p-4 focus:outline-none resize-none"
            spellCheck="false"
          />

          {/* RIGHT SIDEBAR */}
          <div className="w-64 bg-[#252526] border-l border-[#333] p-4">
            <h3 className="text-white font-semibold mb-3">Active Users</h3>

            {activeUsers.length === 0 ? (
              <p className="text-gray-400 text-sm">No active users</p>
            ) : (
              <div className="space-y-2">
                {activeUsers.map((user, idx) => (
                  <div
                    key={idx}
                    className="bg-[#333] rounded p-2 flex items-center gap-2"
                  >
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-gray-200">{user}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* -----------------------------------------------------
           BOTTOM STATUS BAR
        ------------------------------------------------------- */}
        <div className="bg-[#007acc] text-white text-sm px-4 py-2 flex justify-between">
          <span>VS Code Mode Enabled</span>
          <span>{activeUsers.length} Active</span>
        </div>
      </div>
    </div>
  )
}

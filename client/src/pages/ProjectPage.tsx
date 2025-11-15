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
  const { token } = useAuth()

  useEffect(() => {
    fetchProject()
    initSocket()

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [projectId])

  const fetchProject = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      setProject(data)
      setCode(data.code)
      setLoading(false)
    } catch (error) {
      toast.error("Failed to load project")
      setLoading(false)
    }
  }

  const initSocket = () => {
    socketRef.current = io("http://localhost:5000")
    socketRef.current.on("connect", () => {
      socketRef.current.emit("join-project", projectId)
    })

    socketRef.current.on("code-updated", (newCode: string) => {
      setCode(newCode)
    })

    socketRef.current.on("active-users", (users: string[]) => {
      setActiveUsers(users)
    })

    socketRef.current.on("user-joined", (userId: string) => {
      toast.success(`${userId} joined the project`)
    })
  }

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value
    setCode(newCode)
    socketRef.current?.emit("code-change", projectId, newCode)
  }

  const saveCode = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/projects/${projectId}/code`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code }),
      })
      toast.success("Code saved successfully")
    } catch (error) {
      toast.error("Failed to save code")
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">{project?.name}</h1>
          <p className="text-gray-400 text-sm">JavaScript • Collaborative Editing Enabled</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-400" />
            <div className="flex -space-x-2">
              {project?.members.slice(0, 3).map((member) => (
                <div
                  key={member._id}
                  className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs"
                  title={member.name}
                >
                  {member.name[0]}
                </div>
              ))}
              {project && project.members.length > 3 && (
                <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-white text-xs">
                  +{project.members.length - 3}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={saveCode}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
          >
            <Save className="w-5 h-5" />
            Save
          </button>
          <a
            href={`/project/${projectId}/issues`}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
          >
            <AlertCircle className="w-5 h-5" />
            Issues
          </a>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex gap-6 p-6 overflow-hidden">
        <div className="flex-1 flex flex-col">
          <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg flex flex-col flex-1">
            <textarea
              value={code}
              onChange={handleCodeChange}
              className="flex-1 bg-gray-900 text-gray-100 font-mono text-sm p-4 focus:outline-none resize-none"
              placeholder="Write your code here..."
            />
          </div>
        </div>

        {/* Preview/Active Users */}
        <div className="w-64 bg-gray-800 rounded-lg p-4 shadow-lg">
          <h3 className="text-white font-bold mb-4">Active Collaborators</h3>
          {activeUsers.length === 0 ? (
            <p className="text-gray-400 text-sm">No other users connected</p>
          ) : (
            <div className="space-y-2">
              {activeUsers.map((user, idx) => (
                <div key={idx} className="bg-gray-700 rounded p-2 flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-white text-sm">{user}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

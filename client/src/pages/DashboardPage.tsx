"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import toast from "react-hot-toast"
import { Plus, Code2, Users, Sparkles, Zap, Globe, Trash2 } from "lucide-react"
import LoginModal from "../components/LoginModal"

interface Project {
  _id: string
  name: string
  description: string
  owner: { _id: string; name: string }
  members: Array<{ _id: string }>
  createdAt: string
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [projectName, setProjectName] = useState("")
  const [projectDesc, setProjectDesc] = useState("")
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [showLoginModal, setShowLoginModal] = useState(false)
  const { user, token } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    fetchProjects()

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [token])

  const fetchProjects = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/projects")
      if (response.ok) {
        const data = await response.json()
        setProjects(Array.isArray(data) ? data : [])
      } else {
        setProjects([])
      }
    } catch (error) {
      setProjects([])
      toast.error("Failed to load projects")
    }
  }

  const createProject = async () => {
    if (!projectName.trim()) {
      toast.error("Project name required")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("http://localhost:5000/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: projectName,
          description: projectDesc,
          language: "javascript",
        }),
      })
      const newProject = await response.json()
      setProjects([...projects, newProject])
      setProjectName("")
      setProjectDesc("")
      setShowCreateModal(false)
      toast.success("Project created successfully")
    } catch (error) {
      toast.error("Failed to create project")
    } finally {
      setLoading(false)
    }
  }

  const deleteProject = async (projectId: string) => {
    if (!window.confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`http://localhost:5000/api/projects/${projectId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        setProjects(projects.filter(p => p._id !== projectId))
        toast.success("Project deleted successfully")
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to delete project")
      }
    } catch (error) {
      toast.error("Failed to delete project")
    }
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute w-[800px] h-[800px] rounded-full opacity-20 blur-3xl"
          style={{
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)',
            left: `${mousePos.x - 400}px`,
            top: `${mousePos.y - 400}px`,
            transition: 'all 0.3s ease-out'
          }}
        />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '2s' }} />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(139, 92, 246, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139, 92, 246, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }} />
      </div>

      {/* Header */}
      <div className="relative border-b border-white/5 backdrop-blur-xl bg-black/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <Code2 className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                  CollabCode
                </h1>
              </div>
              {user ? (
                <p className="text-gray-400 ml-13 flex items-center gap-2 px-14">
                  Welcome back, <span className="text-purple-300 font-medium">{user.name}</span>
                </p>
              ) : (
                <p className="text-gray-400 ml-13 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  Welcome to CollabCode
                </p>
              )}
            </div>
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="group relative px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/50 hover:scale-105"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative flex items-center gap-2 text-white font-medium">
                      <Plus className="w-5 h-5" />
                      New Project
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      localStorage.removeItem("token")
                      localStorage.removeItem("user")
                      window.location.reload()
                    }}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition-all duration-300 hover:scale-105"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 rounded-xl text-white font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/50"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Projects Section */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {projects.length === 0 ? (
          <div className="text-center py-24">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-purple-600 blur-3xl opacity-30 animate-pulse" />
              <Code2 className="relative w-24 h-24 text-purple-400 mx-auto" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Your Canvas Awaits</h3>
            <p className="text-gray-400 text-lg mb-8">Start your first collaborative project and bring ideas to life</p>
            {user ? (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white transition-all duration-300 hover:scale-105"
              >
                <Zap className="w-5 h-5 text-purple-400" />
                Create Your First Project
              </button>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 rounded-xl text-white font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/50"
              >
                <Zap className="w-5 h-5" />
                Login to Get Started
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Your Projects</h2>
                <p className="text-gray-400">Collaborate, code, and create together</p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg">
                <Globe className="w-4 h-4 text-purple-400" />
                <span className="text-gray-300 text-sm">{projects.length} {projects.length === 1 ? 'Project' : 'Projects'}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project, index) => (
                <div
                  key={project._id}
                  onClick={() => {
                    if (!user) {
                      toast.error("Please login to access projects")
                      setShowLoginModal(true)
                      return
                    }
                    navigate(`/project/${project._id}`)
                  }}
                  className="group relative cursor-pointer"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Glow Effect on Hover */}
                  <div className="absolute -inset-0.5 bg-gradient-to-r rounded-2xl opacity-0 group-hover:opacity-100 blur transition-all duration-500" />
                  
                  {/* Card Content */}
                  <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 transition-all duration-300 group-hover:scale-[1.02]">
                    {/* Top Badge */}
                    <div className="absolute -top-3 -right-3 w-16 h-16 bg-gradient-to-br from-purple-600/20 to-cyan-600/20 rounded-full blur-xl" />
                    
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <Code2 className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xs text-gray-500 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                          {new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      
                      <div>
                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
                          {project.name}
                        </h3>
                        <p className="text-gray-400 text-sm line-clamp-2">
                          {project.description || "No description provided"}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-white/10">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center">
                            <Code2 className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-sm text-gray-400">
                            Created by {project.owner.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {user && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteProject(project._id)
                              }}
                              className="w-8 h-8 bg-red-500/10 hover:bg-red-500/20 rounded-lg flex items-center justify-center transition-colors"
                              title="Delete project"
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                          )}
                          <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center group-hover:bg-white/10 transition-colors">
                            <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="relative max-w-md w-full">
            {/* Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-3xl blur-xl opacity-50" />
            
            {/* Modal Content */}
            <div className="relative bg-gradient-to-br from-gray-900 to-black border border-white/20 rounded-3xl p-8 shadow-2xl">
              <div className="mb-6">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                  Create New Project
                </h2>
                <p className="text-gray-400 text-sm">Start collaborating with your team</p>
              </div>
              
              <div className="space-y-5">
                <div className="group">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Project Name</label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Enter project name"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>
                
                <div className="group">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <textarea
                    value={projectDesc}
                    onChange={(e) => setProjectDesc(e.target.value)}
                    placeholder="What's this project about?"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                    rows={3}
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white transition-all duration-300 hover:scale-105"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createProject}
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 rounded-xl text-white font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Creating...
                      </span>
                    ) : (
                      "Create Project"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </div>
  )
}

"use client"

import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import toast from "react-hot-toast"
import { Plus, Trash2, Users, ArrowRight, LayoutGrid, List, Terminal, Shield, FolderGit2, Cpu, Globe, Hash } from "lucide-react"
import LoginModal from "../components/LoginModal"
import { API_BASE_URL } from "../config/api"

interface Project {
  _id: string
  name: string
  description: string
  owner: { _id: string; name: string }
  members: Array<{ _id: string }>
  createdAt: string
}

const LANG_MAP: Record<number, string> = { 0: "typescript", 1: "python", 2: "javascript", 3: "rust", 4: "go" }
const CURSOR_COLORS = ["#00e87a", "#38bdf8", "#f43f5e", "#fbbf24", "#c084fc"]

/* ─── TINY PRIMITIVES ─── */
function TrafficLights({ active }: { active: boolean }) {
  return (
    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
      {[
        { base: "#262626", active: "#ef4444" },
        { base: "#262626", active: "#eab308" },
        { base: "#262626", active: "#00e87a" }
      ].map((color, i) => (
        <div
          key={i}
          style={{
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            background: active ? color.active : color.base,
            transition: "background 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      ))}
    </div>
  )
}

function CursorDots({ count }: { count: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "5px", background: "#0d0d0d", padding: "4px 10px", borderRadius: "20px", border: "1px solid #141414" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
        {CURSOR_COLORS.slice(0, count).map((c, i) => (
          <div key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", background: c, boxShadow: `0 0 8px ${c}` }} />
        ))}
      </div>
      <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "10px", color: "#666", fontWeight: 500 }}>
        {count} active
      </span>
    </div>
  )
}

function DatePill({ date }: { date: string }) {
  const d = new Date(date)
  const str = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })
  return (
    <span style={{
      fontFamily: "JetBrains Mono, monospace", fontSize: "10px",
      color: "#00e87a", background: "rgba(0, 232, 122, 0.03)",
      border: "1px solid rgba(0, 232, 122, 0.15)", padding: "3px 10px", borderRadius: "4px",
      letterSpacing: "-0.01em"
    }}>
      {str}
    </span>
  )
}

/* ─── PROJECT CARD ─── */
function ProjectCard({
  project, index, user, onDelete, onClick,
}: {
  project: Project; index: number; user: any; onDelete: (id: string) => void; onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const lang = LANG_MAP[index % 5] ?? "javascript"
  const cursorCount = (index % 3) + 1

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "#0c0c0c" : "#0a0a0a",
        border: `1px solid ${hovered ? "rgba(0, 232, 122, 0.25)" : "#161616"}`,
        borderRadius: "12px",
        overflow: "hidden",
        cursor: "pointer",
        transform: hovered ? "translateY(-4px)" : "none",
        boxShadow: hovered ? "0 12px 30px -10px rgba(0,0,0,0.7), 0 0 20px -5px rgba(0, 232, 122, 0.05)" : "none",
        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        display: "flex",
        flexDirection: "column",
        height: "210px"
      }}
    >
      {/* Window Header */}
      <div style={{
        background: "#060606", borderBottom: "1px solid #121212",
        height: "40px", display: "flex", alignItems: "center",
        justifyContent: "space-between", padding: "0 16px",
      }}>
        <TrafficLights active={hovered} />
        <CursorDots count={cursorCount} />
      </div>

      {/* Main Context */}
      <div style={{ padding: "20px", display: "flex", flexDirection: "column", flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
          <Terminal size={12} color={hovered ? "#00e87a" : "#444"} style={{ transition: "color 0.2s" }} />
          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "10px", color: hovered ? "#00e87a" : "#555", letterSpacing: ".05em", transition: "color 0.2s" }}>
            {lang}.config
          </div>
        </div>

        <h3 style={{
          fontFamily: "JetBrains Mono, monospace", fontSize: "15px",
          fontWeight: 600, color: hovered ? "#fff" : "#d4d4d4", margin: "0 0 8px",
          letterSpacing: "-.02em", display: "flex", alignItems: "center", gap: "4px",
          transition: "color 0.2s"
        }}>
          {project.name}
          {hovered && <span style={{ color: "#00e87a", fontWeight: 400, animation: "blink 1s step-end infinite" }}>▋</span>}
        </h3>

        <p style={{
          fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#737373",
          margin: "0 0 16px", lineHeight: "1.6", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
          flex: 1
        }}>
          {project.description || "System container initialized without secondary documentation overrides."}
        </p>

        {/* Card Footer */}
        <div style={{ borderTop: "1px solid #121212", paddingTop: "14px", display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
          <div>
            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "9px", color: "#444", textTransform: "uppercase", letterSpacing: "0.05em" }}>Host Node</div>
            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "11px", color: "#888", fontWeight: 500 }}>{project.owner?.name ?? "root"}</div>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <DatePill date={project.createdAt} />
            {user && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(project._id) }}
                style={{
                  width: "28px", height: "28px", borderRadius: "6px",
                  border: "1px solid #1a1a1a", background: "#0d0d0d",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", color: "#555", transition: "all 0.2s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#f43f5e"; e.currentTarget.style.borderColor = "rgba(244,63,94,0.2)"; e.currentTarget.style.background = "rgba(244,63,94,0.02)" }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#555"; e.currentTarget.style.borderColor = "#1a1a1a"; e.currentTarget.style.background = "#0d0d0d" }}
                title="Terminate Node Assembly"
              >
                <Trash2 size={12} />
              </button>
            )}
            <div style={{
              width: "28px", height: "28px", borderRadius: "6px",
              border: `1px solid ${hovered ? "rgba(0, 232, 122, 0.2)" : "#1a1a1a"}`, 
              background: hovered ? "rgba(0, 232, 122, 0.04)" : "#0d0d0d",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: hovered ? "#00e87a" : "#555",
              transition: "all 0.2s",
            }}>
              <ArrowRight size={13} style={{ transform: hovered ? "translateX(2px)" : "none", transition: "transform 0.2s" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── MODAL ─── */
function CreateModal({
  onClose, onCreate,
}: { onClose: () => void; onCreate: (name: string, desc: string) => Promise<void> }) {
  const [name, setName] = useState("")
  const [desc, setDesc] = useState("")
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const handle = async () => {
    if (!name.trim()) { toast.error("Project identity key required"); return }
    setLoading(true)
    await onCreate(name.trim(), desc)
    setLoading(false)
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "#050505",
    border: "1px solid #1c1c1c", borderRadius: "6px",
    padding: "11px 14px",
    fontFamily: "JetBrains Mono, monospace", fontSize: "12px", color: "#e0e0e0",
    outline: "none", transition: "all .2s ease",
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(4,4,4,0.85)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: "24px",
        animation: "fadeIn 0.2s ease"
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: "#0a0a0a", border: "1px solid #1c1c1c",
        borderRadius: "14px", width: "100%", maxWidth: "440px",
        overflow: "hidden", animation: "slideUp .25s cubic-bezier(0.16, 1, 0.3, 1)",
        boxShadow: "0 30px 60px -15px rgba(0,0,0,0.9), 0 0 50px 0 rgba(0,0,0,0.5)"
      }}>
        {/* Modal Window Header */}
        <div style={{
          background: "#060606", borderBottom: "1px solid #141414",
          height: "44px", display: "flex", alignItems: "center",
          justifyContent: "space-between", padding: "0 16px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#00e87a", boxShadow: "0 0 8px #00e87a" }} />
            <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "11px", color: "#555", fontWeight: 500 }}>
              initialize_node.sh
            </span>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: "18px", display: "flex", alignItems: "center", transition: "color .15s" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#444")}
          >×</button>
        </div>

        <div style={{ padding: "28px" }}>
          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "16px", fontWeight: 600, color: "#fff", marginBottom: "6px", letterSpacing: "-0.01em" }}>
            Add Project Details
          </div>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#666", marginBottom: "24px", lineHeight: "1.5" }}>
            
          </div>

          <label style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "10px", color: "#555", display: "block", marginBottom: "8px", textTransform: "uppercase", letterSpacing: ".05em" }}>
            Project Name
          </label>
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handle()}
            placeholder="e.g., HelloWorld!!!"
            style={inputStyle}
            onFocus={(e) => { e.target.style.borderColor = "#00e87a"; e.target.style.boxShadow = "0 0 15px -3px rgba(0,232,122,0.15)" }}
            onBlur={(e) => { e.target.style.borderColor = "#1c1c1c"; e.target.style.boxShadow = "none" }}
          />

          <label style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "10px", color: "#555", display: "block", margin: "18px 0 8px", textTransform: "uppercase", letterSpacing: ".05em" }}>
            Description <span style={{ color: "#333" }}>(Optional)</span>
          </label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Enter Description"
            rows={3}
            style={{ ...inputStyle, resize: "none" }}
            onFocus={(e) => { e.target.style.borderColor = "#00e87a"; e.target.style.boxShadow = "0 0 15px -3px rgba(0,232,122,0.15)" }}
            onBlur={(e) => { e.target.style.borderColor = "#1c1c1c"; e.target.style.boxShadow = "none" }}
          />

          <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
            <button
              onClick={onClose}
              style={{
                flex: 1, background: "transparent",
                border: "1px solid #1c1c1c", borderRadius: "6px",
                padding: "11px", fontFamily: "JetBrains Mono, monospace",
                fontSize: "12px", color: "#666", cursor: "pointer", transition: "all .15s", fontWeight: 500
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "#444"; e.currentTarget.style.background = "#0f0f0f" }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#666"; e.currentTarget.style.borderColor = "#1c1c1c"; e.currentTarget.style.background = "transparent" }}
            >
              abort
            </button>
            <button
              onClick={handle}
              disabled={loading || !name.trim()}
              style={{
                flex: 1,
                background: loading || !name.trim() ? "#07140c" : "#00e87a",
                border: "none", borderRadius: "6px",
                padding: "11px", fontFamily: "JetBrains Mono, monospace",
                fontSize: "12px", fontWeight: 600,
                color: loading || !name.trim() ? "#0f331b" : "#050505",
                cursor: loading || !name.trim() ? "not-allowed" : "pointer",
                transition: "all .2s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                boxShadow: loading || !name.trim() ? "none" : "0 4px 20px rgba(0, 232, 122, 0.2)"
              }}
            >
              {loading ? (
                <><span style={{ animation: "blink .8s step-end infinite" }}>▋</span> Adding...</>
              ) : " Add"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── MAIN DASHBOARD ─── */
export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [view, setView] = useState<"grid" | "list">("grid")
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const { user, token } = useAuth()
  const navigate = useNavigate()

  useEffect(() => { fetchProjects() }, [token])

  // Track cursor coordinates globally for real-time backdrop matrix glow glow logic
  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY })
  }

  async function fetchProjects() {
    try {
      const r = await fetch(`${API_BASE_URL}/api/projects`)
      if (r.ok) { const d = await r.json(); setProjects(Array.isArray(d) ? d : []) }
      else setProjects([])
    } catch { setProjects([]); toast.error("Hardware configuration pipeline interrupted link.") }
  }

  async function handleCreate(name: string, desc: string) {
    try {
      const r = await fetch(`${API_BASE_URL}/api/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, description: desc, language: "javascript" }),
      })
      const proj = await r.json()
      setProjects((p) => [...p, proj])
      setShowCreate(false)
      toast.success("Runtime module allocated successfully")
    } catch { toast.error("Deployment failed injection error.") }
  }

  async function deleteProject(id: string) {
    if (!window.confirm("Perform hard deletion protocol on this ecosystem container node? This state path is unrecoverable.")) return
    try {
      const r = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      })
      if (r.ok) { setProjects((p) => p.filter((x) => x._id !== id)); toast.success("Node unallocated from configuration index.") }
      else { const e = await r.json(); toast.error(e.message ?? "Purge sequence rejected.") }
    } catch { toast.error("Interface link loss inside purge operations.") }
  }

  function handleCardClick(project: Project) {
    if (!user) { toast.error("Auth token mismatch. Please Try Logging In."); setShowLogin(true); return }
    navigate(`/project/${project._id}`)
  }

  return (
    <div 
      onMouseMove={handleMouseMove}
      style={{ minHeight: "100vh", background: "#050505", color: "#d4d4d4", position: "relative", overflowX: "hidden" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Inter', sans-serif; }
        @keyframes blink { 0%, 100% { opacity: 1 } 50% { opacity: 0 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #050505; }
        ::-webkit-scrollbar-thumb { background: #161616; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #222; }
      `}</style>

      {/* Interactive Matrix Dynamic Spotlight System Grid Overlay */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: "linear-gradient(rgba(255,255,255,0.007) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.007) 1px, transparent 1px)",
        backgroundSize: "56px 56px",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        WebkitMaskImage: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, black 20%, transparent 100%)`,
        maskImage: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, black 20%, transparent 100%)`,
        transition: "mask-image 0.1s ease",
      }} />

      {/* Top Header Layer */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(5,5,5,0.75)", borderBottom: "1px solid #121212",
        backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)"
      }}>
        <div style={{ maxWidth: "1240px", margin: "0 auto", padding: "0 24px", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          
          {/* Brand Engine Label */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#00e87a", boxShadow: "0 0 10px #00e87a" }} />
              <div style={{ position: "absolute", width: "16px", height: "16px", borderRadius: "50%", border: "1px solid rgba(0, 232, 122, 0.2)", animation: "blink 2s infinite ease-in-out" }} />
            </div>
            <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "24px", fontWeight: 700, letterSpacing: "-0.03em", color: "#fff" }}>
              Code<span style={{ color: "#00e87a" }}>Collab</span>
            </span>
            {user && (
              <div style={{ display: "flex", alignItems: "center", gap: "4px", background: "#0f0f0f", padding: "2px 8px", borderRadius: "4px", border: "1px solid #161616", marginLeft: "4px" }}>
                <FolderGit2 size={10} color="#444" />
                <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "10px", color: "#666" }}>
                  ~/{user.name.toLowerCase().replace(/\s+/g, "")}
                </span>
              </div>
            )}
          </div>

          {/* Action Operations Control Block */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {user ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "5px 12px", border: "1px solid #141414", borderRadius: "6px", background: "#0a0a0a" }}>
                  <div style={{
                    width: "20px", height: "20px", borderRadius: "4px",
                    background: "rgba(0,232,122,0.05)", border: "1px solid rgba(0,232,122,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "JetBrains Mono, monospace", fontSize: "9px", color: "#00e87a", fontWeight: 700,
                  }}>
                    {user.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "11px", color: "#777", fontWeight: 500 }}>{user.name}</span>
                </div>

                <button
                  onClick={() => setShowCreate(true)}
                  style={{
                    background: "#00e87a", border: "none", borderRadius: "6px",
                    padding: "7px 14px", fontFamily: "JetBrains Mono, monospace",
                    fontSize: "11px", fontWeight: 600, color: "#050505",
                    cursor: "pointer", display: "flex", alignItems: "center", gap: "6px",
                    transition: "all 0.2s ease",
                    boxShadow: "0 4px 15px rgba(0, 232, 122, 0.15)"
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#1affaa"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0, 232, 122, 0.3)" }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#00e87a"; e.currentTarget.style.boxShadow = "0 4px 15px rgba(0, 232, 122, 0.15)" }}
                >
                  <Plus size={13} strokeWidth={2.5} /> Add project
                </button>

                <button
                  onClick={() => { localStorage.removeItem("token"); localStorage.removeItem("user"); window.location.reload() }}
                  style={{
                    background: "transparent", border: "1px solid #161616", borderRadius: "6px",
                    padding: "7px 12px", fontFamily: "JetBrains Mono, monospace",
                    fontSize: "11px", color: "#555", cursor: "pointer", transition: "all .15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "#333"; e.currentTarget.style.background = "#0d0d0d" }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#555"; e.currentTarget.style.borderColor = "#161616"; e.currentTarget.style.background = "transparent" }}
                >
                  disconnect
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                style={{
                  background: "#00e87a", border: "none", borderRadius: "6px",
                  padding: "8px 16px", fontFamily: "JetBrains Mono, monospace",
                  fontSize: "11px", fontWeight: 600, color: "#050505", cursor: "pointer",
                  boxShadow: "0 4px 15px rgba(0, 232, 122, 0.15)"
                }}
              >
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container Workspace Frame */}
      <main style={{ position: "relative", zIndex: 10, maxWidth: "1240px", margin: "0 auto", padding: "48px 24px 100px" }}>
        {projects.length === 0 ? (
          
          /* CRITICAL / NO DEPLOYED TARGETS EMPTY PATH */
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", animation: "fadeIn .4s cubic-bezier(0.16, 1, 0.3, 1)" }}>
            <div style={{
              background: "#0a0a0a", border: "1px solid #141414",
              borderRadius: "14px", padding: "44px", maxWidth: "420px", width: "100%",
              boxShadow: "0 20px 40px -15px rgba(0,0,0,0.8)"
            }}>
              {/* Decorative Dev Screen Mock */}
              <div style={{ background: "#050505", border: "1px solid #161616", borderRadius: "8px", padding: "14px", marginBottom: "24px" }}>
                <div style={{ display: "flex", gap: "5px", marginBottom: "10px" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#333" }} />
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#333" }} />
                </div>
                <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "11px", marginBottom: "4px" }}>
                  <span style={{ color: "#00e87a" }}>$ </span>
                  <span style={{ color: "#888" }}>find /dev/env -type cluster</span>
                </div>
                <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "11px", color: "#3a3a3a" }}>
                  System call returned: 0 data environments structured.
                </div>
              </div>

              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "15px", fontWeight: 600, color: "#fff", marginBottom: "8px" }}>
                Provision Workspace Cluster
              </div>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#666", lineHeight: 1.6, marginBottom: "24px" }}>
                No synced virtual engines linked to current account path matrix. Establish a structural initialization script module.
              </div>

              {user ? (
                <button
                  onClick={() => setShowCreate(true)}
                  style={{
                    background: "#00e87a", border: "none", borderRadius: "6px",
                    padding: "10px 20px", fontFamily: "JetBrains Mono, monospace",
                    fontSize: "12px", fontWeight: 600, color: "#050505",
                    cursor: "pointer", display: "flex", alignItems: "center", gap: "6px",
                    boxShadow: "0 4px 15px rgba(0, 232, 122, 0.15)"
                  }}
                >
                  <Plus size={14} strokeWidth={2.5} /> Execute Init Routine
                </button>
              ) : (
                <button
                  onClick={() => setShowLogin(true)}
                  style={{
                    background: "#00e87a", border: "none", borderRadius: "6px",
                    padding: "10px 20px", fontFamily: "JetBrains Mono, monospace",
                    fontSize: "12px", fontWeight: 600, color: "#050505", cursor: "pointer",
                  }}
                >
                  Authenticate Key Allocation
                </button>
              )}
            </div>
          </div>
        ) : (
          <div style={{ animation: "fadeIn .3s ease" }}>
            
            {/* Context Section Parameter Actions Layout Header */}
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "32px", borderBottom: "1px solid #121212", paddingBottom: "16px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                  <Hash size={12} color="#00e87a" />
                  <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "11px", color: "#00e87a", letterSpacing: ".04em" }}>
                    Ready To Collaborate?
                  </div>
                </div>
                <h1 style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "20px", fontWeight: 700, color: "#fff", margin: 0, letterSpacing: "-.03em" }}>
                  Active Instances
                </h1>
              </div>

              {/* Functional Display Toggles Configuration */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ display: "flex", background: "#0b0b0b", padding: "3px", borderRadius: "8px", border: "1px solid #141414" }}>
                  {[
                    { mode: "grid" as const, icon: <LayoutGrid size={13} /> },
                    { mode: "list" as const, icon: <List size={13} /> },
                  ].map(({ mode, icon }) => (
                    <button
                      key={mode}
                      onClick={() => setView(mode)}
                      style={{
                        width: "32px", height: "32px",
                        borderRadius: "6px",
                        border: "none",
                        background: view === mode ? "#111111" : "transparent",
                        color: view === mode ? "#00e87a" : "#444",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", transition: "all .15s",
                      }}
                    >
                      {icon}
                    </button>
                  ))}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "0 12px", border: "1px solid #141414", borderRadius: "8px", background: "#0b0b0b", height: "38px" }}>
                  <Users size={12} color="#444" />
                  <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "11px", color: "#666", fontWeight: 500 }}>
                    {projects.length} nodes
                  </span>
                </div>
              </div>
            </div>

            {/* Render Context Blocks depending on active configuration layer setting */}
            {view === "grid" ? (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))",
                gap: "16px",
              }}>
                {projects.map((p, i) => (
                  <ProjectCard key={p._id} project={p} index={i} user={user} onDelete={deleteProject} onClick={() => handleCardClick(p)} />
                ))}
                
                {/* Phantom Ghost Virtual Deploy Card */}
                <div
                  onClick={() => user ? setShowCreate(true) : setShowLogin(true)}
                  style={{
                    border: "1px dashed #1c1c1c", borderRadius: "12px",
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    height: "210px", cursor: "pointer",
                    background: "transparent",
                    transition: "all .2s ease-in-out",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(0,232,122,0.3)"; e.currentTarget.style.background = "#070707" }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1c1c1c"; e.currentTarget.style.background = "transparent" }}
                >
                  <div style={{ padding: "8px", borderRadius: "50%", background: "#0a0a0a", border: "1px solid #141414", marginBottom: "8px" }}>
                    <Plus size={16} color="#444" />
                  </div>
                  <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "11px", color: "#444", fontWeight: 500 }}>allocate_new_node</span>
                </div>
              </div>
            ) : (
              
              /* HIGH DENSITY EXPANDED DATA SYSTEM VIEW LIST */
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {projects.map((p, i) => {
                  const lang = LANG_MAP[i % 5] ?? "javascript"
                  return (
                    <div
                      key={p._id}
                      onClick={() => handleCardClick(p)}
                      style={{
                        display: "flex", alignItems: "center", gap: "20px",
                        padding: "14px 20px", background: "#0a0a0a",
                        border: "1px solid #141414", borderRadius: "8px",
                        cursor: "pointer", transition: "all .15s ease",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(0,232,122,0.2)"; e.currentTarget.style.background = "#0c0c0c" }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#141414"; e.currentTarget.style.background = "#0a0a0a" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: "110px" }}>
                        <Cpu size={11} color="#333" />
                        <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "11px", color: "#00e87a" }}>
                          {lang}
                        </span>
                      </div>
                      
                      <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "14px", color: "#fff", fontWeight: 600, flex: 1 }}>
                        {p.name}
                      </span>
                      
                      <span style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#555", flex: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.description || "System data frame array parameters operating nominal configuration settings status block."}
                      </span>
                      
                      <DatePill date={p.createdAt} />
                      
                      {user && (
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteProject(p._id) }}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#444", padding: "6px", display: "flex", alignItems: "center", transition: "color .15s" }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "#f43f5e")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "#444")}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                      <ArrowRight size={13} color="#333" />
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Persistent Low-Level Cloud Infrastructure Status Metrics Bar */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
        background: "#030303", borderTop: "1px solid #111",
        height: "28px", display: "flex", alignItems: "center", padding: "0 20px", gap: "24px",
      }}>
        {[
          { dot: true, label: "SYS_STATUS: ONLINE", color: "#00e87a" },
          { label: "CORE: ISO_8859-1", icon: <Globe size={10} color="#333" /> },
          { label: "PROTOCOL: SSH_V2", icon: <Shield size={10} color="#333" /> },
        ].map(({ dot, label, color, icon }, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {dot && <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: color || "#00e87a", boxShadow: `0 0 6px ${color}` }} />}
            {icon && icon}
            <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "10px", color: "#444", fontWeight: 500, letterSpacing: "0.02em" }}>{label}</span>
          </div>
        ))}
        <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "10px", color: "#333", marginLeft: "auto", fontWeight: 500 }}>
          [ {projects.length} ] ENV MAPPED
        </span>
      </div>

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
      {showLogin && <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />}
    </div>
  )
}
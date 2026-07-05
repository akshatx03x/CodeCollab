"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "../context/AuthContext"
import toast from "react-hot-toast"
import { Users, Plus, Mail, X, Terminal, FolderGit2, Layers, Cpu } from "lucide-react"
import { API_BASE_URL } from "../config/api"

interface Team {
  _id: string
  name: string
  description: string
  owner: { name: string }
  members: Array<{ name: string }>
  projects: Array<{ _id: string; name: string }>
}

export default function TeamPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [teamName, setTeamName] = useState("")
  const [teamDesc, setTeamDesc] = useState("")
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [memberEmail, setMemberEmail] = useState("")
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const { token } = useAuth()

  useEffect(() => {
    fetchTeams()
  }, [])

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY })
  }

  const fetchTeams = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/teams`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      setTeams(Array.isArray(data) ? data : [])
      setLoading(false)
    } catch (error) {
      toast.error("Failed to load teams. Please try again.")
      setLoading(false)
    }
  }

  const createTeam = async () => {
    if (!teamName.trim()) {
      toast.error("Team name required")
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/teams`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: teamName,
          description: teamDesc,
        }),
      })
      const newTeam = await response.json()
      setTeams([...teams, newTeam])
      setTeamName("")
      setTeamDesc("")
      setShowCreateModal(false)
      toast.success("Team created successfully")
    } catch (error) {
      toast.error("Failed to create team")
    }
  }

  const addMember = async (teamId: string) => {
    if (!memberEmail.trim()) {
      toast.error("Email address is required")
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userEmail: memberEmail }),
      })
      const updated = await response.json()
      setTeams(teams.map((t) => (t._id === teamId ? updated : t)))
      setMemberEmail("")
      setSelectedTeam(null)
      toast.success("Member added successfully")
    } catch (error) {
      toast.error("Failed to add member")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050505] font-mono text-xs text-[#00e87a]">
        <span className="animate-pulse mr-2">▋</span> Loading teams...
      </div>
    )
  }

  return (
    <div 
      onMouseMove={handleMouseMove}
      className="min-h-screen bg-[#050505] text-[#d4d4d4] relative overflow-x-hidden font-sans"
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');
        @keyframes blink { 0%, 100% { opacity: 1 } 50% { opacity: 0 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        .glow-input::placeholder { color: #333 !important; }
      `}</style>

      {/* Interactive Grid Overlay to match dashboard background */}
      <div 
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.007) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.007) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          backgroundPosition: "center",
          WebkitMaskImage: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, black 20%, transparent 100%)`,
          maskImage: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, black 20%, transparent 100%)`,
          transition: "mask-image 0.1s ease",
        }} 
      />

      {/* Sticky App Header */}
      <header className="sticky top-0 z-40 bg-[#050505]/75 border-b border-[#121212] backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-[#00e87a] shadow-[0_0_10px_#00e87a]" />
            </div>
            <span className="font-mono text-sm font-bold tracking-tight text-white">
              Code<span className="text-[#00e87a]">Collab</span>
            </span>
            <div className="flex items-center gap-1 bg-[#0f0f0f] px-2 py-0.5 rounded border border-[#161616] ml-1 font-mono text-[10px] text-[#666]">
              <FolderGit2 className="w-2.5 h-2.5" />
              <span>~/teams</span>
            </div>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#00e87a] hover:bg-[#1affaa] text-[#050505] font-mono text-xs font-semibold px-3.5 py-1.5 rounded-md flex items-center gap-1.5 transition-all duration-200 shadow-[0_4px_15px_rgba(0,232,122,0.15)] hover:shadow-[0_4px_20px_rgba(0,232,122,0.3)]"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} /> New Team
          </button>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        
        {/* Dynamic Title Section */}
        <div className="flex items-end justify-between mb-8 border-b border-[#121212] pb-4">
          <div>
            <div className="flex items-center gap-1.5 mb-1 font-mono text-[11px] text-[#00e87a] tracking-wider">
              <span>//</span> Team Directory
            </div>
            <h1 className="font-mono text-xl font-bold text-white tracking-tight">
              Your Teams
            </h1>
          </div>
          <div className="flex items-center gap-1.5 px-3 bg-[#0b0b0b] border border-[#141414] rounded-lg h-9 font-mono text-xs text-[#666]">
            <Users className="w-3.5 h-3.5" />
            <span>{teams.length} active</span>
          </div>
        </div>

        {/* Empty Slate Display State */}
        {teams.length === 0 ? (
          <div className="flex items-center justify-center min-h-[45vh] animate-in fade-in duration-300">
            <div className="bg-[#0a0a0a] border border-[#141414] rounded-xl p-10 max-w-md w-full text-center shadow-[0_20px_40px_-15px_rgba(0,0,0,0.8)]">
              <div className="bg-[#050505] border border-[#161616] rounded-lg p-3 max-w-[60px] mx-auto mb-5 flex items-center justify-center">
                <Users className="w-6 h-6 text-[#333]" />
              </div>
              <div className="font-mono text-sm font-semibold text-white mb-2">No Teams Found</div>
              <p className="text-xs text-[#666] leading-relaxed mb-6">
                You are not a member of any teams yet. Create a new team or ask to be invited to start collaborating.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-[#00e87a] text-[#050505] font-mono text-xs font-semibold px-4 py-2 rounded-md inline-flex items-center gap-1.5 transition shadow-[0_4px_15px_rgba(0,232,122,0.15)] mx-auto"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={2.5} /> Create a Team
              </button>
            </div>
          </div>
        ) : (
          /* Grid View Grid Matrix Display */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teams.map((team) => (
              <div 
                key={team._id} 
                className="group bg-[#0a0a0a] border border-[#161616] hover:border-[rgba(0,232,122,0.25)] rounded-xl overflow-hidden transition-all duration-200 flex flex-col justify-between h-[210px] hover:-translate-y-1 hover:shadow-[0_12px_30px_-10px_rgba(0,0,0,0.7),0_0_20px_-5px_rgba(0,232,122,0.05)]"
              >
                {/* Simulated Window Frame Header bar */}
                <div className="bg-[#060606] border-b border-[#121212] h-9 px-4 flex items-center justify-between">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#262626] group-hover:bg-[#ef4444] transition-colors" />
                    <div className="w-2 h-2 rounded-full bg-[#262626] group-hover:bg-[#eab308] transition-colors" />
                    <div className="w-2 h-2 rounded-full bg-[#262626] group-hover:bg-[#00e87a] transition-colors" />
                  </div>
                  <div className="flex items-center gap-1 font-mono text-[10px] text-[#444] group-hover:text-[#555]">
                    <Terminal className="w-2.5 h-2.5" />
                    <span>manifest.json</span>
                  </div>
                </div>

                {/* Team Card Main Space Content */}
                <div className="p-5 flex flex-col flex-1 justify-between">
                  <div>
                    <h3 className="font-mono text-sm font-bold text-[#d4d4d4] group-hover:text-white transition-colors flex items-center gap-1">
                      {team.name}
                      <span className="text-[#00e87a] font-normal hidden group-hover:inline animate-[blink_1s_step-end_infinite]">▋</span>
                    </h3>
                    <p className="text-xs text-[#737373] mt-1.5 line-clamp-2 leading-relaxed">
                      {team.description || "No team description provided."}
                    </p>
                  </div>

                  {/* Operational Data Parameters Layer */}
                  <div className="border-t border-[#121212] pt-3.5 flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-4 font-mono text-[11px] text-[#555]">
                      <div className="flex items-center gap-1">
                        <Cpu className="w-3 h-3 text-[#333]" />
                        <span><strong className="text-[#888] font-medium">{team.members.length}</strong> members</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Layers className="w-3 h-3 text-[#333]" />
                        <span><strong className="text-[#888] font-medium">{team.projects.length}</strong> projects</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedTeam(team)}
                      className="h-7 px-3 bg-[#0d0d0d] border border-[#1a1a1a] hover:border-[rgba(0,232,122,0.2)] hover:bg-[rgba(0,232,122,0.04)] rounded-md font-mono text-[11px] text-[#666] hover:text-[#00e87a] flex items-center gap-1.5 transition-all duration-200"
                    >
                      <Mail className="w-3 h-3" />
                      <span>Invite</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* INITIALIZE NEW TEAM POPUP MODAL SCREEN OVERLAY */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#0a0a0a] border border-[#1c1c1c] rounded-xl max-w-sm w-full overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.9)] animate-in slide-in-from-bottom-3 duration-200">
            {/* Header title */}
            <div className="bg-[#060606] border-b border-[#141414] h-11 px-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#00e87a] shadow-[0_0_8px_#00e87a]" />
                <span className="font-mono text-[11px] text-[#555] font-medium">Create Team</span>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-[#444] hover:text-white transition p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Inputs Body form */}
            <div className="p-6">
              <h2 className="font-mono text-sm font-bold text-white mb-1">Create a Team</h2>
              <p className="text-xs text-[#666] leading-relaxed mb-5">Create a team to collaborate with other developers on projects.</p>
              
              <label className="font-mono text-[10px] text-[#555] block mb-1.5 tracking-wider uppercase">Team Name</label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g., frontend-team"
                className="glow-input w-full px-3.5 py-2.5 bg-[#050505] border border-[#1c1c1c] rounded-md font-mono text-xs text-white placeholder-[#222] focus:outline-none focus:border-[#00e87a] focus:shadow-[0_0_15px_-3px_rgba(0,232,122,0.15)] transition-all mb-4"
                required
              />

              <label className="font-mono text-[10px] text-[#555] block mb-1.5 tracking-wider uppercase">Description</label>
              <textarea
                value={teamDesc}
                onChange={(e) => setTeamDesc(e.target.value)}
                placeholder="Enter team description..."
                className="glow-input w-full px-3.5 py-2.5 bg-[#050505] border border-[#1c1c1c] rounded-md font-mono text-xs text-white placeholder-[#222] focus:outline-none focus:border-[#00e87a] focus:shadow-[0_0_15px_-3px_rgba(0,232,122,0.15)] transition-all resize-none mb-5"
                rows={3}
              />

              <div className="flex gap-2.5">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 border border-[#1c1c1c] rounded-md font-mono text-xs text-[#666] hover:text-white hover:bg-[#0f0f0f] hover:border-[#444] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={createTeam}
                  className="flex-1 py-2 bg-[#00e87a] hover:bg-[#1affaa] text-[#050505] font-mono text-xs font-semibold rounded-md transition shadow-[0_4px_15px_rgba(0,232,122,0.15)]"
                >
                  Create Team
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MEMBER INVITE MODAL CONTAINER SCREEN OVERLAY */}
      {selectedTeam && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#0a0a0a] border border-[#1c1c1c] rounded-xl max-w-sm w-full overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.9)] animate-in slide-in-from-bottom-3 duration-200">
            {/* Header title */}
            <div className="bg-[#060606] border-b border-[#141414] h-11 px-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#00e87a] shadow-[0_0_8px_#00e87a]" />
                <span className="font-mono text-[11px] text-[#555] font-medium">Invite Member</span>
              </div>
              <button onClick={() => setSelectedTeam(null)} className="text-[#444] hover:text-white transition p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form body container */}
            <div className="p-6">
              <h2 className="font-mono text-sm font-bold text-white mb-1">Invite a Collaborator</h2>
              <p className="text-xs text-[#666] leading-relaxed mb-5">
                Add a user to the team by their email address.
              </p>
              
              <label className="font-mono text-[10px] text-[#555] block mb-1.5 tracking-wider uppercase">Email Address</label>
              <input
                type="email"
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                placeholder="collaborator@example.com"
                className="glow-input w-full px-3.5 py-2.5 bg-[#050505] border border-[#1c1c1c] rounded-md font-mono text-xs text-white placeholder-[#222] focus:outline-none focus:border-[#00e87a] focus:shadow-[0_0_15px_-3px_rgba(0,232,122,0.15)] transition-all mb-5"
                required
              />

              <div className="flex gap-2.5">
                <button
                  onClick={() => setSelectedTeam(null)}
                  className="flex-1 py-2 border border-[#1c1c1c] rounded-md font-mono text-xs text-[#666] hover:text-white hover:bg-[#0f0f0f] hover:border-[#444] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => addMember(selectedTeam._id)}
                  className="flex-1 py-2 bg-[#00e87a] hover:bg-[#1affaa] text-[#050505] font-mono text-xs font-semibold rounded-md transition shadow-[0_4px_15px_rgba(0,232,122,0.15)]"
                >
                  Invite Member
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Base Status Metric Information Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#030303] border-t border-[#111] h-7 flex items-center px-5 gap-6 font-mono text-[10px] text-[#444] font-medium select-none">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#00e87a] shadow-[0_0_6px_#00e87a]" />
          <span>Connected</span>
        </div>
        <div className="ml-auto text-[#333]">
          [ {teams.length} ] TEAMS
        </div>
      </div>
    </div>
  )
}
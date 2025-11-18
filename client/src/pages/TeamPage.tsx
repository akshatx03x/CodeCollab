"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import toast from "react-hot-toast"
import { Users, Plus, Mail } from "lucide-react"
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
  const { token } = useAuth()

  useEffect(() => {
    fetchTeams()
  }, [])

  const fetchTeams = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/teams", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      setTeams(data)
      setLoading(false)
    } catch (error) {
      toast.error("Failed to load teams")
      setLoading(false)
    }
  }

  const createTeam = async () => {
    if (!teamName.trim()) {
      toast.error("Team name required")
      return
    }

    try {
      const response = await fetch("http://localhost:5000/api/teams", {
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
      toast.success("Team created")
    } catch (error) {
      toast.error("Failed to create team")
    }
  }

  const addMember = async (teamId: string) => {
    if (!memberEmail.trim()) {
      toast.error("Email required")
      return
    }

    try {
      const response = await fetch(`http://localhost:5000/api/teams/${teamId}/members`, {
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
      toast.success("Member added")
    } catch (error) {
      toast.error("Failed to add member")
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading teams...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
          >
            <Plus className="w-5 h-5" />
            New Team
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {teams.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No teams yet. Create one to collaborate!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {teams.map((team) => (
              <div key={team._id} className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{team.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{team.description}</p>
                <div className="space-y-3 mb-4">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">{team.members.length}</span> members
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">{team.projects.length}</span> projects
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTeam(team)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition"
                >
                  <Mail className="w-4 h-4" />
                  Invite Member
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Create New Team</h2>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Team name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <textarea
              value={teamDesc}
              onChange={(e) => setTeamDesc(e.target.value)}
              placeholder="Team description"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              rows={3}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={createTeam}
                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {selectedTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Invite to {selectedTeam.name}</h2>
            <input
              type="email"
              value={memberEmail}
              onChange={(e) => setMemberEmail(e.target.value)}
              placeholder="Member email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedTeam(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => addMember(selectedTeam._id)}
                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
              >
                Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

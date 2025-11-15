"use client"

import { useAuth } from "../context/AuthContext"
import { useNavigate } from "react-router-dom"
import { LogOut, Code2, Users, Zap } from "lucide-react"

export default function Navbar() {
  const { logout, user } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <nav className="bg-indigo-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Zap className="w-6 h-6" />
          <span className="font-bold text-lg">CollabCode</span>
        </div>
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 hover:bg-indigo-700 px-3 py-2 rounded-lg transition"
          >
            <Code2 className="w-5 h-5" />
            Projects
          </button>
          <button
            onClick={() => navigate("/teams")}
            className="flex items-center gap-2 hover:bg-indigo-700 px-3 py-2 rounded-lg transition"
          >
            <Users className="w-5 h-5" />
            Teams
          </button>
          <div className="flex items-center gap-3 pl-6 border-l border-indigo-400">
            <span className="text-sm">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 hover:bg-indigo-700 px-3 py-2 rounded-lg transition"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

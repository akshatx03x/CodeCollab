"use client"

import type React from "react"
import { useState } from "react"
import { useAuth } from "../context/AuthContext"
import LoginModal from "./LoginModal"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { token } = useAuth()
  const [showLoginModal, setShowLoginModal] = useState(false)

  if (!token) {
    return (
      <>
        <LoginModal isOpen={true} onClose={() => setShowLoginModal(false)} />
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Welcome to CollabCode</h1>
            <p className="text-slate-400 mb-8">Please log in to access your projects</p>
            <button
              onClick={() => setShowLoginModal(true)}
              className="bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 px-8 py-3 rounded-lg font-medium transition-all hover:shadow-lg hover:shadow-violet-500/50"
            >
              Get Started
            </button>
          </div>
        </div>
      </>
    )
  }

  return <>{children}</>
}
